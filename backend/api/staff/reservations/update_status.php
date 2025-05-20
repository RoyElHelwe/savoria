<?php
/**
 * Update Reservation Status - Staff API
 * 
 * Allows staff to update the status of a reservation (confirm, cancel, etc.)
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
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/jwt_utils.php';

// Only handle POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

// Check if user has staff, manager or admin role
$userId = isset($payload['user_id']) ? $payload['user_id'] : null;
$userRole = isset($payload['role']) ? $payload['role'] : null;

if (!$userId) {
    header("HTTP/1.1 401 Unauthorized");
    exit(json_encode(['success' => false, 'error' => 'Unauthorized: User ID not found in token']));
}

if ($userRole !== 'staff' && $userRole !== 'manager' && $userRole !== 'admin') {
    header("HTTP/1.1 403 Forbidden");
    exit(json_encode(['success' => false, 'error' => 'Access denied. Staff privileges required.']));
}

// Get POST data
$data = json_decode(file_get_contents("php://input"));

// Check if required fields are present
if (!isset($data->reservation_id) || !isset($data->status)) {
    exit(json_encode([
        'success' => false,
        'error' => 'Reservation ID and status are required'
    ]));
}

$reservationId = $data->reservation_id;
$status = $data->status;

// Validate status (only allow valid statuses)
$allowedStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
if (!in_array($status, $allowedStatuses)) {
    exit(json_encode([
        'success' => false,
        'error' => 'Invalid status. Allowed statuses are: ' . implode(', ', $allowedStatuses)
    ]));
}

// Check if reservation exists
$checkQuery = "SELECT id FROM reservations WHERE id = ?";
$checkStmt = $conn->prepare($checkQuery);
$checkStmt->bind_param("i", $reservationId);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows === 0) {
    exit(json_encode([
        'success' => false,
        'error' => 'Reservation not found'
    ]));
}

// Update reservation status
$query = "UPDATE reservations SET status = ?, updated_at = NOW() WHERE id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("si", $status, $reservationId);

if ($stmt->execute()) {
    // Get the updated reservation
    $getQuery = "SELECT * FROM reservations WHERE id = ?";
    $getStmt = $conn->prepare($getQuery);
    $getStmt->bind_param("i", $reservationId);
    $getStmt->execute();
    $result = $getStmt->get_result();
    $reservation = $result->fetch_assoc();
    
    echo json_encode([
        'success' => true,
        'message' => 'Reservation status updated successfully',
        'reservation' => $reservation
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Failed to update reservation status: ' . $stmt->error
    ]);
} 