<?php
/**
 * Update Order Status API
 * 
 * Allows staff and admins to update order status
 */

// Allow from any origin
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit;
}

// Include database and authentication utilities
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/jwt_utils.php';

// Only handle POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("HTTP/1.1 405 Method Not Allowed");
    exit(json_encode(['success' => false, 'error' => 'Method not allowed']));
}

// Create database connection
$db = new Database();
$conn = $db->getConnection();

// Get JWT from header and verify authentication
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

// Check user role - only staff and admin can update order status
$userRole = getUserRole($conn, $userId);

if (!$userRole || !in_array($userRole, ['admin', 'staff', 'manager'])) {
    header("HTTP/1.1 403 Forbidden");
    exit(json_encode(['success' => false, 'error' => 'You do not have permission to update order status']));
}

// Get POST data
$data = json_decode(file_get_contents("php://input"));

// Validate required fields
if (!isset($data->order_id) || !isset($data->status)) {
    exit(json_encode([
        'success' => false, 
        'error' => 'Order ID and status are required'
    ]));
}

// Validate status values
$allowedStatuses = ['pending', 'confirmed', 'preparing', 'out for delivery', 'delivered', 'ready for pickup', 'completed', 'cancelled'];

if (!in_array(strtolower($data->status), $allowedStatuses)) {
    exit(json_encode([
        'success' => false,
        'error' => 'Invalid status value provided'
    ]));
}

try {
    // Update order status
    $query = "UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("si", $data->status, $data->order_id);
    
    if ($stmt->execute()) {
        // Check if the order is being marked as completed
        if (in_array(strtolower($data->status), ['delivered', 'completed'])) {
            // Update the completed_at timestamp
            $completedQuery = "UPDATE orders SET completed_at = NOW() WHERE order_id = ?";
            $completedStmt = $conn->prepare($completedQuery);
            $completedStmt->bind_param("i", $data->order_id);
            $completedStmt->execute();
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Order status updated successfully'
        ]);
    } else {
        throw new Exception("Failed to update order status: " . $stmt->error);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

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