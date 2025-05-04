<?php
/**
 * Set Featured Menu Items - Testing Utility
 * 
 * Simple script to mark specific menu items as featured for testing the homepage featured section
 * WARNING: This is a development utility only - should be removed in production
 */

// Include database connection
require_once '../../config/database.php';

// Set output as plain text
header('Content-Type: text/plain');

echo "===== SETTING FEATURED MENU ITEMS =====\n\n";

// Items to mark as featured (you can adjust these IDs)
$featuredItemIds = [1, 5, 9];

// First, clear all featured flags
$query = "UPDATE menu_items SET is_featured = 0";
$result = executeQuery($query);

if ($result === false) {
    echo "ERROR: Failed to reset featured items\n";
    exit;
}

echo "Successfully reset all featured items\n\n";

// Set specified items as featured
foreach ($featuredItemIds as $id) {
    $query = "UPDATE menu_items SET is_featured = 1 WHERE id = ?";
    $params = [$id];
    $types = 'i';
    
    $result = executeQuery($query, $params, $types);
    
    if ($result === false) {
        echo "ERROR: Failed to mark item ID $id as featured\n";
    } else {
        echo "SUCCESS: Menu item ID $id marked as featured\n";
    }
}

// Verify the update
$query = "SELECT id, name, price, is_featured FROM menu_items WHERE is_featured = 1";
$result = executeQuery($query);

if (empty($result)) {
    echo "\nWARNING: No featured items found after update\n";
} else {
    echo "\nCurrently featured items:\n";
    foreach ($result as $item) {
        echo "- ID: {$item['id']}, Name: {$item['name']}, Price: \${$item['price']}\n";
    }
}

echo "\n===== FINISHED =====\n";
echo "You can now test the featured items section on the homepage\n";
echo "API endpoint: http://localhost/savoria/backend/api/menu/get_featured.php\n"; 