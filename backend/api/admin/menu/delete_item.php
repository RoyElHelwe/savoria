<?php
/**
 * Delete Menu Item - Admin API
 * 
 * Deletes a menu item from the database (admin only)
 */

// Allow from any origin
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}

// Include database and authentication utilities
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/jwt_utils.php';

// Only handle DELETE requests
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
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

// Check if user has admin or manager role
$userId = isset($payload['user_id']) ? $payload['user_id'] : null;
$userRole = isset($payload['role']) ? $payload['role'] : null;

if (!$userId) {
    header("HTTP/1.1 401 Unauthorized");
    exit(json_encode(['success' => false, 'error' => 'Unauthorized: User ID not found in token']));
}

if ($userRole !== 'admin' && $userRole !== 'manager') {
    header("HTTP/1.1 403 Forbidden");
    exit(json_encode(['success' => false, 'error' => 'Access denied. Admin privileges required.']));
}

// Get the JSON data
$data = json_decode(file_get_contents("php://input"), true);

// Validate required fields
if (!isset($data['id'])) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'Missing required field: id']));
}

$itemId = (int)$data['id'];

// Check if the menu item exists
$checkItemQuery = "SELECT id FROM menu_items WHERE id = ?";
$checkItemStmt = $conn->prepare($checkItemQuery);

if ($checkItemStmt === false) {
    header("HTTP/1.1 500 Internal Server Error");
    exit(json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]));
}

$checkItemStmt->bind_param("i", $itemId);
$checkItemStmt->execute();
$checkItemResult = $checkItemStmt->get_result();

if ($checkItemResult->num_rows === 0) {
    header("HTTP/1.1 404 Not Found");
    exit(json_encode(['success' => false, 'error' => 'Menu item not found']));
}

// Check if the item is used in any active orders
$checkOrdersQuery = "SELECT COUNT(*) as count FROM order_items 
                    JOIN orders ON order_items.order_id = orders.id
                    WHERE order_items.item_id = ? AND orders.status IN ('pending', 'processing', 'ready')";
$checkOrdersStmt = $conn->prepare($checkOrdersQuery);

if ($checkOrdersStmt === false) {
    header("HTTP/1.1 500 Internal Server Error");
    exit(json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]));
}

$checkOrdersStmt->bind_param("i", $itemId);
$checkOrdersStmt->execute();
$checkOrdersResult = $checkOrdersStmt->get_result();
$orderCount = $checkOrdersResult->fetch_assoc()['count'];

// If item is used in active orders, just mark it as inactive instead of deleting
if ($orderCount > 0) {
    // Update the item to set it as inactive
    $updateQuery = "UPDATE menu_items SET is_active = 0 WHERE id = ?";
    $updateStmt = $conn->prepare($updateQuery);
    
    if ($updateStmt === false) {
        header("HTTP/1.1 500 Internal Server Error");
        exit(json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]));
    }
    
    $updateStmt->bind_param("i", $itemId);
    
    if ($updateStmt->execute()) {
        echo json_encode([
            'success' => true, 
            'message' => 'Menu item is being used in active orders. It has been marked as inactive instead of being deleted.'
        ]);
    } else {
        header("HTTP/1.1 500 Internal Server Error");
        echo json_encode(['success' => false, 'error' => 'Failed to update menu item: ' . $conn->error]);
    }
    
    exit();
}

// Delete the menu item if it's not in active orders
$query = "DELETE FROM menu_items WHERE id = ?";
$stmt = $conn->prepare($query);

if ($stmt === false) {
    header("HTTP/1.1 500 Internal Server Error");
    exit(json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]));
}

$stmt->bind_param("i", $itemId);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Menu item deleted successfully']);
    } else {
        header("HTTP/1.1 404 Not Found");
        echo json_encode(['success' => false, 'error' => 'Menu item not found or already deleted']);
    }
} else {
    header("HTTP/1.1 500 Internal Server Error");
    echo json_encode(['success' => false, 'error' => 'Failed to delete menu item: ' . $conn->error]);
} 