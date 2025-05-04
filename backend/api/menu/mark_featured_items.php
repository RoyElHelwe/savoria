<?php
/**
 * Helper script to mark menu items as featured for testing
 * This is a development/testing utility, not meant for production use
 * 
 * This script will mark 3 popular menu items as featured to display on the home page
 */

// Include database connection
require_once '../../config/database.php';

// Output as plain text for debugging
header('Content-Type: text/plain');

echo "===== MARKING FEATURED MENU ITEMS =====\n\n";

// First, reset all featured items
echo "Step 1: Resetting all featured items...\n";
$query = "UPDATE menu_items SET is_featured = 0";
$result = executeQuery($query);

if ($result === false) {
    echo "ERROR: Failed to reset featured items!\n";
    exit;
}

echo "SUCCESS: All items reset (is_featured = 0)\n\n";

// Get some popular items to mark as featured
echo "Step 2: Finding popular items to mark as featured...\n";

// For this example, let's use fixed IDs for simplicity
// In a real implementation, you might want to select based on ratings, popularity, etc.
$popularItemIds = [1, 5, 9]; // Replace with actual IDs from your database

// Alternatively, select random items from different categories
if (empty($popularItemIds)) {
    $query = "SELECT m.id
              FROM menu_items m
              JOIN categories c ON m.category_id = c.id
              WHERE m.is_active = 1
              GROUP BY c.id
              ORDER BY RAND()
              LIMIT 3";
    
    $result = executeQuery($query);
    
    if ($result === false) {
        echo "ERROR: Failed to select random items!\n";
        exit;
    }
    
    $popularItemIds = array_map(function($item) {
        return (int)$item['id'];
    }, $result);
}

echo "Selected item IDs to mark as featured: " . implode(', ', $popularItemIds) . "\n\n";

// Mark selected items as featured
echo "Step 3: Marking selected items as featured...\n";
foreach ($popularItemIds as $itemId) {
    $query = "UPDATE menu_items SET is_featured = 1 WHERE id = ?";
    $params = [$itemId];
    $types = 'i';
    $result = executeQuery($query, $params, $types);
    
    if ($result === false) {
        echo "ERROR: Failed to mark item ID {$itemId} as featured!\n";
        continue;
    }
    
    echo "SUCCESS: Marked item ID {$itemId} as featured\n";
}

// Display the featured items
echo "\nStep 4: Displaying featured items:\n";
$query = "SELECT m.id, m.name, m.price, c.name as category_name 
          FROM menu_items m
          JOIN categories c ON m.category_id = c.id
          WHERE m.is_featured = 1";
$result = executeQuery($query);

if ($result === false) {
    echo "ERROR: Failed to fetch featured items!\n";
    exit;
}

if (empty($result)) {
    echo "No featured items found. Something went wrong.\n";
} else {
    foreach ($result as $item) {
        echo "- ID: {$item['id']}, Name: {$item['name']}, Category: {$item['category_name']}, Price: \${$item['price']}\n";
    }
}

echo "\n===== COMPLETED =====\n";
echo "Featured items have been marked. You can now test the featured items API at:\n";
echo "http://localhost/savoria/backend/api/menu/get_featured.php\n\n";
echo "This should appear in the Home page Featured Section.\n"; 