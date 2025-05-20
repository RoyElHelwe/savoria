<?php
/**
 * Get User Orders API
 * 
 * Retrieves order history for a user
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
    exit(json_encode(['success' => false, 'error' => 'Authentication required']));
}

// Validate the JWT and get user ID
$payload = validateJWT($token);

if (!$payload || !isset($payload['user_id'])) {
    header("HTTP/1.1 401 Unauthorized");
    exit(json_encode(['success' => false, 'error' => 'Invalid token']));
}

$userId = $payload['user_id'];

// Set default pagination parameters
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
$offset = ($page - 1) * $limit;

// Prepare the query
$orderQuery = "SELECT 
                o.order_id,
                o.order_type,
                o.status,
                o.total_amount,
                o.payment_method,
                o.payment_status,
                o.delivery_address,
                o.created_at,
                o.updated_at,
                o.completed_at,
                o.delivery_fee,
                o.tax_amount,
                COUNT(oi.order_item_id) as item_count
              FROM 
                orders o
              LEFT JOIN
                order_items oi ON o.order_id = oi.order_id
              WHERE 
                o.user_id = ?
              GROUP BY
                o.order_id
              ORDER BY 
                o.created_at DESC
              LIMIT ?, ?";

// Prepare and execute the query
$stmt = $conn->prepare($orderQuery);
$stmt->bind_param("iii", $userId, $offset, $limit);
$stmt->execute();
$result = $stmt->get_result();

// Count total orders for pagination
$countQuery = "SELECT COUNT(*) as total FROM orders WHERE user_id = ?";
$countStmt = $conn->prepare($countQuery);
$countStmt->bind_param("i", $userId);
$countStmt->execute();
$countResult = $countStmt->get_result();
$totalOrders = $countResult->fetch_assoc()['total'];

// Format the orders
$orders = [];
while ($row = $result->fetch_assoc()) {
    $orders[] = [
        'order_id' => (int)$row['order_id'],
        'order_type' => $row['order_type'],
        'status' => $row['status'],
        'total_amount' => (float)$row['total_amount'],
        'payment_method' => $row['payment_method'],
        'payment_status' => $row['payment_status'],
        'delivery_address' => $row['delivery_address'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
        'completed_at' => $row['completed_at'],
        'delivery_fee' => (float)$row['delivery_fee'],
        'tax_amount' => (float)$row['tax_amount'],
        'item_count' => (int)$row['item_count'],
        'subtotal' => (float)($row['total_amount'] - $row['delivery_fee'] - $row['tax_amount'])
    ];
}

// Return the orders with pagination info
echo json_encode([
    'success' => true,
    'orders' => $orders,
    'pagination' => [
        'total' => (int)$totalOrders,
        'page' => $page,
        'limit' => $limit,
        'total_pages' => ceil($totalOrders / $limit)
    ]
]); 