<?php
/**
 * User Registration API Endpoint
 * 
 * Register a new user in the system
 * 
 * Method: POST
 * Required fields: username, email, password, first_name, last_name
 * Optional fields: phone, address
 */

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Allow only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Include database connection
require_once '../../config/database.php';

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$requiredFields = ['username', 'email', 'password', 'first_name', 'last_name'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field]) || empty(trim($data[$field]))) {
        http_response_code(400); // Bad Request
        echo json_encode(['error' => "Missing required field: $field"]);
        exit;
    }
}

// Extract data
$username = trim($data['username']);
$email = trim($data['email']);
$password = $data['password'];
$firstName = trim($data['first_name']);
$lastName = trim($data['last_name']);
$phone = isset($data['phone']) ? trim($data['phone']) : null;
$address = isset($data['address']) ? trim($data['address']) : null;

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email format']);
    exit;
}

// Validate password strength (minimum 8 characters, at least one letter and one number)
if (strlen($password) < 8 || !preg_match('/[A-Za-z]/', $password) || !preg_match('/[0-9]/', $password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Password must be at least 8 characters and contain at least one letter and one number']);
    exit;
}

// Check if username or email already exists
$checkQuery = "SELECT * FROM users WHERE username = ? OR email = ?";
$result = executeQuery($checkQuery, [$username, $email], 'ss');

if ($result && count($result) > 0) {
    $existingUser = $result[0];
    if ($existingUser['username'] === $username) {
        http_response_code(409); // Conflict
        echo json_encode(['error' => 'Username already exists']);
    } else {
        http_response_code(409);
        echo json_encode(['error' => 'Email already exists']);
    }
    exit;
}

// Hash the password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Insert new user (default role is 'customer')
$insertQuery = "INSERT INTO users (username, email, password, first_name, last_name, phone, address) 
               VALUES (?, ?, ?, ?, ?, ?, ?)";

$result = executeQuery(
    $insertQuery, 
    [$username, $email, $hashedPassword, $firstName, $lastName, $phone, $address],
    'sssssss'
);

if ($result) {
    $userId = getLastInsertId();
    
    http_response_code(201); // Created
    echo json_encode([
        'success' => true,
        'message' => 'User registered successfully',
        'user_id' => $userId
    ]);
} else {
    http_response_code(500); // Internal Server Error
    echo json_encode(['error' => 'Failed to register user']);
} 