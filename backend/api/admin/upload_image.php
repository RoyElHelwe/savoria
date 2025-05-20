<?php
/**
 * Image Upload API - Admin Only
 * 
 * Handles uploading images for menu items
 * 
 * Method: POST
 * Authorization: Required (Bearer token, admin/manager only)
 * Request body: Multipart form data with 'image' field
 * Response: JSON with success status and image URL
 */

// Allow from any origin
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}

// Include database and authentication utilities
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/jwt_utils.php';

// Only handle POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("HTTP/1.1 405 Method Not Allowed");
    header('Content-Type: application/json');
    exit(json_encode(['success' => false, 'error' => 'Method not allowed']));
}

// Create database connection
$db = new Database();
$conn = $db->getConnection();

// Get JWT from header
$token = getJWTFromHeader();

if (!$token) {
    header("HTTP/1.1 401 Unauthorized");
    header('Content-Type: application/json');
    exit(json_encode(['success' => false, 'error' => 'Unauthorized: No token provided']));
}

// Validate the JWT and get the payload
$payload = validateJWT($token);

if (!$payload) {
    header("HTTP/1.1 401 Unauthorized");
    header('Content-Type: application/json');
    exit(json_encode(['success' => false, 'error' => 'Unauthorized: Invalid token']));
}

// Check if user has admin or manager role
$userId = isset($payload['user_id']) ? $payload['user_id'] : null;
$userRole = isset($payload['role']) ? $payload['role'] : null;

if (!$userId) {
    header("HTTP/1.1 401 Unauthorized");
    header('Content-Type: application/json');
    exit(json_encode(['success' => false, 'error' => 'Unauthorized: User ID not found in token']));
}

if ($userRole !== 'admin' && $userRole !== 'manager') {
    header("HTTP/1.1 403 Forbidden");
    header('Content-Type: application/json');
    exit(json_encode(['success' => false, 'error' => 'Access denied. Admin privileges required.']));
}

// Check if image is uploaded
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    header("HTTP/1.1 400 Bad Request");
    header('Content-Type: application/json');
    $errorMsg = isset($_FILES['image']) ? 'Upload error: ' . $_FILES['image']['error'] : 'No image uploaded';
    exit(json_encode(['success' => false, 'error' => $errorMsg]));
}

// Validate image
$file = $_FILES['image'];
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$maxSize = 5 * 1024 * 1024; // 5MB

// Check file type
if (!in_array($file['type'], $allowedTypes)) {
    header("HTTP/1.1 400 Bad Request");
    header('Content-Type: application/json');
    exit(json_encode(['success' => false, 'error' => 'Invalid file type. Allowed types: JPG, PNG, GIF, WEBP']));
}

// Check file size
if ($file['size'] > $maxSize) {
    header("HTTP/1.1 400 Bad Request");
    header('Content-Type: application/json');
    exit(json_encode(['success' => false, 'error' => 'File too large. Maximum size: 5MB']));
}

// Create uploads directory if it doesn't exist
$uploadsDir = __DIR__ . '/../public/images/menu';
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

// Generate unique filename
$fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
$uniqueName = uniqid('menu_') . '.' . $fileExtension;
$targetPath = $uploadsDir . '/' . $uniqueName;

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    // Image URL relative to the backend
    $imageUrl = '/images/menu/' . $uniqueName;
    
    // Log the upload
    $now = date('Y-m-d H:i:s');
    $logQuery = "INSERT INTO upload_logs (user_id, filename, original_filename, file_type, file_size, upload_date) 
                VALUES (?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($logQuery);
    if ($stmt) {
        $stmt->bind_param('isssss', $userId, $uniqueName, $file['name'], $file['type'], $file['size'], $now);
        $stmt->execute();
    }
    
    // Return success response
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true, 
        'image_url' => $imageUrl,
        'message' => 'Image uploaded successfully'
    ]);
} else {
    // Failed to move file
    header("HTTP/1.1 500 Internal Server Error");
    header('Content-Type: application/json');
    exit(json_encode(['success' => false, 'error' => 'Failed to save uploaded file']));
}