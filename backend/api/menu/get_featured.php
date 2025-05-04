<?php
/**
 * Get Featured Menu Items API Endpoint
 * 
 * Retrieve only featured menu items for showcasing on the home page
 * 
 * Method: GET
 * No required parameters
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

// Build the query to get featured items only
$query = "SELECT m.*, c.name as category_name 
          FROM menu_items m
          JOIN categories c ON m.category_id = c.id
          WHERE m.is_active = 1 AND m.is_featured = 1
          ORDER BY m.id";

// Execute the query
$result = executeQuery($query);

if ($result === null) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['error' => 'Database error']);
    exit;
}

// Format the result as a simple array of featured items
$featuredItems = [];

foreach ($result as $item) {
    $featuredItems[] = [
        'item_id' => (int)$item['id'],
        'name' => $item['name'],
        'description' => $item['description'],
        'price' => (float)$item['price'],
        'image_url' => $item['image_url'],
        'category_id' => (int)$item['category_id'],
        'category_name' => $item['category_name'],
        'is_vegetarian' => (bool)$item['is_vegetarian'],
        'is_vegan' => (bool)$item['is_vegan'],
        'is_gluten_free' => (bool)$item['is_gluten_free'],
        'contains_nuts' => (bool)$item['contains_nuts'],
        'spice_level' => (int)$item['spice_level'],
        'special_tag' => $item['special_tag'] ?? null
    ];
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'featured_items' => $featuredItems
]); 