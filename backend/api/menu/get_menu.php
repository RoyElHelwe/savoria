<?php
/**
 * Get Menu API Endpoint
 * 
 * Retrieve all menu items, optionally filtered by category
 * 
 * Method: GET
 * Optional query parameters:
 * - category_id: Filter items by category ID
 * - featured: Set to 'true' to get only featured items
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

// Get query parameters
$categoryId = isset($_GET['category_id']) ? (int)$_GET['category_id'] : null;
$featuredOnly = isset($_GET['featured']) && $_GET['featured'] === 'true';

// Build the query
$query = "SELECT m.*, c.name as category_name 
          FROM menu_items m
          JOIN categories c ON m.category_id = c.id
          WHERE m.is_active = 1";
$params = [];
$types = '';

// Add category filter if specified
if ($categoryId) {
    $query .= " AND m.category_id = ?";
    $params[] = $categoryId;
    $types .= 'i';
}

// Add featured filter if specified
if ($featuredOnly) {
    $query .= " AND m.is_featured = 1";
}

// Add ordering
$query .= " ORDER BY c.display_order, m.name";

// Execute the query
$result = executeQuery($query, $params, $types);

if ($result === null) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['error' => 'Database error']);
    exit;
}

// Group items by category for a cleaner response
$menuByCategory = [];

foreach ($result as $item) {
    $categoryId = $item['category_id'];
    $categoryName = $item['category_name'];
    
    // Initialize category array if it doesn't exist
    if (!isset($menuByCategory[$categoryId])) {
        $menuByCategory[$categoryId] = [
            'id' => (int)$categoryId,
            'name' => $categoryName,
            'items' => []
        ];
    }
    
    // Add item to the category
    $menuByCategory[$categoryId]['items'][] = [
        'item_id' => (int)$item['id'],
        'name' => $item['name'],
        'description' => $item['description'],
        'price' => (float)$item['price'],
        'image_url' => $item['image_url'],
        'category_id' => (int)$item['category_id'],
        'is_vegetarian' => (bool)$item['is_vegetarian'],
        'is_vegan' => (bool)$item['is_vegan'],
        'is_gluten_free' => (bool)$item['is_gluten_free'],
        'contains_nuts' => (bool)$item['contains_nuts'],
        'spice_level' => (int)$item['spice_level'],
        'is_featured' => (bool)$item['is_featured']
    ];
}

// Convert to indexed array for response
$response = array_values($menuByCategory);

http_response_code(200);
echo json_encode([
    'success' => true,
    'menu' => $response
]); 