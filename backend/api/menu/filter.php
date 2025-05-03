<?php
/**
 * Filter Menu API Endpoint
 * 
 * Filter menu items by dietary preferences
 * 
 * Method: GET
 * Optional query parameters:
 * - is_vegetarian: Set to 'true' to get only vegetarian items
 * - is_vegan: Set to 'true' to get only vegan items
 * - is_gluten_free: Set to 'true' to get only gluten-free items
 * - contains_nuts: Set to 'false' to get only items without nuts
 * - spice_level: Maximum spice level (0-5)
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

// Get filter parameters
$isVegetarian = isset($_GET['is_vegetarian']) && $_GET['is_vegetarian'] === 'true';
$isVegan = isset($_GET['is_vegan']) && $_GET['is_vegan'] === 'true';
$isGlutenFree = isset($_GET['is_gluten_free']) && $_GET['is_gluten_free'] === 'true';
$containsNuts = isset($_GET['contains_nuts']) && $_GET['contains_nuts'] === 'false' ? false : null;
$spiceLevel = isset($_GET['spice_level']) && is_numeric($_GET['spice_level']) ? (int)$_GET['spice_level'] : null;

// Build the query
$query = "SELECT m.*, c.name as category_name 
          FROM menu_items m
          JOIN categories c ON m.category_id = c.id
          WHERE m.is_active = 1";
$params = [];
$types = '';

// Add filters
if ($isVegetarian) {
    $query .= " AND m.is_vegetarian = 1";
}

if ($isVegan) {
    $query .= " AND m.is_vegan = 1";
}

if ($isGlutenFree) {
    $query .= " AND m.is_gluten_free = 1";
}

if ($containsNuts === false) {
    $query .= " AND m.contains_nuts = 0";
}

if ($spiceLevel !== null) {
    $query .= " AND m.spice_level <= ?";
    $params[] = $spiceLevel;
    $types .= 'i';
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
        'is_featured' => (bool)$item['is_featured'],
        'is_active' => (bool)$item['is_active']
    ];
}

// Convert to indexed array for response
$response = array_values($menuByCategory);

http_response_code(200);
echo json_encode([
    'success' => true,
    'menu' => $response
]); 