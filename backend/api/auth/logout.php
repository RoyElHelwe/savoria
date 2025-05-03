<?php
/**
 * User Logout API Endpoint
 * 
 * Logout the currently authenticated user
 * 
 * Method: POST
 * Required: Valid JWT token in Authorization header
 * 
 * Note: Since JWT is stateless, we can't truly "invalidate" a token on the server side
 * without implementing a token blacklist or using short expiration times.
 * This endpoint is mostly for client-side cleanup.
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

// Include JWT utilities
require_once '../../config/jwt_utils.php';

// Check for JWT token
$userData = authenticateUser();

if (!$userData) {
    http_response_code(401); // Unauthorized
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// In a real implementation with token blacklisting, we would add the token
// to a blacklist in the database here.

// Return success response
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Logout successful'
]);

// Client side should delete the token from localStorage/memory 