<?php
/**
 * Add Menu Item - Admin API
 * 
 * Adds a new menu item to the database (admin only)
 */

// Allow from any origin
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}

// Include database and authentication utilities
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/jwt_utils.php';

// Only handle POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

// Get the JSON data
$data = json_decode(file_get_contents("php://input"), true);

// Validate required fields
$requiredFields = ['name', 'description', 'price', 'category_id'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field])) {
        header("HTTP/1.1 400 Bad Request");
        exit(json_encode(['success' => false, 'error' => "Missing required field: $field"]));
    }
}

// Set default values for optional fields
$data['is_vegetarian'] = isset($data['is_vegetarian']) ? (bool)$data['is_vegetarian'] : false;
$data['is_vegan'] = isset($data['is_vegan']) ? (bool)$data['is_vegan'] : false;
$data['is_gluten_free'] = isset($data['is_gluten_free']) ? (bool)$data['is_gluten_free'] : false;
$data['contains_nuts'] = isset($data['contains_nuts']) ? (bool)$data['contains_nuts'] : false;
$data['spice_level'] = isset($data['spice_level']) ? (int)$data['spice_level'] : 0;
$data['is_available'] = isset($data['is_available']) ? (bool)$data['is_available'] : true;
$data['is_featured'] = isset($data['is_featured']) ? (bool)$data['is_featured'] : false;

// Convert booleans to integers for database
$isVegetarian = $data['is_vegetarian'] ? 1 : 0;
$isVegan = $data['is_vegan'] ? 1 : 0;
$isGlutenFree = $data['is_gluten_free'] ? 1 : 0;
$containsNuts = $data['contains_nuts'] ? 1 : 0;
$isAvailable = $data['is_available'] ? 1 : 0;
$isFeatured = $data['is_featured'] ? 1 : 0;

// Check if the category exists
$categoryQuery = "SELECT id FROM categories WHERE id = ?";
$categoryStmt = $conn->prepare($categoryQuery);
$categoryStmt->bind_param("i", $data['category_id']);
$categoryStmt->execute();
$categoryResult = $categoryStmt->get_result();

if ($categoryResult->num_rows === 0) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'Invalid category ID']));
}

// Insert the menu item
$query = "INSERT INTO menu_items (name, description, price, image_url, category_id, is_vegetarian, is_vegan, is_gluten_free, contains_nuts, spice_level, is_featured, is_active) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($query);
$stmt->bind_param(
    "ssdsiiiiiiii",
    $data['name'],
    $data['description'],
    $data['price'],
    $data['image_url'],
    $data['category_id'],
    $isVegetarian,
    $isVegan,
    $isGlutenFree,
    $containsNuts,
    $data['spice_level'],
    $isFeatured,
    $isAvailable
);

if ($stmt->execute()) {
    $itemId = $conn->insert_id;
    
    // Get the newly created item to return
    $newItemQuery = "SELECT * FROM menu_items WHERE id = ?";
    $newItemStmt = $conn->prepare($newItemQuery);
    $newItemStmt->bind_param("i", $itemId);
    $newItemStmt->execute();
    $newItemResult = $newItemStmt->get_result();
    $newItem = $newItemResult->fetch_assoc();
    
    // Format the response data
    $responseData = [
        'id' => (int)$newItem['id'],
        'name' => $newItem['name'],
        'description' => $newItem['description'],
        'price' => (float)$newItem['price'],
        'image_url' => $newItem['image_url'],
        'category_id' => (int)$newItem['category_id'],
        'is_vegetarian' => (bool)$newItem['is_vegetarian'],
        'is_vegan' => (bool)$newItem['is_vegan'],
        'is_gluten_free' => (bool)$newItem['is_gluten_free'],
        'contains_nuts' => (bool)$newItem['contains_nuts'],
        'spice_level' => (int)$newItem['spice_level'],
        'is_featured' => (bool)$newItem['is_featured'],
        'is_available' => (bool)$newItem['is_active']
    ];
    
    echo json_encode(['success' => true, 'data' => $responseData, 'message' => 'Menu item added successfully']);
} else {
    header("HTTP/1.1 500 Internal Server Error");
    echo json_encode(['success' => false, 'error' => 'Failed to add menu item: ' . $conn->error]);
} 