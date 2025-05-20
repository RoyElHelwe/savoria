<?php
/**
 * Get Order Details - Staff API
 * 
 * Retrieves detailed information about a specific order
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
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/jwt_utils.php';

// Only handle GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header("HTTP/1.1 405 Method Not Allowed");
    exit(json_encode(['success' => false, 'error' => 'Method not allowed']));
}

// Create database connection
$db = new Database();
$conn = $db->getConnection();

// Check if order_id is provided
if (!isset($_GET['id']) || empty($_GET['id'])) {
    exit(json_encode([
        'success' => false,
        'error' => 'Order ID is required'
    ]));
}

$orderId = intval($_GET['id']);

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

// Check if user has staff, manager or admin role
$userId = isset($payload['user_id']) ? $payload['user_id'] : null;
$userRole = isset($payload['role']) ? $payload['role'] : null;

if (!$userId) {
    header("HTTP/1.1 401 Unauthorized");
    exit(json_encode(['success' => false, 'error' => 'Unauthorized: User ID not found in token']));
}

if ($userRole !== 'staff' && $userRole !== 'manager' && $userRole !== 'admin') {
    header("HTTP/1.1 403 Forbidden");
    exit(json_encode(['success' => false, 'error' => 'Access denied. Staff privileges required.']));
}

// Get order details
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
                o.completed_at,
                u.username,
                u.first_name,
                u.last_name,
                u.email,
                u.phone
              FROM 
                orders o
              LEFT JOIN 
                users u ON o.user_id = u.id
              WHERE 
                o.order_id = ?";

$stmt = $conn->prepare($orderQuery);
if ($stmt === false) {
    // Handle prepare error
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
    exit;
}

$stmt->bind_param("i", $orderId);

if (!$stmt->execute()) {
    // Handle execution error
    echo json_encode(['success' => false, 'error' => 'Query execution failed: ' . $stmt->error]);
    exit;
}

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
                m.name,
                m.description,
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
        'name' => $row['name'],
        'description' => $row['description'],
        'image_url' => $row['image_url'],
        'quantity' => (int)$row['quantity'],
        'price' => (float)$row['price_per_unit'],
        'subtotal' => (float)($row['price_per_unit'] * $row['quantity']),
        'special_instructions' => $row['special_instructions']
    ];
}

// Get order history/tracking
$orderHistoryQuery = "SELECT 
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

$trackingStmt = $conn->prepare($orderHistoryQuery);
$tracking = [];

if ($trackingStmt) {
    $trackingStmt->bind_param("i", $orderId);
    $trackingStmt->execute();
    $trackingResult = $trackingStmt->get_result();
    
    while ($row = $trackingResult->fetch_assoc()) {
        $tracking[] = [
            'event_type' => $row['event_type'],
            'status' => $row['status'],
            'details' => $row['details'],
            'timestamp' => $row['timestamp']
        ];
    }
} else {
    // Order tracking might not be implemented yet, so we'll create a basic tracking
    // from the order data
    
    $tracking = [
        [
            'event_type' => 'order_placed',
            'status' => 'pending',
            'details' => 'Order received by the system',
            'timestamp' => $order['created_at']
        ]
    ];
    
    if ($order['status'] !== 'pending') {
        $tracking[] = [
            'event_type' => 'status_update',
            'status' => $order['status'],
            'details' => 'Order status updated to ' . ucfirst($order['status']),
            'timestamp' => $order['updated_at']
        ];
    }
    
    if ($order['completed_at']) {
        $tracking[] = [
            'event_type' => 'order_completed',
            'status' => 'completed',
            'details' => 'Order marked as completed',
            'timestamp' => $order['completed_at']
        ];
    }
}

// Format the order response
$orderResponse = [
    'order_id' => (int)$order['order_id'],
    'user_id' => $order['user_id'] ? (int)$order['user_id'] : null,
    'customer_name' => $order['first_name'] && $order['last_name'] ? 
                        $order['first_name'] . ' ' . $order['last_name'] : 
                        ($order['username'] ?? 'Guest'),
    'customer_email' => $order['email'],
    'customer_phone' => $order['phone'],
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
    'tracking' => $tracking,
    'subtotal' => (float)($order['total_amount'] - $order['delivery_fee'] - $order['tax_amount'])
];

// Return the order details
echo json_encode([
    'success' => true,
    'order' => $orderResponse
]); 