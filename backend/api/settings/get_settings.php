<?php
/**
 * Get Restaurant Settings - Admin API
 * 
 * Retrieves restaurant settings from database (admin/manager only)
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

// Only handle GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header("HTTP/1.1 405 Method Not Allowed");
    exit(json_encode(['success' => false, 'error' => 'Method not allowed']));
}

// Create database connection
$db = new Database();
$conn = $db->getConnection();


// Query to get all settings
$query = "SELECT * FROM settings";
$result = $conn->query($query);

if (!$result) {
    header("HTTP/1.1 500 Internal Server Error");
    exit(json_encode(['success' => false, 'error' => 'Failed to retrieve settings: ' . $conn->error]));
}

// Initialize settings array with defaults
$settings = [
    'restaurant_name' => 'Savoria Restaurant',
    'address' => '123 Main Street, Cityville',
    'phone' => '(123) 456-7890',
    'email' => 'contact@savoria.com',
    'opening_hours' => [
        'monday' => ['open' => '11:00', 'close' => '22:00', 'closed' => false],
        'tuesday' => ['open' => '11:00', 'close' => '22:00', 'closed' => false],
        'wednesday' => ['open' => '11:00', 'close' => '22:00', 'closed' => false],
        'thursday' => ['open' => '11:00', 'close' => '22:00', 'closed' => false],
        'friday' => ['open' => '11:00', 'close' => '23:00', 'closed' => false],
        'saturday' => ['open' => '10:00', 'close' => '23:00', 'closed' => false],
        'sunday' => ['open' => '10:00', 'close' => '22:00', 'closed' => false]
    ],
    'social_media' => [
        'facebook' => 'https://facebook.com/savoria',
        'instagram' => 'https://instagram.com/savoria',
        'twitter' => 'https://twitter.com/savoria'
    ],
    'reservation_settings' => [
        'max_days_in_advance' => 30,
        'min_hours_in_advance' => 2,
        'time_slot_interval' => 30,
        'default_reservation_duration' => 90
    ]
];

// Process settings from database
while ($row = $result->fetch_assoc()) {
    // Check if the expected columns exist in the row
    if (!isset($row['name']) || !isset($row['value'])) {
        continue; // Skip this row if the required columns are missing
    }
    
    $setting_name = $row['name'];
    $setting_value = $row['value'];
    
    // Process based on setting name
    switch ($setting_name) {
        case 'restaurant_name':
        case 'address':
        case 'phone':
        case 'email':
            $settings[$setting_name] = $setting_value;
            break;
        
        case 'opening_hours':
            if ($setting_value) {
                $hours = json_decode($setting_value, true);
                if ($hours && is_array($hours)) {
                    $settings['opening_hours'] = $hours;
                }
            }
            break;
        
        case 'social_media':
            if ($setting_value) {
                $social = json_decode($setting_value, true);
                if ($social && is_array($social)) {
                    $settings['social_media'] = $social;
                }
            }
            break;
            
        case 'reservation_max_days':
            $settings['reservation_settings']['max_days_in_advance'] = (int)$setting_value;
            break;
            
        case 'reservation_min_hours':
            $settings['reservation_settings']['min_hours_in_advance'] = (int)$setting_value;
            break;
            
        case 'reservation_time_slot':
            $settings['reservation_settings']['time_slot_interval'] = (int)$setting_value;
            break;
            
        case 'reservation_duration':
            $settings['reservation_settings']['default_reservation_duration'] = (int)$setting_value;
            break;
    }
}

// Return the settings as JSON
echo json_encode(['success' => true, 'settings' => $settings]); 