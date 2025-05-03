<?php
/**
 * Get All Reservations API Endpoint
 * 
 * Retrieve all reservations (admin only)
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

// Get optional query parameters for filtering
$date = isset($_GET['date']) ? $_GET['date'] : null;
$status = isset($_GET['status']) ? $_GET['status'] : null;

// Build the query
$query = "SELECT r.*, u.username, u.email as user_email 
          FROM reservations r
          LEFT JOIN users u ON r.user_id = u.id";
$whereConditions = [];
$params = [];
$types = '';

if ($date) {
    $whereConditions[] = "r.date = ?";
    $params[] = $date;
    $types .= 's';
}

if ($status && in_array($status, ['pending', 'confirmed', 'cancelled'])) {
    $whereConditions[] = "r.status = ?";
    $params[] = $status;
    $types .= 's';
}

if (!empty($whereConditions)) {
    $query .= " WHERE " . implode(' AND ', $whereConditions);
}

$query .= " ORDER BY r.date DESC, r.time DESC";

// Execute the query
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
        'user_id' => $row['user_id'] ? (int)$row['user_id'] : null,
        'username' => $row['username'],
        'user_email' => $row['user_email'],
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