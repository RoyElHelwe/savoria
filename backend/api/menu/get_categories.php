<?php
/**
 * Get Categories API Endpoint
 * 
 * Retrieve all menu categories
 * 
 * Method: GET
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

// Build the query
$query = "SELECT * FROM categories ORDER BY display_order, name";

// Execute the query
$result = executeQuery($query);

if ($result === null) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['error' => 'Database error']);
    exit;
}

// Prepare categories for response
$categories = [];

foreach ($result as $row) {
    $categories[] = [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'description' => $row['description'],
        'image_url' => $row['image_url'],
        'display_order' => (int)$row['display_order']
    ];
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'categories' => $categories
]); 