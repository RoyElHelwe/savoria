<?php
/**
 * Get User Reservations API Endpoint
 * 
 * Retrieve all reservations for the authenticated user
 * 
 * Method: GET
 * Authorization: Required (Bearer token)
 */

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Allow only GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
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

// Get reservations for the user
$query = "SELECT * FROM reservations WHERE user_id = ? ORDER BY date DESC, time DESC";
$params = [$userId];
$types = 'i';
$result = executeQuery($query, $params, $types);

if ($result === null) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Database error']);
    exit;
}

// Format reservations for response
$reservations = [];
foreach ($result as $row) {
    $reservations[] = [
        'id' => (int)$row['id'],
        'date' => $row['date'],
        'time' => $row['time'],
        'name' => $row['name'],
        'email' => $row['email'],
        'phone' => $row['phone'],
        'guests' => (int)$row['guests'],
        'special_requests' => $row['special_requests'],
        'status' => $row['status'],
        'user_id' => (int)$row['user_id'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at']
    ];
}

// Return response
http_response_code(200);
echo json_encode([
    'success' => true,
    'reservations' => $reservations
]);
