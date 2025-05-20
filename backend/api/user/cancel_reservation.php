<?php
/**
 * Cancel Reservation API
 * 
 * Allows a user to cancel their own reservation
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

// Get user ID from the token payload
$userId = isset($payload['user_id']) ? $payload['user_id'] : null;
$userEmail = isset($payload['email']) ? $payload['email'] : null;

if (!$userId) {
    header("HTTP/1.1 401 Unauthorized");
    exit(json_encode(['success' => false, 'error' => 'Unauthorized: User ID not found in token']));
}

// Get request data
$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['reservation_id'])) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'Reservation ID is required']));
}

$reservationId = intval($data['reservation_id']);

if ($reservationId <= 0) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'Invalid reservation ID']));
}

// Get the reservation to verify ownership and eligibility for cancellation
$getReservationQuery = "SELECT id, user_id, email, date, status FROM reservations WHERE id = ?";
$getReservationStmt = $conn->prepare($getReservationQuery);
$getReservationStmt->bind_param("i", $reservationId);
$getReservationStmt->execute();
$reservationResult = $getReservationStmt->get_result();

if ($reservationResult->num_rows === 0) {
    header("HTTP/1.1 404 Not Found");
    exit(json_encode(['success' => false, 'error' => 'Reservation not found']));
}

$reservation = $reservationResult->fetch_assoc();

// Verify the user owns this reservation (by user_id or email)
if (($reservation['user_id'] !== null && $reservation['user_id'] != $userId) && 
    ($reservation['email'] !== $userEmail)) {
    header("HTTP/1.1 403 Forbidden");
    exit(json_encode(['success' => false, 'error' => 'You do not have permission to cancel this reservation']));
}

// Check if reservation is in a valid state to be cancelled
if ($reservation['status'] === 'cancelled') {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'This reservation is already cancelled']));
}

// Check if reservation date is in the past
if (strtotime($reservation['date']) < strtotime('today')) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'Cannot cancel reservations from the past']));
}

// Optional cancellation reason
$cancellationReason = isset($data['reason']) ? $data['reason'] : 'Cancelled by customer';

// Update reservation status to cancelled
$updateQuery = "UPDATE reservations SET status = 'cancelled', special_requests = CONCAT(IFNULL(special_requests, ''), '\nCANCELLED: ', ?), updated_at = NOW() WHERE id = ?";
$updateStmt = $conn->prepare($updateQuery);
$updateStmt->bind_param("si", $cancellationReason, $reservationId);

if (!$updateStmt->execute()) {
    header("HTTP/1.1 500 Internal Server Error");
    exit(json_encode(['success' => false, 'error' => 'Failed to cancel reservation: ' . $updateStmt->error]));
}

if ($updateStmt->affected_rows === 0) {
    header("HTTP/1.1 500 Internal Server Error");
    exit(json_encode(['success' => false, 'error' => 'Failed to cancel reservation']));
}

// Return success response
echo json_encode([
    'success' => true, 
    'message' => 'Reservation cancelled successfully',
    'reservation_id' => $reservationId
]);