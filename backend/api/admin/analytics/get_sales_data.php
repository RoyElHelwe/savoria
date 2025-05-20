<?php
/**
 * Get Sales Data - Admin Analytics API
 * 
 * Retrieves sales data for analytics dashboard (admin/manager only)
 * 
 * Method: GET
 * Query Parameters:
 * - timeframe: 'week', 'month', or 'year' (default: 'week')
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

// Get timeframe parameter
$timeframe = isset($_GET['timeframe']) ? $_GET['timeframe'] : 'week';

// Validate timeframe
if (!in_array($timeframe, ['week', 'month', 'year'])) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'Invalid timeframe parameter. Valid values: week, month, year']));
}

// Get sales data based on timeframe
$salesData = [];
$currentDate = date('Y-m-d');

switch ($timeframe) {
    case 'week':
        // Get sales data for the last 7 days
        $query = "SELECT 
                    DATE_FORMAT(o.created_at, '%a') as day_label,
                    DATE(o.created_at) as order_date,
                    SUM(o.total_amount) as total_sales
                  FROM orders o
                  WHERE o.status != 'cancelled'
                  AND o.created_at >= DATE_SUB('$currentDate', INTERVAL 7 DAY)
                  GROUP BY DATE(o.created_at), DATE_FORMAT(o.created_at, '%a')
                  ORDER BY order_date ASC";
        break;
        
    case 'month':
        // Get sales data for the current month by day
        $query = "SELECT 
                    DAY(o.created_at) as day_label,
                    DATE(o.created_at) as order_date,
                    SUM(o.total_amount) as total_sales
                  FROM orders o
                  WHERE o.status != 'cancelled'
                  AND MONTH(o.created_at) = MONTH('$currentDate')
                  AND YEAR(o.created_at) = YEAR('$currentDate')
                  GROUP BY DATE(o.created_at)
                  ORDER BY order_date ASC";
        break;
        
    case 'year':
        // Get sales data for the last 12 months
        $query = "SELECT 
                    DATE_FORMAT(o.created_at, '%b') as day_label,
                    CONCAT(YEAR(o.created_at), '-', MONTH(o.created_at)) as month_year,
                    SUM(o.total_amount) as total_sales
                  FROM orders o
                  WHERE o.status != 'cancelled'
                  AND o.created_at >= DATE_SUB('$currentDate', INTERVAL 12 MONTH)
                  GROUP BY month_year, DATE_FORMAT(o.created_at, '%b')
                  ORDER BY month_year ASC";
        break;
}

// Execute query
try {
    $stmt = $conn->prepare($query);
    
    if ($stmt === false) {
        // Handle query preparation error
        throw new Exception("Error preparing query: " . $conn->error);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $salesData[] = [
                'label' => $row['day_label'],
                'amount' => (float)$row['total_sales']
            ];
        }
    }
    
    // If no data was found for the selected timeframe, create empty date slots
    if (empty($salesData)) {
        switch ($timeframe) {
            case 'week':
                $start = strtotime('-6 days');
                for ($i = 0; $i < 7; $i++) {
                    $dayLabel = date('D', strtotime("+$i days", $start));
                    $salesData[] = [
                        'label' => $dayLabel,
                        'amount' => 0
                    ];
                }
                break;
                
            case 'month':
                $daysInMonth = date('t');
                for ($i = 1; $i <= $daysInMonth; $i++) {
                    $salesData[] = [
                        'label' => (string)$i,
                        'amount' => 0
                    ];
                }
                break;
                
            case 'year':
                $monthsLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                foreach ($monthsLabels as $month) {
                    $salesData[] = [
                        'label' => $month,
                        'amount' => 0
                    ];
                }
                break;
        }
    }
    
    // Get summary statistics
    $statsQuery = "SELECT 
                  COUNT(*) as total_orders,
                  SUM(total_amount) as total_sales,
                  AVG(total_amount) as average_order_value
                FROM orders
                WHERE status != 'cancelled'";
    
    $statsStmt = $conn->prepare($statsQuery);
    $statsStmt->execute();
    $statsResult = $statsStmt->get_result();
    $statsData = $statsResult->fetch_assoc();
    
    // Return data with a note if it's empty
    $response = [
        'success' => true,
        'timeframe' => $timeframe,
        'data' => $salesData,
        'stats' => [
            'total_orders' => (int)$statsData['total_orders'],
            'total_sales' => (float)$statsData['total_sales'],
            'average_order_value' => (float)$statsData['average_order_value']
        ]
    ];
    
    // Add a note if original data was empty
    if (empty($result) || $result->num_rows === 0) {
        $response['note'] = 'No sales data found for the specified timeframe. Showing empty template.';
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    // Log error and return error response
    error_log("Database query error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred: ' . $e->getMessage()
    ]);
}