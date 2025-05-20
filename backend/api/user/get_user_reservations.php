<?php
/**
 * Get User Reservations API
 * 
 * Retrieves all reservations for the authenticated user
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
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/jwt_utils.php';

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

// Get user ID from the token payload
$userId = isset($payload['user_id']) ? $payload['user_id'] : null;
$userEmail = isset($payload['email']) ? $payload['email'] : null;

if (!$userId) {
    header("HTTP/1.1 401 Unauthorized");
    exit(json_encode(['success' => false, 'error' => 'Unauthorized: User ID not found in token']));
}

// Get pagination parameters
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
$status = isset($_GET['status']) ? $_GET['status'] : null;
$upcoming = isset($_GET['upcoming']) && $_GET['upcoming'] === 'true';

// Validate pagination parameters
if ($page < 1) $page = 1;
if ($limit < 1 || $limit > 50) $limit = 10;

// Calculate offset
$offset = ($page - 1) * $limit;

// Build query based on parameters
$queryParams = [];
$queryTypes = "";

// We need to check both user_id and email for reservations
// as some reservations might have been made without login
$whereClause = "WHERE (user_id = ? OR email = ?)";
$queryParams[] = $userId;
$queryParams[] = $userEmail;
$queryTypes .= "is";

// Add status filter if provided
if ($status) {
    $validStatuses = ['pending', 'confirmed', 'cancelled'];
    
    if (in_array($status, $validStatuses)) {
        $whereClause .= " AND status = ?";
        $queryParams[] = $status;
        $queryTypes .= "s";
    }
}

// Add upcoming filter if true (only show future reservations)
if ($upcoming) {
    $today = date('Y-m-d');
    $whereClause .= " AND (date > ? OR (date = ? AND time >= ?))";
    $currentTime = date('H:i:s');
    $queryParams[] = $today;
    $queryParams[] = $today;
    $queryParams[] = $currentTime;
    $queryTypes .= "sss";
}

// Get total count of reservations
$countQuery = "SELECT COUNT(*) as total FROM reservations " . $whereClause;
$countStmt = $conn->prepare($countQuery);

if ($countStmt === false) {
    header("HTTP/1.1 500 Internal Server Error");
    exit(json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]));
}

// Bind parameters dynamically
if (!empty($queryParams)) {
    $countStmt->bind_param($queryTypes, ...$queryParams);
}

$countStmt->execute();
$countResult = $countStmt->get_result();
$totalReservations = $countResult->fetch_assoc()['total'];

// Calculate total pages
$totalPages = ceil($totalReservations / $limit);

// Get reservations with pagination
$reservationsQuery = "SELECT 
                        id, 
                        date, 
                        time, 
                        name, 
                        email, 
                        phone, 
                        guests, 
                        special_requests, 
                        status, 
                        user_id, 
                        created_at, 
                        updated_at 
                    FROM 
                        reservations 
                    " . $whereClause . " 
                    ORDER BY 
                        date ASC, time ASC 
                    LIMIT ?, ?";

$queryParams[] = $offset;
$queryParams[] = $limit;
$queryTypes .= "ii";

$reservationsStmt = $conn->prepare($reservationsQuery);

if ($reservationsStmt === false) {
    header("HTTP/1.1 500 Internal Server Error");
    exit(json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]));
}

// Bind parameters dynamically
$reservationsStmt->bind_param($queryTypes, ...$queryParams);
$reservationsStmt->execute();
$reservationsResult = $reservationsStmt->get_result();

$reservations = [];

while ($reservation = $reservationsResult->fetch_assoc()) {
    // Get whether reservation can be cancelled (can cancel if status is confirmed or pending and date is in the future)
    $canBeCancelled = ($reservation['status'] === 'confirmed' || $reservation['status'] === 'pending') && 
                     (strtotime($reservation['date']) > strtotime('today'));
    
    // Format reservation data
    $reservations[] = [
        'id' => (int)$reservation['id'],
        'date' => $reservation['date'],
        'time' => $reservation['time'],
        'name' => $reservation['name'],
        'email' => $reservation['email'],
        'phone' => $reservation['phone'],
        'guests' => (int)$reservation['guests'],
        'special_requests' => $reservation['special_requests'],
        'status' => $reservation['status'],
        'user_id' => $reservation['user_id'] ? (int)$reservation['user_id'] : null,
        'created_at' => $reservation['created_at'],
        'updated_at' => $reservation['updated_at'],
        'can_be_cancelled' => $canBeCancelled
    ];
}

// Pagination metadata
$pagination = [
    'current_page' => $page,
    'per_page' => $limit,
    'total_items' => (int)$totalReservations,
    'total_pages' => $totalPages
];

// Return the reservations
echo json_encode([
    'success' => true, 
    'reservations' => $reservations,
    'pagination' => $pagination
]);