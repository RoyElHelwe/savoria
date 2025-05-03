<?php
/**
 * Update Profile API Endpoint
 * 
 * Update user profile information
 * 
 * Method: POST
 * Authorization: Required (Bearer token)
 * Request body: JSON with profile fields to update
 */

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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

// Include required files
require_once '../../config/database.php';
require_once '../../config/jwt_utils.php';

// Get the JWT from the Authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'error' => 'Authentication required']);
    exit;
}

$jwt = $matches[1];

// Validate the JWT
$payload = validateJWT($jwt);

if (!$payload) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'error' => 'Invalid token']);
    exit;
}

// Get user ID from the JWT payload
$userId = isset($payload->user_id) ? $payload->user_id : null;

if (!$userId) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'error' => 'Invalid token']);
    exit;
}

// Get and validate the request body
$requestBody = file_get_contents('php://input');
$data = json_decode($requestBody, true);

if (!$data) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Invalid request data']);
    exit;
}

// Start building the query and parameters
$updates = [];
$params = [];
$types = '';

// First name
if (isset($data['first_name']) && !empty($data['first_name'])) {
    $updates[] = 'first_name = ?';
    $params[] = $data['first_name'];
    $types .= 's';
}

// Last name
if (isset($data['last_name']) && !empty($data['last_name'])) {
    $updates[] = 'last_name = ?';
    $params[] = $data['last_name'];
    $types .= 's';
}

// Email
if (isset($data['email']) && !empty($data['email'])) {
    // Validate email
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400); // Bad Request
        echo json_encode(['success' => false, 'error' => 'Invalid email format']);
        exit;
    }

    // Check if email already exists for a different user
    $emailQuery = "SELECT id FROM users WHERE email = ? AND id != ?";
    $emailParams = [$data['email'], $userId];
    $emailTypes = 'si';
    $existingEmail = executeQuery($emailQuery, $emailParams, $emailTypes);

    if ($existingEmail && count($existingEmail) > 0) {
        http_response_code(409); // Conflict
        echo json_encode(['success' => false, 'error' => 'Email already in use']);
        exit;
    }

    $updates[] = 'email = ?';
    $params[] = $data['email'];
    $types .= 's';
}

// Phone
if (isset($data['phone'])) {
    $updates[] = 'phone = ?';
    $params[] = $data['phone'];
    $types .= 's';
}

// Address
if (isset($data['address'])) {
    $updates[] = 'address = ?';
    $params[] = $data['address'];
    $types .= 's';
}

// Password update (requires current password validation)
if (isset($data['password']) && !empty($data['password']) && isset($data['current_password']) && !empty($data['current_password'])) {
    // Get the user's current password hash
    $passwordQuery = "SELECT password FROM users WHERE id = ?";
    $passwordParams = [$userId];
    $passwordTypes = 'i';
    $passwordResult = executeQuery($passwordQuery, $passwordParams, $passwordTypes);

    if (!$passwordResult || count($passwordResult) === 0) {
        http_response_code(404); // Not Found
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }

    $currentPasswordHash = $passwordResult[0]['password'];

    // Verify the current password
    if (!password_verify($data['current_password'], $currentPasswordHash)) {
        http_response_code(400); // Bad Request
        echo json_encode(['success' => false, 'error' => 'Current password is incorrect']);
        exit;
    }

    // Hash the new password
    $newPasswordHash = password_hash($data['password'], PASSWORD_DEFAULT);
    $updates[] = 'password = ?';
    $params[] = $newPasswordHash;
    $types .= 's';
}

// If no updates, return an error
if (empty($updates)) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'No valid fields to update']);
    exit;
}

// Add user ID to params for the WHERE clause
$params[] = $userId;
$types .= 'i';

// Build and execute the update query
$query = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
$result = executeQuery($query, $params, $types);

if ($result === false) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Failed to update profile']);
    exit;
}

// Get the updated user data
$userQuery = "SELECT id, username, email, role, first_name, last_name, phone, address FROM users WHERE id = ?";
$userParams = [$userId];
$userTypes = 'i';
$userResult = executeQuery($userQuery, $userParams, $userTypes);

if (!$userResult || count($userResult) === 0) {
    http_response_code(404); // Not Found
    echo json_encode(['success' => false, 'error' => 'User not found after update']);
    exit;
}

$user = $userResult[0];
$user['id'] = (int)$user['id'];

// Return success response with updated user data
http_response_code(200);
echo json_encode([
    'success' => true,
    'user' => $user
]); 