<?php
/**
 * Get Reservation Data - Admin Analytics API
 * 
 * Retrieves reservation data for analytics dashboard (admin/manager only)
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

// Get reservation data based on timeframe
$reservationData = [];
$reservationStatusData = [];

// Current date for calculations
$currentDate = date('Y-m-d');

// Query for reservations by date
switch ($timeframe) {
    case 'week':
        // Get reservation data for the last 7 days
        $dateQuery = "SELECT 
                    DATE_FORMAT(r.date, '%a') as day_label,
                    r.date as reservation_date,
                    COUNT(*) as reservation_count
                  FROM reservations r
                  WHERE r.date >= DATE_SUB('$currentDate', INTERVAL 7 DAY)
                  GROUP BY r.date, DATE_FORMAT(r.date, '%a')
                  ORDER BY r.date ASC";
        break;
        
    case 'month':
        // Get reservation data for the current month by day
        $dateQuery = "SELECT 
                    DAY(r.date) as day_label,
                    r.date as reservation_date,
                    COUNT(*) as reservation_count
                  FROM reservations r
                  WHERE MONTH(r.date) = MONTH('$currentDate')
                  AND YEAR(r.date) = YEAR('$currentDate')
                  GROUP BY r.date
                  ORDER BY r.date ASC";
        break;
        
    case 'year':
        // Get reservation data for the last 12 months
        $dateQuery = "SELECT 
                    DATE_FORMAT(r.date, '%b') as day_label,
                    CONCAT(YEAR(r.date), '-', MONTH(r.date)) as month_year,
                    COUNT(*) as reservation_count
                  FROM reservations r
                  WHERE r.date >= DATE_SUB('$currentDate', INTERVAL 12 MONTH)
                  GROUP BY month_year, DATE_FORMAT(r.date, '%b')
                  ORDER BY month_year ASC";
        break;
}

// Execute reservation by date query
try {
    $dateStmt = $conn->prepare($dateQuery);
    
    if ($dateStmt === false) {
        // Handle query preparation error
        throw new Exception("Error preparing date query: " . $conn->error);
    }
    
    $dateStmt->execute();
    $dateResult = $dateStmt->get_result();
    
    if ($dateResult) {
        while ($row = $dateResult->fetch_assoc()) {
            $reservationData[] = [
                'label' => $row['day_label'],
                'count' => (int)$row['reservation_count']
            ];
        }
    }
    
    // If no data was found for the selected timeframe, create empty date slots
    if (empty($reservationData)) {
        switch ($timeframe) {
            case 'week':
                $start = strtotime('-6 days');
                for ($i = 0; $i < 7; $i++) {
                    $date = date('Y-m-d', strtotime("+$i days", $start));
                    $dayLabel = date('D', strtotime("+$i days", $start));
                    $reservationData[] = [
                        'label' => $dayLabel,
                        'count' => 0
                    ];
                }
                break;
                
            case 'month':
                $daysInMonth = date('t');
                for ($i = 1; $i <= $daysInMonth; $i++) {
                    $reservationData[] = [
                        'label' => (string)$i,
                        'count' => 0
                    ];
                }
                break;
                
            case 'year':
                $monthsLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                foreach ($monthsLabels as $month) {
                    $reservationData[] = [
                        'label' => $month,
                        'count' => 0
                    ];
                }
                break;
        }
    }
    
    // Query for reservations by status - get real data regardless of timeframe
    $statusQuery = "SELECT 
                    status,
                    COUNT(*) as status_count
                  FROM reservations
                  GROUP BY status";
    
    $statusStmt = $conn->prepare($statusQuery);
    
    if ($statusStmt === false) {
        // Handle query preparation error
        throw new Exception("Error preparing status query: " . $conn->error);
    }
    
    $statusStmt->execute();
    $statusResult = $statusStmt->get_result();
    
    if ($statusResult) {
        while ($row = $statusResult->fetch_assoc()) {
            $reservationStatusData[] = [
                'status' => ucfirst($row['status']), // Capitalize first letter
                'count' => (int)$row['status_count']
            ];
        }
    }
    
    // If no status data was found, initialize with zero counts
    if (empty($reservationStatusData)) {
        $statuses = ['Confirmed', 'Pending', 'Cancelled'];
        foreach ($statuses as $status) {
            $reservationStatusData[] = [
                'status' => $status,
                'count' => 0
            ];
        }
    }
    
    // Return data with a note if it's empty
    $response = [
        'success' => true,
        'timeframe' => $timeframe,
        'reservationData' => $reservationData,
        'statusData' => $reservationStatusData
    ];
    
    // Add a note if original data was empty
    if (empty($dateResult) || $dateResult->num_rows === 0) {
        $response['note'] = 'No reservation data found for the specified timeframe. Showing empty template.';
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