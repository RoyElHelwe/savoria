<?php
/**
 * Create Reservation API Endpoint
 * 
 * Create a new reservation
 * 
 * Method: POST
 * Authorization: Optional (Bearer token for logged-in users)
 * Request body: JSON with reservation data
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

// Get and validate the request body
$requestBody = file_get_contents('php://input');
$data = json_decode($requestBody, true);

if (!$data) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Invalid request data']);
    exit;
}

// Normalize field names to handle different naming conventions
$normalizedData = [];
// Map all possible field names to their standard names
$fieldMapping = [
    'name' => 'name',
    'customer_name' => 'name',
    'email' => 'email',
    'customer_email' => 'email',
    'phone' => 'phone',
    'customer_phone' => 'phone',
    'date' => 'date',
    'reservation_date' => 'date',
    'time' => 'time',
    'reservation_time' => 'time',
    'guests' => 'guests',
    'party_size' => 'guests',
    'special_requests' => 'special_requests',
    'specialRequests' => 'special_requests'
];

// Loop through the field mapping and set normalized values
foreach ($fieldMapping as $originalField => $normalizedField) {
    if (isset($data[$originalField]) && !empty($data[$originalField])) {
        $normalizedData[$normalizedField] = $data[$originalField];
    }
}

// Replace original data with normalized data
$data = $normalizedData;

// Debug log
error_log("Normalized reservation data: " . json_encode($data));

// Required fields validation
$requiredFields = ['date', 'time', 'name', 'email', 'phone', 'guests'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field]) || empty($data[$field])) {
        http_response_code(400); // Bad Request
        echo json_encode(['success' => false, 'error' => "Field '$field' is required"]);
        exit;
    }
}

// Validate date format (YYYY-MM-DD)
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Invalid date format. Use YYYY-MM-DD']);
    exit;
}

// Check if date is in the past
$today = date('Y-m-d');
if ($data['date'] < $today) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Cannot make reservations for past dates']);
    exit;
}

// Validate time format (HH:MM)
if (!preg_match('/^([01][0-9]|2[0-3]):[0-5][0-9]$/', $data['time'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Invalid time format. Use HH:MM (24-hour format)']);
    exit;
}

// Validate email
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Invalid email format']);
    exit;
}

// Validate number of guests
$guests = (int)$data['guests'];
if ($guests < 1 || $guests > 20) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Number of guests must be between 1 and 20']);
    exit;
}

// Check if time slot is available
$query = "SELECT COUNT(*) as reservation_count FROM reservations WHERE date = ? AND time = ? AND status != 'cancelled'";
$params = [$data['date'], $data['time']];
$types = 'ss';
$result = executeQuery($query, $params, $types);

if (!$result) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Database error checking time slot availability']);
    exit;
}

$maxReservationsPerSlot = 5;
if ((int)$result[0]['reservation_count'] >= $maxReservationsPerSlot) {
    http_response_code(409); // Conflict
    echo json_encode(['success' => false, 'error' => 'This time slot is no longer available. Please choose another time.']);
    exit;
}

// Check if user is authenticated
$userId = null;
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (!empty($authHeader) && preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $jwt = $matches[1];
    $payload = validateJWT($jwt);
    
    if ($payload && isset($payload->user_id)) {
        $userId = $payload->user_id;
    }
}

// Prepare special requests
$specialRequests = isset($data['special_requests']) ? $data['special_requests'] : null;

// Insert reservation
$query = "INSERT INTO reservations (date, time, name, email, phone, guests, special_requests, status, user_id) 
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)";
$params = [
    $data['date'],
    $data['time'],
    $data['name'],
    $data['email'],
    $data['phone'],
    $guests,
    $specialRequests,
    $userId
];
$types = 'sssssisi';

$result = executeQuery($query, $params, $types);

if ($result === false) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Failed to create reservation']);
    exit;
}

// Get the newly created reservation ID
$reservationId = getLastInsertId();

// Log reservation ID for debugging
error_log("Created reservation with ID: " . $reservationId);

// If getLastInsertId() failed, try direct SQL approach
if ($reservationId == 0) {
    error_log("getLastInsertId() returned 0, trying direct SQL approach");
    $lastIdQuery = "SELECT LAST_INSERT_ID() as last_id";
    $lastIdResult = executeQuery($lastIdQuery);
    
    if ($lastIdResult && isset($lastIdResult[0]['last_id'])) {
        $reservationId = (int)$lastIdResult[0]['last_id'];
        error_log("Direct SQL approach got reservation ID: " . $reservationId);
    } else {
        error_log("Direct SQL approach also failed to get last insert ID");
    }
}

// If we still have no ID, try to find the reservation by its details
if ($reservationId == 0) {
    error_log("Still couldn't get reservation ID, trying to find by details");
    $findQuery = "SELECT id FROM reservations WHERE date = ? AND time = ? AND name = ? AND email = ? AND phone = ? ORDER BY id DESC LIMIT 1";
    $findParams = [$data['date'], $data['time'], $data['name'], $data['email'], $data['phone']];
    $findTypes = 'sssss';
    $findResult = executeQuery($findQuery, $findParams, $findTypes);
    
    if ($findResult && is_array($findResult) && !empty($findResult) && isset($findResult[0]['id'])) {
        $reservationId = (int)$findResult[0]['id'];
        error_log("Found reservation by details with ID: " . $reservationId);
    } else {
        error_log("Failed to find reservation by details");
    }
}

// Get the created reservation
$query = "SELECT * FROM reservations WHERE id = ?";
$params = [$reservationId];
$types = 'i';
$result = executeQuery($query, $params, $types);

// Additional error logging
if ($result === false || $result === null) {
    error_log("Database error: Failed to retrieve reservation with ID " . $reservationId);
    http_response_code(500); // Internal Server Error
    echo json_encode([
        'success' => false, 
        'error' => 'Failed to retrieve created reservation',
        'debug_info' => [
            'reservation_id' => $reservationId,
            'query' => $query
        ]
    ]);
    exit;
}

if (!is_array($result) || empty($result)) {
    error_log("Reservation with ID " . $reservationId . " was not found after creation");
    http_response_code(500); // Internal Server Error
    echo json_encode([
        'success' => false, 
        'error' => 'Reservation was created but could not be retrieved',
        'reservation_id' => $reservationId
    ]);
    exit;
}

$reservation = $result[0];
$reservation['id'] = (int)$reservation['id'];
$reservation['guests'] = (int)$reservation['guests'];
if ($reservation['user_id'] !== null) {
    $reservation['user_id'] = (int)$reservation['user_id'];
}

// Return success response
http_response_code(201); // Created
echo json_encode([
    'success' => true,
    'reservation' => $reservation
]); 