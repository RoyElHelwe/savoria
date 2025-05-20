<?php
/**
 * Get Order API
 * 
 * Retrieves order details
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

$payload = validateJWT($token);

if (!$payload) {
    header("HTTP/1.1 401 Unauthorized");
    exit(json_encode(['success' => false, 'error' => 'Unauthorized: Invalid token']));
}

$userId = isset($payload['user_id']) ? $payload['user_id'] : null;

// Check if order_id is provided
if (!isset($_GET['order_id']) || empty($_GET['order_id'])) {
    exit(json_encode([
        'success' => false,
        'error' => 'Order ID is required'
    ]));
}

$orderId = intval($_GET['order_id']);

// Prepare the query
$orderQuery = "SELECT 
                o.order_id,
                o.user_id,
                o.order_type,
                o.status,
                o.total_amount,
                o.payment_method,
                o.payment_status,
                o.delivery_address,
                o.delivery_fee,
                o.tax_amount,
                o.notes,
                o.created_at,
                o.updated_at,
                o.completed_at
              FROM 
                orders o
              WHERE 
                o.order_id = ?";

// If not admin/staff, restrict to user's own orders
$userRole = $userId ? getUserRole($conn, $userId) : null;
$isStaff = $userRole && in_array($userRole, ['admin', 'staff', 'manager']);

if (!$isStaff) {
    // If not authenticated or not staff, only show user's own orders
    if (!$userId) {
        // No authentication, require order code for guest orders
        if (!isset($_GET['order_code']) || empty($_GET['order_code'])) {
            exit(json_encode([
                'success' => false,
                'error' => 'Authentication required to view order details'
            ]));
        }
        
        // Add order code to the query (not implemented yet - would need a separate table/column)
        exit(json_encode([
            'success' => false,
            'error' => 'Guest order lookup not implemented yet'
        ]));
    } else {
        // User is authenticated but not staff, restrict to their own orders
        $orderQuery .= " AND o.user_id = ?";
    }
}

// Prepare and execute the query
$stmt = $conn->prepare($orderQuery);

if (!$isStaff && $userId) {
    $stmt->bind_param("ii", $orderId, $userId);
} else {
    $stmt->bind_param("i", $orderId);
}

$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    exit(json_encode([
        'success' => false,
        'error' => 'Order not found'
    ]));
}

$order = $result->fetch_assoc();

// Get order items
$itemsQuery = "SELECT 
                oi.order_item_id,
                oi.item_id,
                oi.quantity,
                oi.price_per_unit,
                oi.special_instructions,
                m.name as item_name,
                m.description as item_description,
                m.image_url
               FROM 
                order_items oi
               JOIN
                menu_items m ON oi.item_id = m.item_id
               WHERE 
                oi.order_id = ?";

$itemsStmt = $conn->prepare($itemsQuery);
$itemsStmt->bind_param("i", $orderId);
$itemsStmt->execute();
$itemsResult = $itemsStmt->get_result();

$items = [];
while ($row = $itemsResult->fetch_assoc()) {
    $items[] = [
        'order_item_id' => (int)$row['order_item_id'],
        'item_id' => (int)$row['item_id'],
        'name' => $row['item_name'],
        'description' => $row['item_description'],
        'image_url' => $row['image_url'],
        'quantity' => (int)$row['quantity'],
        'price' => (float)$row['price_per_unit'],
        'subtotal' => (float)($row['price_per_unit'] * $row['quantity']),
        'special_instructions' => $row['special_instructions']
    ];
}

// Add items to the order
$order['items'] = $items;

// Format the order response
$orderResponse = [
    'order_id' => (int)$order['order_id'],
    'user_id' => $order['user_id'] ? (int)$order['user_id'] : null,
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
    'items' => $items,
    'subtotal' => (float)($order['total_amount'] - $order['delivery_fee'] - $order['tax_amount'])
];

// Return the order details
echo json_encode([
    'success' => true,
    'order' => $orderResponse
]);

/**
 * Get user role from database
 */
function getUserRole($conn, $userId) {
    $query = "SELECT role as role_name FROM users 
              WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        return $result->fetch_assoc()['role_name'];
    }
    
    return null;
} 