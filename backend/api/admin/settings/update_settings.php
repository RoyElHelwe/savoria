<?php
/**
 * Update Restaurant Settings - Admin API
 * 
 * Updates restaurant settings in the database (admin only)
 */

// Allow from any origin
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}

// Include database and authentication utilities
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/jwt_utils.php';

// Only handle PUT requests
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
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

// Check if user has admin role (only admins can change settings, not managers)
$userId = isset($payload['user_id']) ? $payload['user_id'] : null;
$userRole = isset($payload['role']) ? $payload['role'] : null;

if (!$userId) {
    header("HTTP/1.1 401 Unauthorized");
    exit(json_encode(['success' => false, 'error' => 'Unauthorized: User ID not found in token']));
}

if ($userRole !== 'admin') {
    header("HTTP/1.1 403 Forbidden");
    exit(json_encode(['success' => false, 'error' => 'Access denied. Only administrators can update restaurant settings.']));
}

// Get the JSON data
$data = json_decode(file_get_contents("php://input"), true);

// Validate required fields
if (!isset($data['restaurant_name']) || !isset($data['address']) || !isset($data['phone']) || !isset($data['email'])) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'Missing required fields: restaurant_name, address, phone, email']));
}

// Function to insert or update a setting
function updateSetting($conn, $name, $value) {
    // Check if the setting exists
    $query = "SELECT id FROM settings WHERE name = ?";
    $stmt = $conn->prepare($query);
    
    if ($stmt === false) {
        return false;
    }
    
    $stmt->bind_param("s", $name);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        // Update existing setting
        $query = "UPDATE settings SET value = ? WHERE name = ?";
        $stmt = $conn->prepare($query);
        
        if ($stmt === false) {
            return false;
        }
        
        $stmt->bind_param("ss", $value, $name);
    } else {
        // Insert new setting
        $query = "INSERT INTO settings (name, value) VALUES (?, ?)";
        $stmt = $conn->prepare($query);
        
        if ($stmt === false) {
            return false;
        }
        
        $stmt->bind_param("ss", $name, $value);
    }
    
    return $stmt->execute();
}

// Update basic settings
$settingsToUpdate = [
    'restaurant_name' => $data['restaurant_name'],
    'address' => $data['address'],
    'phone' => $data['phone'],
    'email' => $data['email']
];

// Handle opening hours
if (isset($data['opening_hours']) && is_array($data['opening_hours'])) {
    $settingsToUpdate['opening_hours'] = json_encode($data['opening_hours']);
}

// Handle social media
if (isset($data['social_media']) && is_array($data['social_media'])) {
    $settingsToUpdate['social_media'] = json_encode($data['social_media']);
}

// Handle reservation settings
if (isset($data['reservation_settings']) && is_array($data['reservation_settings'])) {
    $reservationSettings = $data['reservation_settings'];
    
    if (isset($reservationSettings['max_days_in_advance'])) {
        $settingsToUpdate['reservation_max_days'] = (string)$reservationSettings['max_days_in_advance'];
    }
    
    if (isset($reservationSettings['min_hours_in_advance'])) {
        $settingsToUpdate['reservation_min_hours'] = (string)$reservationSettings['min_hours_in_advance'];
    }
    
    if (isset($reservationSettings['time_slot_interval'])) {
        $settingsToUpdate['reservation_time_slot'] = (string)$reservationSettings['time_slot_interval'];
    }
    
    if (isset($reservationSettings['default_reservation_duration'])) {
        $settingsToUpdate['reservation_duration'] = (string)$reservationSettings['default_reservation_duration'];
    }
}

// Start a transaction
$conn->begin_transaction();
$success = true;
$errors = [];

// Update each setting
foreach ($settingsToUpdate as $name => $value) {
    if (!updateSetting($conn, $name, $value)) {
        $success = false;
        $errors[] = "Failed to update setting '$name': " . $conn->error;
    }
}

// Commit or rollback based on success
if ($success) {
    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Settings updated successfully']);
} else {
    $conn->rollback();
    header("HTTP/1.1 500 Internal Server Error");
    echo json_encode(['success' => false, 'error' => 'Failed to update settings', 'details' => $errors]);
} 