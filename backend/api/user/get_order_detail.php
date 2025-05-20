<?php
/**
 * Get Order Detail API
 * 
 * Retrieves detailed information about a specific order for the authenticated user
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

// Get order ID from query parameters
if (!isset($_GET['id'])) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'Order ID is required']));
}

$orderId = intval($_GET['id']);

if ($orderId <= 0) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'Invalid order ID']));
}

// Get order details
$orderQuery = "SELECT 
                o.order_id, 
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
                o.order_id = ? AND o.user_id = ?";

$orderStmt = $conn->prepare($orderQuery);
$orderStmt->bind_param("ii", $orderId, $userId);
$orderStmt->execute();
$orderResult = $orderStmt->get_result();

if ($orderResult->num_rows === 0) {
    header("HTTP/1.1 404 Not Found");
    exit(json_encode(['success' => false, 'error' => 'Order not found or you do not have permission to view it']));
}

$orderData = $orderResult->fetch_assoc();

// Get order items
$itemsQuery = "SELECT 
                oi.item_id, 
                oi.quantity, 
                oi.price_per_unit, 
                oi.special_instructions,
                m.name, 
                m.image_url,
                m.description
              FROM 
                order_items oi
              LEFT JOIN 
                menu_items m ON oi.item_id = m.item_id
              WHERE 
                oi.order_id = ?";

$itemsStmt = $conn->prepare($itemsQuery);
$itemsStmt->bind_param("i", $orderId);
$itemsStmt->execute();
$itemsResult = $itemsStmt->get_result();

$orderItems = [];
while ($item = $itemsResult->fetch_assoc()) {
    $orderItems[] = [
        'item_id' => (int)$item['item_id'],
        'name' => $item['name'],
        'description' => $item['description'],
        'quantity' => (int)$item['quantity'],
        'price_per_unit' => (float)$item['price_per_unit'],
        'special_instructions' => $item['special_instructions'],
        'image_url' => $item['image_url'],
        'subtotal' => (float)$item['price_per_unit'] * (int)$item['quantity']
    ];
}

// Get order tracking events
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
$trackingStmt->bind_param("i", $orderId);
$trackingStmt->execute();
$trackingResult = $trackingStmt->get_result();

$trackingEvents = [];
while ($event = $trackingResult->fetch_assoc()) {
    $trackingEvents[] = [
        'id' => (int)$event['id'],
        'event_type' => $event['event_type'],
        'status' => $event['status'],
        'details' => $event['details'],
        'timestamp' => $event['timestamp']
    ];
}

// Format order data for response
$order = [
    'order_id' => (int)$orderData['order_id'],
    'order_type' => $orderData['order_type'],
    'status' => $orderData['status'],
    'total_amount' => (float)$orderData['total_amount'],
    'payment_method' => $orderData['payment_method'],
    'payment_status' => $orderData['payment_status'],
    'delivery_address' => $orderData['delivery_address'],
    'delivery_fee' => (float)$orderData['delivery_fee'],
    'tax_amount' => (float)$orderData['tax_amount'],
    'notes' => $orderData['notes'],
    'created_at' => $orderData['created_at'],
    'updated_at' => $orderData['updated_at'],
    'completed_at' => $orderData['completed_at'],
    'items' => $orderItems,
    'tracking' => $trackingEvents,
    // Calculate subtotal (total amount - tax - delivery fee)
    'subtotal' => (float)$orderData['total_amount'] - (float)$orderData['tax_amount'] - (float)$orderData['delivery_fee']
];

// Return the order details
echo json_encode(['success' => true, 'order' => $order]);