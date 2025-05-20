<?php
/**
 * Update Password API
 * 
 * Updates the password for the authenticated user
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

// Get and validate JWT token
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

// Get request body
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'Invalid request data']));
}

// Validate required fields
if (!isset($data['current_password']) || !isset($data['new_password'])) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'Current password and new password are required']));
}

// Validate new password length
if (strlen($data['new_password']) < 8) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'New password must be at least 8 characters long']));
}

// Get user from database to check password
$userQuery = "SELECT password FROM users WHERE id = ?";
$userStmt = $conn->prepare($userQuery);
$userStmt->bind_param("i", $userId);
$userStmt->execute();
$userResult = $userStmt->get_result();

if ($userResult->num_rows === 0) {
    header("HTTP/1.1 404 Not Found");
    exit(json_encode(['success' => false, 'error' => 'User not found']));
}

$userData = $userResult->fetch_assoc();

// Verify current password
if (!password_verify($data['current_password'], $userData['password'])) {
    header("HTTP/1.1 401 Unauthorized");
    exit(json_encode(['success' => false, 'error' => 'Current password is incorrect']));
}

// Hash new password
$newPasswordHash = password_hash($data['new_password'], PASSWORD_DEFAULT);

// Update password in database
$updateQuery = "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?";
$updateStmt = $conn->prepare($updateQuery);
$updateStmt->bind_param("si", $newPasswordHash, $userId);

if (!$updateStmt->execute()) {
    header("HTTP/1.1 500 Internal Server Error");
    exit(json_encode(['success' => false, 'error' => 'Failed to update password: ' . $updateStmt->error]));
}

// Check if any rows were affected
if ($updateStmt->affected_rows === 0) {
    header("HTTP/1.1 500 Internal Server Error");
    exit(json_encode(['success' => false, 'error' => 'Failed to update password']));
}

// Return success response
echo json_encode(['success' => true, 'message' => 'Password updated successfully']);