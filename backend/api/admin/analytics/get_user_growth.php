<?php
/**
 * Get User Growth - Admin Analytics API
 * 
 * Retrieves data about user growth for analytics dashboard (admin/manager only)
 * 
 * Method: GET
 * Query Parameters:
 * - timeframe: 'week', 'month', or 'year' (default: 'year')
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
$timeframe = isset($_GET['timeframe']) ? $_GET['timeframe'] : 'year';

// Validate timeframe
if (!in_array($timeframe, ['week', 'month', 'year'])) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'Invalid timeframe parameter. Valid values: week, month, year']));
}

// Get user growth data based on timeframe
$query = "";
$userGrowth = [];
$userRoles = [];

switch ($timeframe) {
    case 'week':
        // Get user registrations for the last 7 days
        $query = "SELECT 
                    DATE_FORMAT(created_at, '%a') as label,
                    DATE(created_at) as reg_date,
                    COUNT(*) as user_count
                  FROM users
                  WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                  GROUP BY DATE(created_at), DATE_FORMAT(created_at, '%a')
                  ORDER BY reg_date ASC";
        break;
        
    case 'month':
        // Get user registrations for the current month by day
        $query = "SELECT 
                    DAY(created_at) as label,
                    DATE(created_at) as reg_date,
                    COUNT(*) as user_count
                  FROM users
                  WHERE MONTH(created_at) = MONTH(CURDATE())
                  AND YEAR(created_at) = YEAR(CURDATE())
                  GROUP BY DATE(created_at)
                  ORDER BY reg_date ASC";
        break;
        
    case 'year':
        // Get user registrations for the last 12 months
        $query = "SELECT 
                    DATE_FORMAT(created_at, '%b') as label,
                    CONCAT(YEAR(created_at), '-', MONTH(created_at)) as month_year,
                    COUNT(*) as user_count
                  FROM users
                  WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                  GROUP BY month_year, DATE_FORMAT(created_at, '%b')
                  ORDER BY STR_TO_DATE(CONCAT('2000-', MONTH(created_at), '-01'), '%Y-%m-%d') ASC";
        break;
}

// Execute query
try {
    $stmt = $conn->prepare($query);
    
    if ($stmt === false) {
        // Handle query preparation error
        throw new Exception("Error preparing user growth query: " . $conn->error);
    }
    
    if ($stmt->execute()) {
        $result = $stmt->get_result();
        
        if ($result) {
            $userGrowth = [];
            while ($row = $result->fetch_assoc()) {
                $userGrowth[] = [
                    'label' => $row['label'],
                    'users' => (int)$row['user_count']
                ];
            }
        }
        
        // Get statistics on user roles from the database
        $rolesQuery = "SELECT 
                       r.role_name as role, 
                       COUNT(u.id) as role_count 
                     FROM 
                       roles r
                     LEFT JOIN 
                       users u ON r.role_id = u.role_id
                     GROUP BY 
                       r.role_id, r.role_name
                     ORDER BY 
                       r.role_id";

        $rolesStmt = $conn->prepare($rolesQuery);
        
        if ($rolesStmt === false) {
            // Handle query preparation error
            throw new Exception("Error preparing user roles query: " . $conn->error);
        }
        
        if ($rolesStmt->execute()) {
            $rolesResult = $rolesStmt->get_result();
            
            if ($rolesResult) {
                $userRoles = [];
                while ($row = $rolesResult->fetch_assoc()) {
                    $userRoles[] = [
                        'role' => ucfirst($row['role']),  // Capitalize first letter
                        'count' => (int)$row['role_count']
                    ];
                }
            }
        }
    } else {
        throw new Exception("Error executing query: " . $stmt->error);
    }
} catch (Exception $e) {
    // Log error and ensure arrays are empty to trigger mock data generation
    error_log("Database query error: " . $e->getMessage());
    $userGrowth = [];
    $userRoles = [];
}

// If no data is found, fill in zeros for dates with no registrations
if (empty($userGrowth)) {
    switch ($timeframe) {
        case 'week':
            $dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            $startDate = new DateTime(date('Y-m-d', strtotime('-6 days')));
            $endDate = new DateTime(date('Y-m-d'));
            $days = [];
            
            // Create array of all days in the last week
            while ($startDate <= $endDate) {
                $dayOfWeek = $startDate->format('D');
                $days[$dayOfWeek] = 0;
                $startDate->modify('+1 day');
            }
            
            // Map day abbreviations to our expected format
            foreach ($days as $day => $count) {
                $label = substr($day, 0, 3);
                $userGrowth[] = [
                    'label' => $label,
                    'users' => 0
                ];
            }
            break;
            
        case 'month':
            $daysInMonth = date('t');
            for ($i = 1; $i <= $daysInMonth; $i++) {
                $userGrowth[] = [
                    'label' => (string)$i,
                    'users' => 0
                ];
            }
            break;
            
        case 'year':
            $monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            foreach ($monthLabels as $month) {
                $userGrowth[] = [
                    'label' => $month,
                    'users' => 0
                ];
            }
            break;
    }
}

// If no role data is found, use roles from the database
if (empty($userRoles)) {
    try {
        $basicRolesQuery = "SELECT role_name as role FROM roles ORDER BY role_id";
        $basicRolesStmt = $conn->prepare($basicRolesQuery);
        
        if ($basicRolesStmt && $basicRolesStmt->execute()) {
            $basicRolesResult = $basicRolesStmt->get_result();
            
            if ($basicRolesResult) {
                while ($row = $basicRolesResult->fetch_assoc()) {
                    $userRoles[] = [
                        'role' => ucfirst($row['role']),
                        'count' => 0
                    ];
                }
            }
        }
    } catch (Exception $e) {
        error_log("Error fetching basic roles: " . $e->getMessage());
        
        // Fallback to hardcoded roles if query fails
        $userRoles = [
            ['role' => 'Customer', 'count' => 0],
            ['role' => 'Staff', 'count' => 0],
            ['role' => 'Manager', 'count' => 0],
            ['role' => 'Admin', 'count' => 0]
        ];
    }
}

// Return the user growth data
echo json_encode([
    'success' => true,
    'timeframe' => $timeframe,
    'growth' => $userGrowth,
    'roles' => $userRoles
]);