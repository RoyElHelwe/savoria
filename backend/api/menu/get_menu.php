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

// Create DB connection
$db = new Database();
$conn = $db->getConnection();

// Get query parameters
$categoryId = isset($_GET['category_id']) ? (int)$_GET['category_id'] : null;
$featuredOnly = isset($_GET['featured']) && $_GET['featured'] === 'true';

// Build the query
$query = "SELECT m.item_id, m.name, m.description, m.price, m.image_url, 
          m.category_id, m.is_vegetarian, m.is_vegan, m.is_gluten_free, 
          m.contains_nuts, m.spice_level, m.is_featured, c.name as category_name 
          FROM menu_items m
          JOIN categories c ON m.category_id = c.id
          WHERE m.is_active = 1";

// Add category filter if specified
if ($categoryId) {
    $query .= " AND m.category_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $categoryId);
} else if ($featuredOnly) {
    // Add featured filter if specified
    $query .= " AND m.is_featured = 1";
    $stmt = $conn->prepare($query);
} else {
    // No additional parameters
    $stmt = $conn->prepare($query);
}

// Add ordering
$query .= " ORDER BY c.display_order, m.name";

// Execute the query
if ($stmt === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to prepare database query: ' . $conn->error]);
    exit;
}

$stmt->execute();
$result = $stmt->get_result();

if ($result === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database query failed: ' . $stmt->error]);
    exit;
}

// Group items by category for a cleaner response
$menuByCategory = [];

while ($item = $result->fetch_assoc()) {
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
    
    // Add item to the category with correct field names
    $menuByCategory[$categoryId]['items'][] = [
        'item_id' => (int)$item['item_id'],
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