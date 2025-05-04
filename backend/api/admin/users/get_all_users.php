<?php
/**
 * Get All Users - Admin API
 * 
 * Retrieves all users from database (admin only)
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

// Query to get all users with limited sensitive information
$query = "SELECT id, username, email, first_name, last_name, phone, address, role, created_at 
          FROM users 
          ORDER BY created_at DESC";

$stmt = $conn->prepare($query);

// Check if prepare statement was successful
if ($stmt === false) {
    header("HTTP/1.1 500 Internal Server Error");
    exit(json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]));
}

$stmt->execute();
$result = $stmt->get_result();

$users = [];

while ($row = $result->fetch_assoc()) {
    // Don't include password hash or other sensitive information
    $users[] = [
        'id' => (int)$row['id'],
        'username' => $row['username'],
        'email' => $row['email'],
        'first_name' => $row['first_name'],
        'last_name' => $row['last_name'],
        'phone' => $row['phone'],
        'address' => $row['address'],
        'role' => $row['role'],
        'created_at' => $row['created_at']
    ];
}

// Return the users as JSON
echo json_encode(['success' => true, 'data' => $users]); 