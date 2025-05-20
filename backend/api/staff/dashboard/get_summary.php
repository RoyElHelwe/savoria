<?php
/**
 * Get Dashboard Summary - Staff API
 * 
 * Retrieves summary information for the staff dashboard
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

// Get reservation count for today
$reservationQuery = "SELECT 
                        COUNT(*) AS total_reservations,
                        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_reservations,
                        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_reservations,
                        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_reservations
                    FROM reservations
                    WHERE date = ?";

$reservationStmt = $conn->prepare($reservationQuery);
$reservationStmt->bind_param("s", $today);
$reservationStmt->execute();
$reservationResult = $reservationStmt->get_result();
$reservationData = $reservationResult->fetch_assoc();

// Get active orders count
$orderQuery = "SELECT 
                COUNT(*) AS total_orders,
                SUM(CASE WHEN status = 'pending' OR status = 'processing' THEN 1 ELSE 0 END) AS active_orders,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders
                FROM orders
                WHERE DATE(created_at) = ?";

$orderStmt = $conn->prepare($orderQuery);
$orderStmt->bind_param("s", $today);
$orderStmt->execute();
$orderResult = $orderStmt->get_result();
$orderData = $orderResult->fetch_assoc();

// Get table availability
$tableQuery = "SELECT 
                COUNT(*) AS total_tables,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS available_tables
                FROM tables";

$tableStmt = $conn->prepare($tableQuery);
$tableStmt->execute();
$tableResult = $tableStmt->get_result();
$tableData = $tableResult->fetch_assoc();

// Get recent activity (last 10 events)
// Fixed version of the activity query
$activityQuery = "SELECT * FROM (
    SELECT 
        'reservation' AS type,
        CONCAT('Reservation #', id, ' ', status) AS description,
        created_at AS timestamp 
    FROM 
        reservations 
    WHERE 
        DATE(created_at) = ? OR DATE(updated_at) = ?
    
    UNION ALL
    
    SELECT 
        'order' AS type,
        CONCAT('Order #', order_id, ' ', status) AS description,
        created_at AS timestamp 
    FROM 
        orders 
    WHERE 
        DATE(created_at) = ? OR DATE(updated_at) = ?
) AS combined_activities
ORDER BY timestamp DESC
LIMIT 10";

$activityStmt = $conn->prepare($activityQuery);

// Check if prepare statement was successful
if ($activityStmt === false) {
    // Log the error for debugging
    error_log("Activity query prepare error: " . $conn->error);
    
    // Create empty activities array to avoid breaking the response
    $activities = [];
} else {
    $activityStmt->bind_param("ssss", $today, $today, $today, $today);
    $activityStmt->execute();
    $activityResult = $activityStmt->get_result();
    
    $activities = [];
    while ($row = $activityResult->fetch_assoc()) {
        $activities[] = [
            'type' => $row['type'],
            'description' => $row['description'],
            'timestamp' => $row['timestamp']
        ];
    }
}

// Prepare response data
$summary = [
    'reservations' => [
        'total' => (int)$reservationData['total_reservations'],
        'confirmed' => (int)$reservationData['confirmed_reservations'],
        'pending' => (int)$reservationData['pending_reservations'],
        'cancelled' => (int)$reservationData['cancelled_reservations']
    ],
    'orders' => [
        'total' => (int)$orderData['total_orders'],
        'active' => (int)$orderData['active_orders'],
        'completed' => (int)$orderData['completed_orders'],
        'cancelled' => (int)$orderData['cancelled_orders']
    ],
    'tables' => [
        'total' => (int)$tableData['total_tables'],
        'available' => (int)$tableData['available_tables']
    ],
    'recent_activity' => $activities
];

// Return the summary as JSON
echo json_encode(['success' => true, 'data' => $summary]);