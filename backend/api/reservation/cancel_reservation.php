<?php
/**
 * Cancel Reservation API Endpoint
 * 
 * Cancel an existing reservation
 * 
 * Method: POST
 * Authorization: Required (Bearer token)
 * Request body: JSON with reservation_id
 */

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Allow only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Include required files
require_once '../../config/database.php';
require_once '../../config/jwt_utils.php';

// Create database connection
$db = new Database();
$conn = $db->getConnection();

// Get the JWT from the Authorization header
$jwt = getJWTFromHeader();

if (!$jwt) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'error' => 'Authentication required']);
    exit;
}

// Validate the JWT
$payload = validateJWT($jwt);

if (!$payload) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'error' => 'Invalid token']);
    exit;
}

// Get user ID from the JWT payload
$userId = isset($payload['user_id']) ? $payload['user_id'] : null;

if (!$userId) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'error' => 'Invalid token payload']);
    exit;
}

// Get and validate the request body
$requestBody = file_get_contents('php://input');
$data = json_decode($requestBody, true);

if (!$data || !isset($data['reservation_id']) || !is_numeric($data['reservation_id'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Reservation ID is required']);
    exit;
}

$reservationId = (int)$data['reservation_id'];

// Check if the reservation exists and belongs to the user
$query = "SELECT * FROM reservations WHERE id = ?";
$stmt = $conn->prepare($query);

if ($stmt === false) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
    exit;
}

$stmt->bind_param('i', $reservationId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404); // Not Found
    echo json_encode(['success' => false, 'error' => 'Reservation not found']);
    exit;
}

$reservation = $result->fetch_assoc();

// Check if the user owns the reservation or is an admin
$isAdmin = false;
$userRoleQuery = "SELECT role FROM users WHERE id = ?";
$userRoleStmt = $conn->prepare($userRoleQuery);

if ($userRoleStmt === false) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
    exit;
}

$userRoleStmt->bind_param('i', $userId);
$userRoleStmt->execute();
$userRoleResult = $userRoleStmt->get_result();

if ($userRoleResult->num_rows > 0) {
    $userRole = $userRoleResult->fetch_assoc();
    $isAdmin = $userRole['role'] === 'admin' || $userRole['role'] === 'manager';
}

// Check if user has permission to cancel this reservation
if (!$isAdmin && ($reservation['user_id'] === null || $reservation['user_id'] != $userId)) {
    // Check if the email matches for non-logged-in reservations
    $email = isset($payload['email']) ? $payload['email'] : '';
    if (empty($email) || $email !== $reservation['email']) {
        http_response_code(403); // Forbidden
        echo json_encode(['success' => false, 'error' => 'You do not have permission to cancel this reservation']);
        exit;
    }
}

// Check if the reservation can be cancelled (not already cancelled)
if ($reservation['status'] === 'cancelled') {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Reservation is already cancelled']);
    exit;
}

// Update the reservation status to cancelled
$updateQuery = "UPDATE reservations SET status = 'cancelled', updated_at = NOW() WHERE id = ?";
$updateStmt = $conn->prepare($updateQuery);

if ($updateStmt === false) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
    exit;
}

$updateStmt->bind_param('i', $reservationId);
$success = $updateStmt->execute();

if (!$success) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Failed to cancel reservation: ' . $updateStmt->error]);
    exit;
}

// Get the updated reservation
$getUpdatedQuery = "SELECT * FROM reservations WHERE id = ?";
$getUpdatedStmt = $conn->prepare($getUpdatedQuery);

if ($getUpdatedStmt === false) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
    exit;
}

$getUpdatedStmt->bind_param('i', $reservationId);
$getUpdatedStmt->execute();
$updatedResult = $getUpdatedStmt->get_result();

if ($updatedResult->num_rows === 0) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Failed to retrieve updated reservation']);
    exit;
}

$reservation = $updatedResult->fetch_assoc();

// Convert numeric fields to proper types
$reservation['id'] = (int)$reservation['id'];
$reservation['guests'] = (int)$reservation['guests'];
if ($reservation['user_id'] !== null) {
    $reservation['user_id'] = (int)$reservation['user_id'];
}

// Return success response
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Reservation cancelled successfully',
    'reservation' => $reservation
]);