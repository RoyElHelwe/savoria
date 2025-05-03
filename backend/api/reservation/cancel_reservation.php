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

// Get the JWT from the Authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'error' => 'Authentication required']);
    exit;
}

$jwt = $matches[1];

// Validate the JWT
$payload = validateJWT($jwt);

if (!$payload) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'error' => 'Invalid token']);
    exit;
}

// Get user ID from the JWT payload
$userId = isset($payload->user_id) ? $payload->user_id : null;

if (!$userId) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'error' => 'Invalid token']);
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
$params = [$reservationId];
$types = 'i';
$result = executeQuery($query, $params, $types);

if (!$result || count($result) === 0) {
    http_response_code(404); // Not Found
    echo json_encode(['success' => false, 'error' => 'Reservation not found']);
    exit;
}

$reservation = $result[0];

// Check if the user owns the reservation or is an admin
$isAdmin = false;
$userRoleQuery = "SELECT role FROM users WHERE id = ?";
$userRoleParams = [$userId];
$userRoleTypes = 'i';
$userRoleResult = executeQuery($userRoleQuery, $userRoleParams, $userRoleTypes);

if ($userRoleResult && count($userRoleResult) > 0) {
    $isAdmin = $userRoleResult[0]['role'] === 'admin' || $userRoleResult[0]['role'] === 'manager';
}

if (!$isAdmin && $reservation['user_id'] != $userId) {
    http_response_code(403); // Forbidden
    echo json_encode(['success' => false, 'error' => 'You do not have permission to cancel this reservation']);
    exit;
}

// Check if the reservation can be cancelled (not already cancelled)
if ($reservation['status'] === 'cancelled') {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Reservation is already cancelled']);
    exit;
}

// Update the reservation status to cancelled
$query = "UPDATE reservations SET status = 'cancelled', updated_at = NOW() WHERE id = ?";
$params = [$reservationId];
$types = 'i';
$result = executeQuery($query, $params, $types);

if ($result === false) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Failed to cancel reservation']);
    exit;
}

// Get the updated reservation
$query = "SELECT * FROM reservations WHERE id = ?";
$params = [$reservationId];
$types = 'i';
$result = executeQuery($query, $params, $types);

if (!$result || count($result) === 0) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Failed to retrieve updated reservation']);
    exit;
}

$reservation = $result[0];
$reservation['id'] = (int)$reservation['id'];
$reservation['guests'] = (int)$reservation['guests'];
if ($reservation['user_id'] !== null) {
    $reservation['user_id'] = (int)$reservation['user_id'];
}

// Return success response
http_response_code(200);
echo json_encode([
    'success' => true,
    'reservation' => $reservation
]); 