<?php
/**
 * Get Daily Reports - Staff API
 * 
 * Retrieves daily report information for the staff dashboard
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

// Get date from query parameter, default to today
$date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

// Validate date format
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    echo json_encode([
        'success' => false,
        'error' => 'Invalid date format. Use YYYY-MM-DD.'
    ]);
    exit;
}

// Get reservation summary for the date
$reservationQuery = "SELECT 
                        COUNT(*) AS total_reservations,
                        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_reservations,
                        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_reservations,
                        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_reservations,
                        SUM(IF(status = 'completed', 1, 0)) AS completed_reservations,
                        SUM(guests) AS total_guests
                    FROM reservations
                    WHERE date = ?";

$reservationStmt = $conn->prepare($reservationQuery);
$reservationStmt->bind_param("s", $date);
$reservationStmt->execute();
$reservationResult = $reservationStmt->get_result();
$reservationData = $reservationResult->fetch_assoc();

// Get order summary for the date
$orderQuery = "SELECT 
                COUNT(*) AS total_orders,
                SUM(CASE WHEN status = 'pending' OR status = 'processing' THEN 1 ELSE 0 END) AS active_orders,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders,
                SUM(total_amount) AS total_sales
                FROM orders
                WHERE DATE(created_at) = ?";

$orderStmt = $conn->prepare($orderQuery);
$orderStmt->bind_param("s", $date);
$orderStmt->execute();
$orderResult = $orderStmt->get_result();
$orderData = $orderResult->fetch_assoc();

// Get hourly breakdown of reservations
$hourlyQuery = "SELECT 
                    HOUR(time) AS hour,
                    COUNT(*) AS reservation_count
                FROM reservations
                WHERE date = ?
                GROUP BY HOUR(time)
                ORDER BY hour";

$hourlyStmt = $conn->prepare($hourlyQuery);
$hourlyStmt->bind_param("s", $date);
$hourlyStmt->execute();
$hourlyResult = $hourlyStmt->get_result();

$hourlyBreakdown = [];
while ($row = $hourlyResult->fetch_assoc()) {
    $hourlyBreakdown[] = [
        'hour' => (int)$row['hour'],
        'reservation_count' => (int)$row['reservation_count']
    ];
}

// Get most popular menu items for the date (from orders)
// Fixed query to match the actual database schema
$menuItemsQuery = "SELECT 
                    m.item_id AS id, 
                    m.name, 
                    m.price,
                    COUNT(oi.item_id) AS order_count
                FROM 
                    order_items oi
                JOIN 
                    orders o ON oi.order_id = o.order_id
                JOIN 
                    menu_items m ON oi.item_id = m.item_id
                WHERE 
                    DATE(o.created_at) = ?
                GROUP BY 
                    m.item_id, m.name, m.price
                ORDER BY 
                    order_count DESC
                LIMIT 5";

// Check if order_items and orders tables have data
$checkOrderItemsQuery = "SELECT COUNT(*) as count FROM order_items";
$checkOrderItemsResult = $conn->query($checkOrderItemsQuery);
$orderItemsCount = $checkOrderItemsResult->fetch_assoc()['count'];

$popularItems = [];

// Only attempt to get popular items if there are order items
if ($orderItemsCount > 0) {
    $menuItemsStmt = $conn->prepare($menuItemsQuery);
    
    // Check if prepare statement was successful
    if ($menuItemsStmt === false) {
        // Log the error for debugging
        error_log("Menu items query prepare error: " . $conn->error);
    } else {
        $menuItemsStmt->bind_param("s", $date);
        $menuItemsStmt->execute();
        $menuItemsResult = $menuItemsStmt->get_result();
        
        while ($row = $menuItemsResult->fetch_assoc()) {
            $popularItems[] = [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'price' => (float)$row['price'],
                'order_count' => (int)$row['order_count']
            ];
        }
    }
}

// Prepare response data
$report = [
    'date' => $date,
    'reservations' => [
        'total' => (int)$reservationData['total_reservations'],
        'confirmed' => (int)$reservationData['confirmed_reservations'],
        'pending' => (int)$reservationData['pending_reservations'],
        'cancelled' => (int)$reservationData['cancelled_reservations'],
        'completed' => isset($reservationData['completed_reservations']) ? (int)$reservationData['completed_reservations'] : 0,
        'total_guests' => (int)$reservationData['total_guests']
    ],
    'orders' => [
        'total' => (int)$orderData['total_orders'],
        'active' => (int)$orderData['active_orders'],
        'completed' => (int)$orderData['completed_orders'],
        'cancelled' => (int)$orderData['cancelled_orders'],
        'total_sales' => (float)$orderData['total_sales']
    ],
    'hourly_breakdown' => $hourlyBreakdown,
    'popular_items' => $popularItems
];

// Return the report as JSON
echo json_encode(['success' => true, 'data' => $report]);