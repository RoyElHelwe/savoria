<?php
/**
 * Search Customers - Staff API
 * 
 * Allows staff to search for customers by name, email, or phone
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

// Get search query parameter
$search = isset($_GET['search']) ? trim($_GET['search']) : '';

if (empty($search)) {
    echo json_encode(['success' => false, 'error' => 'Search query is required']);
    exit;
}

// Search customers
$query = "SELECT 
            id, 
            username, 
            email, 
            first_name, 
            last_name, 
            phone, 
            address, 
            role, 
            created_at
          FROM 
            users
          WHERE 
            role = 'customer' AND
            (username LIKE ? OR
             email LIKE ? OR
             first_name LIKE ? OR
             last_name LIKE ? OR
             phone LIKE ?)
          ORDER BY 
            created_at DESC
          LIMIT 20";

$searchParam = "%$search%";
$stmt = $conn->prepare($query);
$stmt->bind_param("sssss", $searchParam, $searchParam, $searchParam, $searchParam, $searchParam);
$stmt->execute();
$result = $stmt->get_result();

$customers = [];

while ($row = $result->fetch_assoc()) {
    $customers[] = [
        'id' => (int)$row['id'],
        'username' => $row['username'],
        'email' => $row['email'],
        'first_name' => $row['first_name'],
        'last_name' => $row['last_name'],
        'phone' => $row['phone'],
        'address' => $row['address'],
        'role' => $row['role'],
        'created_at' => $row['created_at']
    ];
}

// Count reservations for each customer
foreach ($customers as $key => $customer) {
    // Use prepared statement with error handling
    $reservationQuery = "SELECT 
                            COUNT(*) as total_reservations,
                            SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_reservations,
                            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reservations
                        FROM 
                            reservations
                        WHERE 
                            user_id = ? OR email = ?";
                            
    $reservationStmt = $conn->prepare($reservationQuery);
    
    if ($reservationStmt === false) {
        // Log error and continue with default values
        error_log("Reservation query prepare error: " . $conn->error);
        $customers[$key]['reservations'] = [
            'total' => 0,
            'confirmed' => 0,
            'pending' => 0
        ];
    } else {
        $reservationStmt->bind_param("is", $customer['id'], $customer['email']);
        $reservationStmt->execute();
        $reservationResult = $reservationStmt->get_result();
        $reservationData = $reservationResult->fetch_assoc();
        
        $customers[$key]['reservations'] = [
            'total' => (int)$reservationData['total_reservations'],
            'confirmed' => (int)$reservationData['confirmed_reservations'],
            'pending' => (int)$reservationData['pending_reservations']
        ];
    }
    
    // Count orders with error handling
    $orderQuery = "SELECT 
                    COUNT(*) as total_orders,
                    SUM(CASE WHEN status IN ('pending', 'processing') THEN 1 ELSE 0 END) as active_orders,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders
                FROM 
                    orders
                WHERE 
                    user_id = ?";
                    
    $orderStmt = $conn->prepare($orderQuery);
    
    if ($orderStmt === false) {
        // Log error and continue with default values
        error_log("Order query prepare error: " . $conn->error);
        $customers[$key]['orders'] = [
            'total' => 0,
            'active' => 0,
            'completed' => 0
        ];
    } else {
        $orderStmt->bind_param("i", $customer['id']);
        $orderStmt->execute();
        $orderResult = $orderStmt->get_result();
        $orderData = $orderResult->fetch_assoc();
        
        $customers[$key]['orders'] = [
            'total' => (int)$orderData['total_orders'],
            'active' => (int)$orderData['active_orders'],
            'completed' => (int)$orderData['completed_orders']
        ];
    }
}

// Return the customers as JSON
echo json_encode(['success' => true, 'customers' => $customers]);