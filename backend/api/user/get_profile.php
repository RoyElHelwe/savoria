<?php
/**
 * Get User Profile API
 * 
 * Retrieves the profile information for the authenticated user
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

// Get user profile
$query = "SELECT 
            id, username, email, first_name, last_name, phone, address, role, 
            created_at, updated_at
          FROM 
            users 
          WHERE 
            id = ?";

$stmt = $conn->prepare($query);
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    header("HTTP/1.1 404 Not Found");
    exit(json_encode(['success' => false, 'error' => 'User not found']));
}

$userData = $result->fetch_assoc();

// Count user's orders and reservations
$orderQuery = "SELECT COUNT(*) as total_orders FROM orders WHERE user_id = ?";
$orderStmt = $conn->prepare($orderQuery);
$orderStmt->bind_param("i", $userId);
$orderStmt->execute();
$orderResult = $orderStmt->get_result();
$orderData = $orderResult->fetch_assoc();

$reservationQuery = "SELECT COUNT(*) as total_reservations FROM reservations WHERE user_id = ?";
$reservationStmt = $conn->prepare($reservationQuery);
$reservationStmt->bind_param("i", $userId);
$reservationStmt->execute();
$reservationResult = $reservationStmt->get_result();
$reservationData = $reservationResult->fetch_assoc();

// Format user data for response
$userProfile = [
    'id' => (int)$userData['id'],
    'username' => $userData['username'],
    'email' => $userData['email'],
    'first_name' => $userData['first_name'],
    'last_name' => $userData['last_name'],
    'phone' => $userData['phone'],
    'address' => $userData['address'],
    'role' => $userData['role'],
    'created_at' => $userData['created_at'],
    'updated_at' => $userData['updated_at'],
    'stats' => [
        'total_orders' => (int)$orderData['total_orders'],
        'total_reservations' => (int)$reservationData['total_reservations']
    ]
];

// Return the profile data
echo json_encode(['success' => true, 'profile' => $userProfile]);