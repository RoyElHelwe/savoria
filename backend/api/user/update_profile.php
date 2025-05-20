<?php
/**
 * Update User Profile API
 * 
 * Updates the profile information for the authenticated user
 */

// Allow from any origin
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit;
}

// Include database and authentication utilities
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/jwt_utils.php';

// Only handle POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("HTTP/1.1 405 Method Not Allowed");
    exit(json_encode(['success' => false, 'error' => 'Method not allowed']));
}

// Create database connection
$db = new Database();
$conn = $db->getConnection();

// Get and validate JWT token
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

// Get user ID from the token payload
$userId = isset($payload['user_id']) ? $payload['user_id'] : null;

if (!$userId) {
    header("HTTP/1.1 401 Unauthorized");
    exit(json_encode(['success' => false, 'error' => 'Unauthorized: User ID not found in token']));
}

// Get request body
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'Invalid request data']));
}

// Validate required fields
$errors = [];

if (isset($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Invalid email format';
}

if (isset($data['phone']) && !preg_match('/^[+]?[0-9\s\-\(\)]{8,20}$/', $data['phone'])) {
    $errors[] = 'Invalid phone number format';
}

if (!empty($errors)) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'Validation failed', 'details' => $errors]));
}

// Check if email already exists (if changing)
if (isset($data['email'])) {
    $emailQuery = "SELECT id FROM users WHERE email = ? AND id != ?";
    $emailStmt = $conn->prepare($emailQuery);
    $emailStmt->bind_param("si", $data['email'], $userId);
    $emailStmt->execute();
    $emailResult = $emailStmt->get_result();
    
    if ($emailResult->num_rows > 0) {
        header("HTTP/1.1 409 Conflict");
        exit(json_encode(['success' => false, 'error' => 'Email already in use']));
    }
}

// Build update query based on submitted fields
$updateFields = [];
$queryParams = [];
$paramTypes = "";

// Fields that can be updated
$allowedFields = ['first_name', 'last_name', 'email', 'phone', 'address'];

foreach ($allowedFields as $field) {
    if (isset($data[$field])) {
        $updateFields[] = "$field = ?";
        $queryParams[] = $data[$field];
        $paramTypes .= "s"; // Assuming all fields are strings
    }
}

// If no fields to update, return error
if (empty($updateFields)) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'No valid fields to update']));
}

// Add updated_at field
$updateFields[] = "updated_at = NOW()";

// Add user ID as the last parameter
$queryParams[] = $userId;
$paramTypes .= "i";

// Build the final query
$updateQuery = "UPDATE users SET " . implode(", ", $updateFields) . " WHERE id = ?";

// Prepare and execute the query
$updateStmt = $conn->prepare($updateQuery);

// Bind parameters dynamically
if (!empty($queryParams)) {
    $updateStmt->bind_param($paramTypes, ...$queryParams);
}

if (!$updateStmt->execute()) {
    header("HTTP/1.1 500 Internal Server Error");
    exit(json_encode(['success' => false, 'error' => 'Failed to update profile: ' . $updateStmt->error]));
}

// Check if any rows were affected
if ($updateStmt->affected_rows === 0) {
    // No changes, but not necessarily an error
    echo json_encode(['success' => true, 'message' => 'No changes were made']);
    exit;
}

// Get updated user data
$getUpdatedQuery = "SELECT 
                      id, username, email, first_name, last_name, phone, address, role,
                      created_at, updated_at
                    FROM 
                      users 
                    WHERE 
                      id = ?";

$getStmt = $conn->prepare($getUpdatedQuery);
$getStmt->bind_param("i", $userId);
$getStmt->execute();
$result = $getStmt->get_result();
$userData = $result->fetch_assoc();

// Format user data for response
$userProfile = [
    'id' => (int)$userData['id'],
    'username' => $userData['username'],
    'email' => $userData['email'],
    'first_name' => $userData['first_name'],
    'last_name' => $userData['last_name'],
    'phone' => $userData['phone'],
    'address' => $userData['address'],
    'role' => $userData['role'],
    'created_at' => $userData['created_at'],
    'updated_at' => $userData['updated_at']
];

// Return the updated profile data
echo json_encode(['success' => true, 'message' => 'Profile updated successfully', 'profile' => $userProfile]);