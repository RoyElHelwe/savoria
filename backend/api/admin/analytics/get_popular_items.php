<?php
/**
 * Get Popular Items - Admin Analytics API
 * 
 * Retrieves data about popular menu items for analytics dashboard (admin/manager only)
 * 
 * Method: GET
 * Query Parameters:
 * - limit: Number of items to return (default: 5)
 * - timeframe: 'week', 'month', or 'year' (default: 'month')
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

// Check if user has admin or manager role
$userId = isset($payload['user_id']) ? $payload['user_id'] : null;
$userRole = isset($payload['role']) ? $payload['role'] : null;

if (!$userId) {
    header("HTTP/1.1 401 Unauthorized");
    exit(json_encode(['success' => false, 'error' => 'Unauthorized: User ID not found in token']));
}

if ($userRole !== 'admin' && $userRole !== 'manager') {
    header("HTTP/1.1 403 Forbidden");
    exit(json_encode(['success' => false, 'error' => 'Access denied. Admin privileges required.']));
}

// Get parameters
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;
$timeframe = isset($_GET['timeframe']) ? $_GET['timeframe'] : 'month';

// Validate timeframe
if (!in_array($timeframe, ['week', 'month', 'year'])) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'Invalid timeframe parameter. Valid values: week, month, year']));
}

// Set the time range based on timeframe
$dateRangeSQL = "";
$currentDate = date('Y-m-d');
switch ($timeframe) {
    case 'week':
        $dateRangeSQL = "AND DATE(o.created_at) >= DATE_SUB('$currentDate', INTERVAL 7 DAY)";
        break;
    case 'month':
        $dateRangeSQL = "AND DATE(o.created_at) >= DATE_SUB('$currentDate', INTERVAL 1 MONTH)";
        break;
    case 'year':
        $dateRangeSQL = "AND DATE(o.created_at) >= DATE_SUB('$currentDate', INTERVAL 12 MONTH)";
        break;
}

// Query to get popular menu items - modified to match your database schema
$query = "SELECT 
            m.item_id,
            m.name,
            COUNT(oi.item_id) as order_count,
            SUM(oi.quantity) as total_quantity,
            SUM(oi.quantity * oi.price_per_unit) as total_revenue
          FROM order_items oi
          JOIN menu_items m ON oi.item_id = m.item_id
          JOIN orders o ON oi.order_id = o.order_id
          WHERE o.status != 'cancelled'
          $dateRangeSQL
          GROUP BY m.item_id, m.name
          ORDER BY total_quantity DESC
          LIMIT ?";

// Execute query
try {
    $stmt = $conn->prepare($query);
    
    if ($stmt === false) {
        // Handle query preparation error
        throw new Exception("Error preparing query: " . $conn->error);
    }
    
    $stmt->bind_param("i", $limit);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $popularItems = [];

    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $popularItems[] = [
                'id' => (int)$row['item_id'],
                'name' => $row['name'],
                'orders' => (int)$row['total_quantity'],
                'revenue' => (float)$row['total_revenue']
            ];
        }
        
        // Return the popular items data
        echo json_encode([
            'success' => true,
            'timeframe' => $timeframe,
            'data' => $popularItems
        ]);
    } else {
        // If no data is found in the specified timeframe, try getting overall popular items without timeframe restriction
        $fallbackQuery = "SELECT 
                            m.item_id,
                            m.name,
                            COUNT(oi.item_id) as order_count,
                            SUM(oi.quantity) as total_quantity,
                            SUM(oi.quantity * oi.price_per_unit) as total_revenue
                        FROM order_items oi
                        JOIN menu_items m ON oi.item_id = m.item_id
                        JOIN orders o ON oi.order_id = o.order_id
                        WHERE o.status != 'cancelled'
                        GROUP BY m.item_id, m.name
                        ORDER BY total_quantity DESC
                        LIMIT ?";
        
        $fallbackStmt = $conn->prepare($fallbackQuery);
        
        if ($fallbackStmt === false) {
            throw new Exception("Error preparing fallback query: " . $conn->error);
        }
        
        $fallbackStmt->bind_param("i", $limit);
        $fallbackStmt->execute();
        $fallbackResult = $fallbackStmt->get_result();
        
        $popularItems = [];
        
        if ($fallbackResult && $fallbackResult->num_rows > 0) {
            while ($row = $fallbackResult->fetch_assoc()) {
                $popularItems[] = [
                    'id' => (int)$row['item_id'],
                    'name' => $row['name'],
                    'orders' => (int)$row['total_quantity'],
                    'revenue' => (float)$row['total_revenue']
                ];
            }
            
            // Return the popular items data with a note that it's all-time data
            echo json_encode([
                'success' => true,
                'timeframe' => 'all_time', // Indicate this is all-time data
                'note' => 'No data found for the specified timeframe. Showing all-time popular items instead.',
                'data' => $popularItems
            ]);
        } else {
            // If still no data, return the most recent menu items as a fallback
            $menuItemsQuery = "SELECT 
                                item_id,
                                name,
                                price
                            FROM menu_items
                            WHERE is_active = 1
                            ORDER BY item_id DESC
                            LIMIT ?";
            
            $menuItemsStmt = $conn->prepare($menuItemsQuery);
            
            if ($menuItemsStmt === false) {
                throw new Exception("Error preparing menu items query: " . $conn->error);
            }
            
            $menuItemsStmt->bind_param("i", $limit);
            $menuItemsStmt->execute();
            $menuItemsResult = $menuItemsStmt->get_result();
            
            $menuItems = [];
            
            if ($menuItemsResult) {
                while ($row = $menuItemsResult->fetch_assoc()) {
                    $menuItems[] = [
                        'id' => (int)$row['item_id'],
                        'name' => $row['name'],
                        'orders' => 0,
                        'revenue' => 0
                    ];
                }
            }
            
            // Return menu items with a note that no order data was found
            echo json_encode([
                'success' => true,
                'timeframe' => $timeframe,
                'note' => 'No order data found. Showing available menu items instead.',
                'data' => $menuItems
            ]);
        }
    }
} catch (Exception $e) {
    // Log error and return error response
    error_log("Database query error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred: ' . $e->getMessage()
    ]);
}