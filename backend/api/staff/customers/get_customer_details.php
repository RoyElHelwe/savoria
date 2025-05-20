<?php
/**
 * Get Customer Details - Staff API
 * 
 * Retrieves detailed information about a specific customer
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
// Fix the path to correctly point to config files
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

// Get customer ID from the query parameter
$customerId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($customerId <= 0) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'Invalid customer ID']));
}

// Get customer information
$customerQuery = "SELECT 
                    id, username, email, first_name, last_name, phone, address, 
                    role, created_at, updated_at
                FROM users
                WHERE id = ? AND role = 'customer'";

$customerStmt = $conn->prepare($customerQuery);
$customerStmt->bind_param("i", $customerId);
$customerStmt->execute();
$customerResult = $customerStmt->get_result();

if ($customerResult->num_rows === 0) {
    header("HTTP/1.1 404 Not Found");
    exit(json_encode(['success' => false, 'error' => 'Customer not found']));
}

$customerData = $customerResult->fetch_assoc();

// Get reservation statistics and history
$reservationStatsQuery = "SELECT 
                            COUNT(*) AS total_reservations,
                            SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_reservations,
                            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_reservations,
                            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_reservations,
                            AVG(guests) AS avg_guests
                        FROM reservations
                        WHERE user_id = ? OR email = ?";

$reservationStatsStmt = $conn->prepare($reservationStatsQuery);
$reservationStatsStmt->bind_param("is", $customerId, $customerData['email']);
$reservationStatsStmt->execute();
$reservationStatsResult = $reservationStatsStmt->get_result();
$reservationStats = $reservationStatsResult->fetch_assoc();

// Get recent reservations
$recentReservationsQuery = "SELECT 
                              id, date, time, guests, status, special_requests, created_at
                           FROM reservations
                           WHERE user_id = ? OR email = ?
                           ORDER BY date DESC, time DESC
                           LIMIT 5";

$recentReservationsStmt = $conn->prepare($recentReservationsQuery);
$recentReservationsStmt->bind_param("is", $customerId, $customerData['email']);
$recentReservationsStmt->execute();
$recentReservationsResult = $recentReservationsStmt->get_result();

$recentReservations = [];
while ($row = $recentReservationsResult->fetch_assoc()) {
    $recentReservations[] = $row;
}

// Get order statistics
$orderStatsQuery = "SELECT 
                        COUNT(*) AS total_orders,
                        SUM(CASE WHEN status = 'pending' OR status = 'processing' THEN 1 ELSE 0 END) AS active_orders,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
                        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders,
                        SUM(total_amount) AS total_spent,
                        AVG(total_amount) AS avg_order_value
                    FROM orders
                    WHERE user_id = ?";

$orderStatsStmt = $conn->prepare($orderStatsQuery);
$orderStatsStmt->bind_param("i", $customerId);
$orderStatsStmt->execute();
$orderStatsResult = $orderStatsStmt->get_result();
$orderStats = $orderStatsResult->fetch_assoc();

// Get recent orders
$recentOrdersQuery = "SELECT 
                        order_id, order_type, status, total_amount, payment_method,
                        payment_status, created_at
                     FROM orders
                     WHERE user_id = ?
                     ORDER BY created_at DESC
                     LIMIT 5";

$recentOrdersStmt = $conn->prepare($recentOrdersQuery);
$recentOrdersStmt->bind_param("i", $customerId);
$recentOrdersStmt->execute();
$recentOrdersResult = $recentOrdersStmt->get_result();

$recentOrders = [];
while ($row = $recentOrdersResult->fetch_assoc()) {
    // Get order items for each order
    $orderItemsQuery = "SELECT 
                            oi.item_id, oi.quantity, oi.price_per_unit,
                            m.name AS item_name
                        FROM order_items oi
                        JOIN menu_items m ON oi.item_id = m.item_id
                        WHERE oi.order_id = ?";
    
    $orderItemsStmt = $conn->prepare($orderItemsQuery);
    
    // Check if prepare statement was successful
    if ($orderItemsStmt === false) {
        // Log the error for debugging
        error_log("Order items query prepare error: " . $conn->error);
        $orderItems = [];
    } else {
        $orderItemsStmt->bind_param("i", $row['order_id']);
        $orderItemsStmt->execute();
        $orderItemsResult = $orderItemsStmt->get_result();
        
        $orderItems = [];
        while ($itemRow = $orderItemsResult->fetch_assoc()) {
            $orderItems[] = $itemRow;
        }
    }
    
    // Add items to the order data
    $row['items'] = $orderItems;
    $recentOrders[] = $row;
}

// Get favorite menu items (most ordered)
$favoriteItemsQuery = "SELECT 
                        m.item_id, m.name, m.price, m.category_id, c.name AS category_name,
                        COUNT(oi.item_id) AS order_count,
                        SUM(oi.quantity) AS total_quantity
                    FROM order_items oi
                    JOIN orders o ON oi.order_id = o.order_id
                    JOIN menu_items m ON oi.item_id = m.item_id
                    JOIN categories c ON m.category_id = c.id
                    WHERE o.user_id = ?
                    GROUP BY m.item_id
                    ORDER BY total_quantity DESC
                    LIMIT 5";

$favoriteItemsStmt = $conn->prepare($favoriteItemsQuery);

// Check if order_items table has data for this user
$checkOrderItemsQuery = "SELECT COUNT(*) as count FROM order_items oi 
                        JOIN orders o ON oi.order_id = o.order_id 
                        WHERE o.user_id = ?";
$checkOrderItemsStmt = $conn->prepare($checkOrderItemsQuery);
$checkOrderItemsStmt->bind_param("i", $customerId);
$checkOrderItemsStmt->execute();
$checkOrderItemsResult = $checkOrderItemsStmt->get_result();
$orderItemsCount = $checkOrderItemsResult->fetch_assoc()['count'];

$favoriteItems = [];

// Only attempt to get favorite items if there are order items
if ($orderItemsCount > 0) {
    // Check if prepare statement was successful
    if ($favoriteItemsStmt === false) {
        // Log the error for debugging
        error_log("Favorite items query prepare error: " . $conn->error);
    } else {
        $favoriteItemsStmt->bind_param("i", $customerId);
        $favoriteItemsStmt->execute();
        $favoriteItemsResult = $favoriteItemsStmt->get_result();
        
        while ($row = $favoriteItemsResult->fetch_assoc()) {
            $favoriteItems[] = $row;
        }
    }
}

// Calculate customer lifetime value and other metrics
$lifetimeValue = $orderStats['total_spent'] ?? 0;
$averageOrderValue = $orderStats['avg_order_value'] ?? 0;
$totalVisits = $reservationStats['total_reservations'] ?? 0;
$firstVisitDate = null;

// Get first visit date
$firstVisitQuery = "SELECT MIN(date) AS first_visit_date FROM reservations WHERE user_id = ? OR email = ?";
$firstVisitStmt = $conn->prepare($firstVisitQuery);
$firstVisitStmt->bind_param("is", $customerId, $customerData['email']);
$firstVisitStmt->execute();
$firstVisitResult = $firstVisitStmt->get_result();
$firstVisitData = $firstVisitResult->fetch_assoc();
$firstVisitDate = $firstVisitData['first_visit_date'] ?? $customerData['created_at'];

// Prepare response data
$customerDetails = [
    'id' => (int)$customerData['id'],
    'username' => $customerData['username'],
    'first_name' => $customerData['first_name'],
    'last_name' => $customerData['last_name'],
    'email' => $customerData['email'],
    'phone' => $customerData['phone'],
    'address' => $customerData['address'],
    'created_at' => $customerData['created_at'],
    'updated_at' => $customerData['updated_at'],
    'reservation_stats' => [
        'total' => (int)$reservationStats['total_reservations'],
        'confirmed' => (int)$reservationStats['confirmed_reservations'],
        'pending' => (int)$reservationStats['pending_reservations'],
        'cancelled' => (int)$reservationStats['cancelled_reservations'],
        'avg_guests' => round((float)$reservationStats['avg_guests'], 1)
    ],
    'order_stats' => [
        'total' => (int)$orderStats['total_orders'],
        'active' => (int)$orderStats['active_orders'],
        'completed' => (int)$orderStats['completed_orders'],
        'cancelled' => (int)$orderStats['cancelled_orders'],
        'total_spent' => (float)$orderStats['total_spent'],
        'avg_order_value' => (float)$orderStats['avg_order_value']
    ],
    'recent_reservations' => $recentReservations,
    'recent_orders' => $recentOrders,
    'favorite_items' => $favoriteItems,
    'customer_metrics' => [
        'lifetime_value' => (float)$lifetimeValue,
        'average_order_value' => (float)$averageOrderValue,
        'total_visits' => (int)$totalVisits,
        'first_visit_date' => $firstVisitDate,
        'days_since_first_visit' => round((strtotime('now') - strtotime($firstVisitDate)) / (60 * 60 * 24))
    ]
];

// Return the customer details as JSON
echo json_encode(['success' => true, 'data' => $customerDetails]);