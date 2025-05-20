<?php
/**
 * Get Active Orders - Staff API
 * 
 * Retrieves all active orders (pending, processing)
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

// Get active orders (pending or processing)
$query = "SELECT 
            o.order_id as id,
            o.user_id,
            o.status,
            o.total_amount,
            o.payment_method,
            o.payment_status,
            o.delivery_address,
            o.notes as special_instructions,
            o.created_at,
            o.updated_at,
            u.username,
            u.first_name,
            u.last_name,
            u.email,
            u.phone,
            (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as item_count
          FROM 
            orders o
          LEFT JOIN 
            users u ON o.user_id = u.id
          WHERE 
            o.status IN ('pending', 'confirmed', 'preparing', 'delivered', 'out for delivery', 'cancelled')
          ORDER BY 
            o.created_at DESC";

$stmt = $conn->prepare($query);
if ($stmt === false) {
    // Handle prepare error
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
    exit;
}

if (!$stmt->execute()) {
    // Handle execution error
    echo json_encode(['success' => false, 'error' => 'Query execution failed: ' . $stmt->error]);
    exit;
}

$result = $stmt->get_result();

$orders = [];

while ($row = $result->fetch_assoc()) {
    $orders[] = [
        'id' => (int)$row['id'],
        'user_id' => $row['user_id'] ? (int)$row['user_id'] : null,
        'customer_name' => $row['first_name'] && $row['last_name'] ? 
                          $row['first_name'] . ' ' . $row['last_name'] : 
                          ($row['username'] ?? 'Guest'),
        'customer_email' => $row['email'],
        'customer_phone' => $row['phone'],
        'status' => $row['status'],
        'total_amount' => (float)$row['total_amount'],
        'payment_method' => $row['payment_method'],
        'payment_status' => $row['payment_status'],
        'delivery_address' => $row['delivery_address'],
        'special_instructions' => $row['special_instructions'],
        'item_count' => (int)$row['item_count'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at']
    ];
}

// Return the orders as JSON
echo json_encode(['success' => true, 'orders' => $orders]); 