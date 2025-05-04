<?php
/**
 * Update Menu Item - Admin API
 * 
 * Updates an existing menu item in the database (admin only)
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
if (!isset($data['id'])) {
    header("HTTP/1.1 400 Bad Request");
    exit(json_encode(['success' => false, 'error' => 'Missing required field: id']));
}

$itemId = (int)$data['id'];

// Check if the menu item exists
$checkItemQuery = "SELECT id FROM menu_items WHERE id = ?";
$checkItemStmt = $conn->prepare($checkItemQuery);
$checkItemStmt->bind_param("i", $itemId);
$checkItemStmt->execute();
$checkItemResult = $checkItemStmt->get_result();

if ($checkItemResult->num_rows === 0) {
    header("HTTP/1.1 404 Not Found");
    exit(json_encode(['success' => false, 'error' => 'Menu item not found']));
}

// Build update query and parameters dynamically
$updateFields = [];
$paramTypes = "";
$paramValues = [];

// Check which fields are being updated
if (isset($data['name'])) {
    $updateFields[] = "name = ?";
    $paramTypes .= "s";
    $paramValues[] = $data['name'];
}

if (isset($data['description'])) {
    $updateFields[] = "description = ?";
    $paramTypes .= "s";
    $paramValues[] = $data['description'];
}

if (isset($data['price'])) {
    $updateFields[] = "price = ?";
    $paramTypes .= "d";
    $paramValues[] = (float)$data['price'];
}

if (isset($data['image_url'])) {
    $updateFields[] = "image_url = ?";
    $paramTypes .= "s";
    $paramValues[] = $data['image_url'];
}

if (isset($data['category_id'])) {
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
    
    $updateFields[] = "category_id = ?";
    $paramTypes .= "i";
    $paramValues[] = (int)$data['category_id'];
}

if (isset($data['is_vegetarian'])) {
    $updateFields[] = "is_vegetarian = ?";
    $paramTypes .= "i";
    $paramValues[] = $data['is_vegetarian'] ? 1 : 0;
}

if (isset($data['is_vegan'])) {
    $updateFields[] = "is_vegan = ?";
    $paramTypes .= "i";
    $paramValues[] = $data['is_vegan'] ? 1 : 0;
}

if (isset($data['is_gluten_free'])) {
    $updateFields[] = "is_gluten_free = ?";
    $paramTypes .= "i";
    $paramValues[] = $data['is_gluten_free'] ? 1 : 0;
}

if (isset($data['contains_nuts'])) {
    $updateFields[] = "contains_nuts = ?";
    $paramTypes .= "i";
    $paramValues[] = $data['contains_nuts'] ? 1 : 0;
}

if (isset($data['spice_level'])) {
    $updateFields[] = "spice_level = ?";
    $paramTypes .= "i";
    $paramValues[] = (int)$data['spice_level'];
}

if (isset($data['is_featured'])) {
    $updateFields[] = "is_featured = ?";
    $paramTypes .= "i";
    $paramValues[] = $data['is_featured'] ? 1 : 0;
}

if (isset($data['is_available'])) {
    $updateFields[] = "is_active = ?";
    $paramTypes .= "i";
    $paramValues[] = $data['is_available'] ? 1 : 0;
}

// If no fields to update
if (empty($updateFields)) {
    echo json_encode(['success' => true, 'message' => 'No changes made to menu item']);
    exit();
}

// Build the query
$query = "UPDATE menu_items SET " . implode(", ", $updateFields) . " WHERE id = ?";

// Add the itemId to the parameters
$paramTypes .= "i";
$paramValues[] = $itemId;

// Prepare and execute the query
$stmt = $conn->prepare($query);

// Create reference array for binding parameters
$bindParams = [$stmt, $paramTypes];
foreach ($paramValues as $key => $value) {
    $bindParams[] = &$paramValues[$key];
}

// Use call_user_func_array to bind the parameters dynamically
call_user_func_array('mysqli_stmt_bind_param', $bindParams);

if ($stmt->execute()) {
    // Get the updated item to return
    $updatedItemQuery = "SELECT * FROM menu_items WHERE id = ?";
    $updatedItemStmt = $conn->prepare($updatedItemQuery);
    $updatedItemStmt->bind_param("i", $itemId);
    $updatedItemStmt->execute();
    $updatedItemResult = $updatedItemStmt->get_result();
    $updatedItem = $updatedItemResult->fetch_assoc();
    
    // Format the response data
    $responseData = [
        'id' => (int)$updatedItem['id'],
        'name' => $updatedItem['name'],
        'description' => $updatedItem['description'],
        'price' => (float)$updatedItem['price'],
        'image_url' => $updatedItem['image_url'],
        'category_id' => (int)$updatedItem['category_id'],
        'is_vegetarian' => (bool)$updatedItem['is_vegetarian'],
        'is_vegan' => (bool)$updatedItem['is_vegan'],
        'is_gluten_free' => (bool)$updatedItem['is_gluten_free'],
        'contains_nuts' => (bool)$updatedItem['contains_nuts'],
        'spice_level' => (int)$updatedItem['spice_level'],
        'is_featured' => (bool)$updatedItem['is_featured'],
        'is_available' => (bool)$updatedItem['is_active']
    ];
    
    echo json_encode(['success' => true, 'data' => $responseData, 'message' => 'Menu item updated successfully']);
} else {
    header("HTTP/1.1 500 Internal Server Error");
    echo json_encode(['success' => false, 'error' => 'Failed to update menu item: ' . $conn->error]);
} 