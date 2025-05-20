<?php
/**
 * Get User Orders API
 * 
 * Retrieves all orders for the authenticated user
 */

// Allow from any origin
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit;
}

// Include database and authentication utilities
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/jwt_utils.php';

// Only handle GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header("HTTP/1.1 405 Method Not Allowed");
    exit(json_encode(['success' => false, 'error' => 'Method not allowed']));
}

// Create database connection
$db = new Database();
$conn = $db->getConnection();

// Get JWT from header
$token = getJWTFromHeader();

if (!$token) {
    header("HTTP/1.1 401 Unauthorized");
    exit(json_encode(['success' => false, 'error' => 'Unauthorized: No token provided']));
}

// Validate the JWT and get the payload
$payload = validateJWT($token);

if (!$payload) {
    header("HTTP/1.1 401 Unauthorized");
    exit(json_encode(['success' => false, 'error' => 'Unauthorized: Invalid token']));
}

// Get user ID from the token payload
$userId = isset($payload['user_id']) ? $payload['user_id'] : null;

if (!$userId) {
    header("HTTP/1.1 401 Unauthorized");
    exit(json_encode(['success' => false, 'error' => 'Unauthorized: User ID not found in token']));
}

// Get pagination parameters
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
$status = isset($_GET['status']) ? $_GET['status'] : null;

// Validate pagination parameters
if ($page < 1) $page = 1;
if ($limit < 1 || $limit > 50) $limit = 10;

// Calculate offset
$offset = ($page - 1) * $limit;

// Build query based on parameters
$queryParams = [];
$queryTypes = "";
$whereClause = "WHERE user_id = ?";
$queryParams[] = $userId;
$queryTypes .= "i";

// Add status filter if provided
if ($status) {
    $validStatuses = ['pending', 'confirmed', 'preparing', 'out for delivery', 'delivered', 'ready for pickup', 'completed', 'cancelled'];
    
    if (in_array($status, $validStatuses)) {
        $whereClause .= " AND status = ?";
        $queryParams[] = $status;
        $queryTypes .= "s";
    }
}

// Get total count of orders
$countQuery = "SELECT COUNT(*) as total FROM orders " . $whereClause;
$countStmt = $conn->prepare($countQuery);

if ($countStmt === false) {
    header("HTTP/1.1 500 Internal Server Error");
    exit(json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]));
}

// Bind parameters dynamically
if (!empty($queryParams)) {
    $countStmt->bind_param($queryTypes, ...$queryParams);
}

$countStmt->execute();
$countResult = $countStmt->get_result();
$totalOrders = $countResult->fetch_assoc()['total'];

// Calculate total pages
$totalPages = ceil($totalOrders / $limit);

// Get orders with pagination
$ordersQuery = "SELECT 
                    order_id, 
                    order_type, 
                    status, 
                    total_amount, 
                    payment_method, 
                    payment_status, 
                    delivery_address, 
                    delivery_fee, 
                    tax_amount, 
                    notes, 
                    created_at, 
                    updated_at, 
                    completed_at 
                FROM 
                    orders 
                " . $whereClause . " 
                ORDER BY 
                    created_at DESC 
                LIMIT ?, ?";

$queryParams[] = $offset;
$queryParams[] = $limit;
$queryTypes .= "ii";

$ordersStmt = $conn->prepare($ordersQuery);

if ($ordersStmt === false) {
    header("HTTP/1.1 500 Internal Server Error");
    exit(json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]));
}

// Bind parameters dynamically
$ordersStmt->bind_param($queryTypes, ...$queryParams);
$ordersStmt->execute();
$ordersResult = $ordersStmt->get_result();

$orders = [];

while ($order = $ordersResult->fetch_assoc()) {
    // Get order items for this order
    $itemsQuery = "SELECT 
                    oi.item_id, 
                    oi.quantity, 
                    oi.price_per_unit, 
                    oi.special_instructions,
                    m.name, 
                    m.image_url
                FROM 
                    order_items oi
                LEFT JOIN 
                    menu_items m ON oi.item_id = m.item_id
                WHERE 
                    oi.order_id = ?";
                    
    $itemsStmt = $conn->prepare($itemsQuery);
    
    if ($itemsStmt === false) {
        // Log error but continue with the order without items
        error_log("Error preparing items query for order {$order['order_id']}: " . $conn->error);
        $orderItems = [];
    } else {
        $itemsStmt->bind_param("i", $order['order_id']);
        $itemsStmt->execute();
        $itemsResult = $itemsStmt->get_result();
        
        $orderItems = [];
        while ($item = $itemsResult->fetch_assoc()) {
            $orderItems[] = [
                'item_id' => (int)$item['item_id'],
                'name' => $item['name'],
                'quantity' => (int)$item['quantity'],
                'price_per_unit' => (float)$item['price_per_unit'],
                'special_instructions' => $item['special_instructions'],
                'image_url' => $item['image_url']
            ];
        }
    }
    
    // Get order tracking info
    $trackingQuery = "SELECT 
                        id, 
                        event_type, 
                        status, 
                        details, 
                        timestamp
                    FROM 
                        order_tracking
                    WHERE 
                        order_id = ?
                    ORDER BY 
                        timestamp ASC";
                    
    $trackingStmt = $conn->prepare($trackingQuery);
    
    $trackingEvents = [];
    
    if ($trackingStmt !== false) {
        $trackingStmt->bind_param("i", $order['order_id']);
        $trackingStmt->execute();
        $trackingResult = $trackingStmt->get_result();
        
        while ($event = $trackingResult->fetch_assoc()) {
            $trackingEvents[] = [
                'id' => (int)$event['id'],
                'event_type' => $event['event_type'],
                'status' => $event['status'],
                'details' => $event['details'],
                'timestamp' => $event['timestamp']
            ];
        }
    }
    
    // Format order data
    $orders[] = [
        'order_id' => (int)$order['order_id'],
        'order_type' => $order['order_type'],
        'status' => $order['status'],
        'total_amount' => (float)$order['total_amount'],
        'payment_method' => $order['payment_method'],
        'payment_status' => $order['payment_status'],
        'delivery_address' => $order['delivery_address'],
        'delivery_fee' => (float)$order['delivery_fee'],
        'tax_amount' => (float)$order['tax_amount'],
        'notes' => $order['notes'],
        'created_at' => $order['created_at'],
        'updated_at' => $order['updated_at'],
        'completed_at' => $order['completed_at'],
        'items' => $orderItems,
        'tracking' => $trackingEvents
    ];
}

// Pagination metadata
$pagination = [
    'current_page' => $page,
    'per_page' => $limit,
    'total_items' => (int)$totalOrders,
    'total_pages' => $totalPages
];

// Return the orders
echo json_encode([
    'success' => true, 
    'orders' => $orders,
    'pagination' => $pagination
]);