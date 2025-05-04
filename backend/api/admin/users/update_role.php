<?php
/**
 * Update User Role - Admin API
 * 
 * Updates a user's role - admin only endpoint
 */

// Allow from any origin
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}

// Include database and authentication utilities
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/jwt_utils.php';

// Only handle PUT requests
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
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
$adminUserId = isset($payload['user_id']) ? $payload['user_id'] : null;
$adminRole = isset($payload['role']) ? $payload['role'] : null;

if (!$adminUserId) {
    header("HTTP/1.1 401 Unauthorized");
    exit(json_encode(['success' => false, 'error' => 'Unauthorized: User ID not found in token']));
}

if ($adminRole !== 'admin' && $adminRole !== 'manager') {
    header("HTTP/1.1 403 Forbidden");
    exit(json_encode(['success' => false, 'error' => 'Access denied. Admin privileges required.']));
}

// Get JSON data
$data = json_decode(file_get_contents("php://input"), true);

// Validate required fields
if (!isset($data['user_id']) || !isset($data['role'])) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'Missing required fields: user_id and role']));
}

$userId = (int)$data['user_id'];
$role = $data['role'];

// Validate role
$validRoles = ['customer', 'staff', 'manager', 'admin'];
if (!in_array($role, $validRoles)) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'Invalid role. Valid roles are: customer, staff, manager, admin']));
}

// Don't allow managers to create admin users or modify admin users
if ($adminRole === 'manager' && ($role === 'admin' || $adminRole !== 'admin')) {
    // Check if target user is an admin
    $targetRoleQuery = "SELECT role FROM users WHERE id = ?";
    $targetRoleStmt = $conn->prepare($targetRoleQuery);
    $targetRoleStmt->bind_param("i", $userId);
    $targetRoleStmt->execute();
    $targetRoleResult = $targetRoleStmt->get_result();
    
    if ($targetRoleResult->num_rows > 0) {
        $targetRole = $targetRoleResult->fetch_assoc()['role'];
        if ($targetRole === 'admin') {
            header("HTTP/1.1 403 Forbidden");
            exit(json_encode(['success' => false, 'error' => 'Managers cannot modify admin users']));
        }
    }
    
    if ($role === 'admin') {
        header("HTTP/1.1 403 Forbidden");
        exit(json_encode(['success' => false, 'error' => 'Managers cannot create admin users']));
    }
}

// Update the user's role
$query = "UPDATE users SET role = ? WHERE id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("si", $role, $userId);
$stmt->execute();

// Check if the update was successful
if ($stmt->affected_rows > 0) {
    echo json_encode(['success' => true, 'message' => "User role updated successfully to $role"]);
} else {
    // Check if the user exists
    $checkUserQuery = "SELECT id FROM users WHERE id = ?";
    $checkUserStmt = $conn->prepare($checkUserQuery);
    $checkUserStmt->bind_param("i", $userId);
    $checkUserStmt->execute();
    $checkUserResult = $checkUserStmt->get_result();
    
    if ($checkUserResult->num_rows === 0) {
        header("HTTP/1.1 404 Not Found");
        echo json_encode(['success' => false, 'error' => 'User not found']);
    } else {
        // The user exists but the role didn't change (might be the same as before)
        echo json_encode(['success' => true, 'message' => 'No changes made to user role']);
    }
} 