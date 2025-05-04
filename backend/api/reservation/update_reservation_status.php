<?php
/**
 * Update Reservation Status API Endpoint
 * 
 * Update the status of a reservation (confirm, cancel, reject, mark as completed)
 * This endpoint is for admin use only
 * 
 * Method: POST
 * Authorization: Required (Bearer token)
 * Body: {
 *   "reservation_id": 123,
 *   "status": "confirmed" | "cancelled" | "completed",
 *   "rejection_reason": "Optional reason for rejection"
 * }
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
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
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
$userId = isset($payload['user_id']) ? $payload['user_id'] : null;

if (!$userId) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'error' => 'User ID not found in token']);
    exit;
}

// Check if the user is an admin or manager
$query = "SELECT role FROM users WHERE id = ?";
$params = [$userId];
$types = 'i';
$result = executeQuery($query, $params, $types);

if (!$result || count($result) === 0) {
    http_response_code(404); // Not Found
    echo json_encode(['success' => false, 'error' => 'User not found']);
    exit;
}

$userRole = $result[0]['role'];

if ($userRole !== 'admin' && $userRole !== 'manager') {
    http_response_code(403); // Forbidden
    echo json_encode(['success' => false, 'error' => 'Access denied. Admin privileges required.']);
    exit;
}

// Get the request body
$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($data['reservation_id']) || !isset($data['status'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Reservation ID and status are required']);
    exit;
}

$reservationId = intval($data['reservation_id']);
$status = $data['status'];
$rejectionReason = isset($data['rejection_reason']) ? $data['rejection_reason'] : null;

// Validate status value
$validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
if (!in_array($status, $validStatuses)) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Invalid status value']);
    exit;
}

// Check if reservation exists
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

// Update reservation status
$query = "UPDATE reservations SET status = ?, updated_at = NOW() WHERE id = ?";
$params = [$status, $reservationId];
$types = 'si';

// If there's a rejection reason, store it in the special_requests field with a prefix
if ($status === 'cancelled' && $rejectionReason) {
    $notePrefix = "CANCELLED: ";
    $specialRequests = $reservation['special_requests'];
    
    // If there are existing special requests, append to them
    if ($specialRequests) {
        $updatedRequests = $specialRequests . "\n\n" . $notePrefix . $rejectionReason;
    } else {
        $updatedRequests = $notePrefix . $rejectionReason;
    }
    
    $query = "UPDATE reservations SET status = ?, special_requests = ?, updated_at = NOW() WHERE id = ?";
    $params = [$status, $updatedRequests, $reservationId];
    $types = 'ssi';
}

// Execute the update query
$result = executeQuery($query, $params, $types);

if ($result === false) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Database error when updating reservation status']);
    exit;
}

// Get the updated reservation
$query = "SELECT r.*, u.username, u.email as user_email
          FROM reservations r
          LEFT JOIN users u ON r.user_id = u.id
          WHERE r.id = ?";
$params = [$reservationId];
$types = 'i';
$result = executeQuery($query, $params, $types);

if ($result === null || count($result) === 0) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Database error when retrieving updated reservation']);
    exit;
}

$updatedReservation = [
    'id' => (int)$result[0]['id'],
    'date' => $result[0]['date'],
    'time' => $result[0]['time'],
    'name' => $result[0]['name'],
    'email' => $result[0]['email'],
    'phone' => $result[0]['phone'],
    'guests' => (int)$result[0]['guests'],
    'special_requests' => $result[0]['special_requests'],
    'status' => $result[0]['status'],
    'user_id' => $result[0]['user_id'] ? (int)$result[0]['user_id'] : null,
    'username' => $result[0]['username'],
    'user_email' => $result[0]['user_email'],
    'created_at' => $result[0]['created_at'],
    'updated_at' => $result[0]['updated_at']
];

// Return success response
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Reservation status updated successfully',
    'reservation' => $updatedReservation
]); 