<?php
/**
 * Get Menu Item API Endpoint
 * 
 * Retrieve a single menu item by ID
 * 
 * Method: GET
 * Required query parameters:
 * - id: Menu item ID
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

// Check if ID is provided
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Item ID is required']);
    exit;
}

$itemId = (int)$_GET['id'];

// Build the query
$query = "SELECT * FROM menu_items WHERE id = ?";
$params = [$itemId];
$types = 'i';

// Execute the query
$result = executeQuery($query, $params, $types);

if ($result === null) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['error' => 'Database error']);
    exit;
}

// Check if item exists
if (empty($result)) {
    http_response_code(404); // Not Found
    echo json_encode(['error' => 'Menu item not found']);
    exit;
}

// Get the item
$row = $result[0];

// Format the item for response
$item = [
    'item_id' => (int)$row['id'],
    'name' => $row['name'],
    'description' => $row['description'],
    'price' => (float)$row['price'],
    'image_url' => $row['image_url'],
    'category_id' => (int)$row['category_id'],
    'is_vegetarian' => (bool)$row['is_vegetarian'],
    'is_vegan' => (bool)$row['is_vegan'],
    'is_gluten_free' => (bool)$row['is_gluten_free'],
    'contains_nuts' => (bool)$row['contains_nuts'],
    'spice_level' => (int)$row['spice_level'],
    'is_featured' => (bool)$row['is_featured'],
    'is_active' => (bool)$row['is_active']
];

http_response_code(200);
echo json_encode([
    'success' => true,
    'item' => $item
]); 