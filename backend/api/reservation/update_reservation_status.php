<?php
/**
 * Update Reservation Status API Endpoint
 * 
 * Update the status of a reservation (confirm, cancel, reject, mark as completed)
 * This endpoint is for admin use only
 * Includes WhatsApp notification to customer with improved timeout handling
 * 
 * Method: POST
 * Authorization: Required (Bearer token)
 * Body: {
 *   "reservation_id": 123,
 *   "status": "confirmed" | "cancelled" | "completed",
 *   "rejection_reason": "Optional reason for rejection",
 *   "send_notification": true | false  // Whether to send WhatsApp notification
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

// Check if WhatsApp service exists and include it
$whatsappServicePath = __DIR__ . '/../../utils/whatsapp-service-hardcoded.php';
$whatsappEnabled = file_exists($whatsappServicePath);

if ($whatsappEnabled) {
    require_once $whatsappServicePath;
    error_log("WhatsApp service loaded successfully from: $whatsappServicePath");
} else {
    error_log("WhatsApp service file not found at: $whatsappServicePath");
}

// Create database connection
$db = new Database();
$conn = $db->getConnection();

// Get and validate JWT token
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
$stmt = $conn->prepare($query);

if ($stmt === false) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
    exit;
}

$stmt->bind_param('i', $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404); // Not Found
    echo json_encode(['success' => false, 'error' => 'User not found']);
    exit;
}

$userRole = $result->fetch_assoc()['role'];

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
$sendNotification = isset($data['send_notification']) ? (bool) $data['send_notification'] : true;

// Validate status value
$validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
if (!in_array($status, $validStatuses)) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Invalid status value']);
    exit;
}

// Check if reservation exists
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
    $stmt = $conn->prepare($query);

    if ($stmt === false) {
        http_response_code(500); // Internal Server Error
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
        exit;
    }

    $stmt->bind_param('ssi', $status, $updatedRequests, $reservationId);
} else {
    $stmt = $conn->prepare($query);

    if ($stmt === false) {
        http_response_code(500); // Internal Server Error
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
        exit;
    }

    $stmt->bind_param('si', $status, $reservationId);
}

// Execute the update query
$result = $stmt->execute();

if (!$result) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Database error when updating reservation status: ' . $stmt->error]);
    exit;
}

// Get the updated reservation
$query = "SELECT r.*, u.username, u.email as user_email
          FROM reservations r
          LEFT JOIN users u ON r.user_id = u.id
          WHERE r.id = ?";
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
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Database error when retrieving updated reservation']);
    exit;
}

$updatedReservation = $result->fetch_assoc();

// Prepare the response data
$formattedReservation = [
    'id' => (int) $updatedReservation['id'],
    'date' => $updatedReservation['date'],
    'time' => $updatedReservation['time'],
    'name' => $updatedReservation['name'],
    'email' => $updatedReservation['email'],
    'phone' => $updatedReservation['phone'],
    'guests' => (int) $updatedReservation['guests'],
    'special_requests' => $updatedReservation['special_requests'],
    'status' => $updatedReservation['status'],
    'user_id' => $updatedReservation['user_id'] ? (int) $updatedReservation['user_id'] : null,
    'username' => $updatedReservation['username'],
    'user_email' => $updatedReservation['user_email'],
    'created_at' => $updatedReservation['created_at'],
    'updated_at' => $updatedReservation['updated_at']
];

// Send WhatsApp notification if enabled and WhatsApp service is available
$notificationSent = false;
$notificationError = null;

if ($whatsappEnabled && $sendNotification && !empty($updatedReservation['phone'])) {
    try {
        // Set a shorter execution time limit for this section
        $originalTimeLimit = ini_get('max_execution_time');
        set_time_limit(30); // 30 seconds max
        
        $phone = $updatedReservation['phone'];
        $customerName = $updatedReservation['name'];
        $reservationDate = date('l, F j, Y', strtotime($updatedReservation['date']));
        $reservationTime = date('g:i A', strtotime($updatedReservation['time']));
        $guests = (int) $updatedReservation['guests'];

        // Log attempt to send notification
        error_log("Attempting to send WhatsApp notification to $phone for reservation #$reservationId");

        // Set default result
        $notificationResult = ['success' => false, 'error' => 'Unknown status'];
        
        switch ($status) {
            case 'confirmed':
                if (function_exists('sendReservationConfirmationMessage')) {
                    $notificationResult = sendReservationConfirmationMessage(
                        $phone,
                        $customerName,
                        $reservationDate,
                        $reservationTime,
                        $guests
                    );
                }
                break;

            case 'cancelled':
                if (function_exists('sendReservationCancellationMessage')) {
                    $notificationResult = sendReservationCancellationMessage(
                        $phone,
                        $customerName,
                        $reservationDate,
                        $reservationTime,
                        $rejectionReason
                    );
                }
                break;

            case 'completed':
                // Optional: send a thank you message or feedback request
                break;
        }

        $notificationSent = isset($notificationResult['success']) ? $notificationResult['success'] : false;
        $notificationError = isset($notificationResult['error']) ? $notificationResult['error'] : null;
        
        // Log result
        if ($notificationSent) {
            error_log("Successfully sent WhatsApp notification for reservation #$reservationId");
        } else if ($notificationError) {
            error_log("WhatsApp notification error: $notificationError");
        }
        
        // Restore original time limit
        set_time_limit($originalTimeLimit);
    } catch (Exception $e) {
        $notificationError = $e->getMessage();
        // Log the error but don't fail the API request
        error_log("WhatsApp notification error for reservation #$reservationId: " . $e->getMessage());
    }
} else if (!$whatsappEnabled && $sendNotification) {
    $notificationError = "WhatsApp service is not available";
    error_log("WhatsApp service not available when trying to send notification for reservation #$reservationId");
}

// Return success response
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Reservation status updated successfully',
    'reservation' => $formattedReservation,
    'notification' => [
        'sent' => $notificationSent,
        'error' => $notificationError,
        'service_available' => $whatsappEnabled
    ]
]);