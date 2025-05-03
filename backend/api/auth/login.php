<?php
/**
 * User Login API Endpoint
 * 
 * Authenticate a user and issue a JWT token
 * 
 * Method: POST
 * Required fields: username/email, password
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

// Include database connection and JWT utilities
require_once '../../config/database.php';
require_once '../../config/jwt_utils.php';

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($data['login']) || !isset($data['password']) || 
    empty(trim($data['login'])) || empty(trim($data['password']))) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Missing login credentials']);
    exit;
}

// Extract data
$login = trim($data['login']); // Can be username or email
$password = $data['password'];

// Check if user exists
$query = "SELECT * FROM users WHERE username = ? OR email = ?";
$result = executeQuery($query, [$login, $login], 'ss');

if (!$result || count($result) === 0) {
    http_response_code(401); // Unauthorized
    echo json_encode(['error' => 'Invalid credentials']);
    exit;
}

$user = $result[0];

// Verify password
if (!password_verify($password, $user['password'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['error' => 'Invalid credentials']);
    exit;
}

// Prepare JWT payload (exclude sensitive info like password)
$payload = [
    'user_id' => $user['id'],
    'username' => $user['username'],
    'email' => $user['email'],
    'role' => $user['role'],
    'first_name' => $user['first_name'],
    'last_name' => $user['last_name']
];

// Generate JWT token
$jwt = generateJWT($payload);

// Update last login time (optional)
$updateQuery = "UPDATE users SET last_login = NOW() WHERE id = ?";
executeQuery($updateQuery, [$user['id']], 'i');

// Return JWT token to client
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Login successful',
    'token' => $jwt,
    'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role'],
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name']
    ]
]); 