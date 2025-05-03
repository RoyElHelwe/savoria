<?php
/**
 * Search Menu API Endpoint
 * 
 * Search menu items by name or description
 * 
 * Method: GET
 * Required query parameters:
 * - q: Search query
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

// Check if search query is provided
if (!isset($_GET['q']) || empty($_GET['q'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Search query is required']);
    exit;
}

$searchQuery = '%' . $_GET['q'] . '%';

// Build the query
$query = "SELECT m.*, c.name as category_name 
          FROM menu_items m
          JOIN categories c ON m.category_id = c.id
          WHERE m.is_active = 1 AND 
                (m.name LIKE ? OR m.description LIKE ?)
          ORDER BY m.name";
$params = [$searchQuery, $searchQuery];
$types = 'ss';

// Execute the query
$result = executeQuery($query, $params, $types);

if ($result === null) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['error' => 'Database error']);
    exit;
}

// Format the results for response
$items = [];

foreach ($result as $row) {
    $items[] = [
        'item_id' => (int)$row['id'],
        'name' => $row['name'],
        'description' => $row['description'],
        'price' => (float)$row['price'],
        'image_url' => $row['image_url'],
        'category_id' => (int)$row['category_id'],
        'category_name' => $row['category_name'],
        'is_vegetarian' => (bool)$row['is_vegetarian'],
        'is_vegan' => (bool)$row['is_vegan'],
        'is_gluten_free' => (bool)$row['is_gluten_free'],
        'contains_nuts' => (bool)$row['contains_nuts'],
        'spice_level' => (int)$row['spice_level'],
        'is_featured' => (bool)$row['is_featured'],
        'is_active' => (bool)$row['is_active']
    ];
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'results' => $items
]); 