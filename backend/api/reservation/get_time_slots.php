<?php
/**
 * Get Time Slots API Endpoint
 * 
 * Retrieve available time slots for a specific date
 * 
 * Method: GET
 * Required query parameters:
 * - date: Date in YYYY-MM-DD format
 */

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Allow only GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Include database connection
require_once '../../config/database.php';

// Check if date is provided
if (!isset($_GET['date']) || empty($_GET['date'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Date is required']);
    exit;
}

$date = $_GET['date'];

// Validate date format (YYYY-MM-DD)
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Invalid date format. Use YYYY-MM-DD']);
    exit;
}

// Check if date is in the past
$today = date('Y-m-d');
if ($date < $today) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Cannot make reservations for past dates']);
    exit;
}

// Get restaurant settings for reservation interval and operating hours
$settingsQuery = "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('reservation_interval', 'opening_hours')";
$settings = executeQuery($settingsQuery);

if (!$settings) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Failed to retrieve restaurant settings']);
    exit;
}

// Parse settings
$reservationInterval = 30; // Default: 30 minutes
$openingHours = null;

foreach ($settings as $setting) {
    if ($setting['setting_key'] === 'reservation_interval') {
        $reservationInterval = (int)$setting['setting_value'];
    } elseif ($setting['setting_key'] === 'opening_hours') {
        $openingHours = json_decode($setting['setting_value'], true);
    }
}

// If opening hours are not set, use default hours
if (!$openingHours) {
    $openingHours = [
        'monday' => '11:00-22:00',
        'tuesday' => '11:00-22:00',
        'wednesday' => '11:00-22:00',
        'thursday' => '11:00-22:00',
        'friday' => '11:00-23:00',
        'saturday' => '11:00-23:00',
        'sunday' => '12:00-21:00'
    ];
}

// Get day of the week for the requested date
$dayOfWeek = strtolower(date('l', strtotime($date)));

// Get operating hours for the day
$hoursRange = isset($openingHours[$dayOfWeek]) ? $openingHours[$dayOfWeek] : '11:00-22:00';

// Parse operating hours
list($openTime, $closeTime) = explode('-', $hoursRange);

// Generate time slots based on operating hours and reservation interval
$startTime = strtotime($openTime);
$endTime = strtotime($closeTime);
$interval = $reservationInterval * 60; // Convert to seconds

$timeSlots = [];
for ($time = $startTime; $time < $endTime; $time += $interval) {
    $timeSlots[] = date('H:i', $time);
}

// Get existing reservations for this date to check availability
$query = "SELECT time, COUNT(*) as reservation_count FROM reservations WHERE date = ? AND status != 'cancelled' GROUP BY time";
$params = [$date];
$types = 's';
$existingReservations = executeQuery($query, $params, $types);

// Maximum reservations allowed per time slot
$maxReservationsPerSlot = 5;

// Create a map of time slots to reservation counts
$reservationCounts = [];
if ($existingReservations) {
    foreach ($existingReservations as $reservation) {
        $reservationCounts[$reservation['time']] = (int)$reservation['reservation_count'];
    }
}

// Create response with availability
$availableTimeSlots = [];
foreach ($timeSlots as $time) {
    $reservationCount = isset($reservationCounts[$time]) ? $reservationCounts[$time] : 0;
    $availableTimeSlots[] = [
        'time' => $time,
        'available' => $reservationCount < $maxReservationsPerSlot
    ];
}

// Return response
http_response_code(200);
echo json_encode([
    'success' => true,
    'timeSlots' => $availableTimeSlots
]); 