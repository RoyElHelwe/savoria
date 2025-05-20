<?php
/**
 * Get Today's Reservations - Staff API
 * 
 * Retrieves all reservations for the current day
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
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/jwt_utils.php';

// Only handle GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
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

// Get today's date
$today = date('Y-m-d');

// Get all reservations for today
$query = "SELECT 
            r.id,
            r.date,
            r.time,
            r.name,
            r.email,
            r.phone,
            r.guests,
            r.special_requests,
            r.status,
            r.user_id,
            r.created_at,
            r.updated_at,
            u.username
          FROM 
            reservations r
          LEFT JOIN 
            users u ON r.user_id = u.id
          WHERE 
            r.date = ?
          ORDER BY 
            r.time ASC";

$stmt = $conn->prepare($query);
$stmt->bind_param("s", $today);
$stmt->execute();
$result = $stmt->get_result();

$reservations = [];

while ($row = $result->fetch_assoc()) {
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
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at']
    ];
}

// Return the reservations as JSON
echo json_encode(['success' => true, 'reservations' => $reservations]); 