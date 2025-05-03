<?php
/**
 * Seed Data Script for Savoria Restaurant
 * 
 * Run this script to populate the database with initial data.
 */

// Include database configuration
require_once __DIR__ . '/config/database.php';

// Get database connection
$conn = getDbConnection();

if (!$conn) {
    die("Database connection failed. Please check your configuration.");
}

// Start transaction
$conn->begin_transaction();

try {
    // Insert categories
    $categories = [
        [
            'name' => 'Appetizers',
            'description' => 'Start your meal with our delicious appetizers',
            'display_order' => 1
        ],
        [
            'name' => 'Main Courses',
            'description' => 'Our chef\'s special main courses',
            'display_order' => 2
        ],
        [
            'name' => 'Desserts',
            'description' => 'Sweet treats to end your meal',
            'display_order' => 3
        ],
        [
            'name' => 'Beverages',
            'description' => 'Refreshing drinks to complement your food',
            'display_order' => 4
        ]
    ];
    
    $categoryIds = [];
    
    // Insert categories
    foreach ($categories as $category) {
        $stmt = $conn->prepare("
            INSERT INTO categories (name, description, display_order)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            description = VALUES(description),
            display_order = VALUES(display_order)
        ");
        
        $stmt->bind_param('ssi', 
            $category['name'],
            $category['description'],
            $category['display_order']
        );
        
        $stmt->execute();
        
        // Get category ID (either new or existing)
        $result = $conn->query("SELECT id FROM categories WHERE name = '{$category['name']}'");
        $row = $result->fetch_assoc();
        $categoryIds[$category['name']] = $row['id'];
        
        $stmt->close();
    }
    
    // Insert menu items
    $menuItems = [
        // Appetizers
        [
            'original_id' => 101,
            'name' => 'Garlic Bread',
            'description' => 'Freshly baked bread with garlic butter and herbs',
            'price' => 5.99,
            'image_url' => '/images/garlic-bread.jpg',
            'category_name' => 'Appetizers',
            'is_vegetarian' => true,
            'is_vegan' => false,
            'is_gluten_free' => false,
            'contains_nuts' => false,
            'spice_level' => 0,
            'is_featured' => false,
            'is_active' => true
        ],
        [
            'original_id' => 102,
            'name' => 'Mozzarella Sticks',
            'description' => 'Breaded mozzarella sticks served with marinara sauce',
            'price' => 7.99,
            'image_url' => '/images/mozzarella-sticks.jpg',
            'category_name' => 'Appetizers',
            'is_vegetarian' => true,
            'is_vegan' => false,
            'is_gluten_free' => false,
            'contains_nuts' => false,
            'spice_level' => 0,
            'is_featured' => true,
            'is_active' => true
        ],
        [
            'original_id' => 103,
            'name' => 'Spicy Buffalo Wings',
            'description' => 'Crispy chicken wings tossed in our signature buffalo sauce',
            'price' => 10.99,
            'image_url' => '/images/buffalo-wings.jpg',
            'category_name' => 'Appetizers',
            'is_vegetarian' => false,
            'is_vegan' => false,
            'is_gluten_free' => true,
            'contains_nuts' => false,
            'spice_level' => 3,
            'is_featured' => true,
            'is_active' => true
        ],
        
        // Main Courses
        [
            'original_id' => 201,
            'name' => 'Classic Cheeseburger',
            'description' => 'Juicy beef patty with cheddar cheese, lettuce, tomato, and our special sauce',
            'price' => 12.99,
            'image_url' => '/images/cheeseburger.jpg',
            'category_name' => 'Main Courses',
            'is_vegetarian' => false,
            'is_vegan' => false,
            'is_gluten_free' => false,
            'contains_nuts' => false,
            'spice_level' => 0,
            'is_featured' => true,
            'is_active' => true
        ],
        [
            'original_id' => 202,
            'name' => 'Margherita Pizza',
            'description' => 'Traditional pizza with tomato sauce, fresh mozzarella, and basil',
            'price' => 14.99,
            'image_url' => '/images/margherita-pizza.jpg',
            'category_name' => 'Main Courses',
            'is_vegetarian' => true,
            'is_vegan' => false,
            'is_gluten_free' => false,
            'contains_nuts' => false,
            'spice_level' => 0,
            'is_featured' => false,
            'is_active' => true
        ],
        [
            'original_id' => 203,
            'name' => 'Spicy Thai Curry',
            'description' => 'Authentic Thai curry with your choice of protein and seasonal vegetables',
            'price' => 16.99,
            'image_url' => '/images/thai-curry.jpg',
            'category_name' => 'Main Courses',
            'is_vegetarian' => false,
            'is_vegan' => false,
            'is_gluten_free' => true,
            'contains_nuts' => true,
            'spice_level' => 4,
            'is_featured' => true,
            'is_active' => true
        ],
        
        // Desserts
        [
            'original_id' => 301,
            'name' => 'Chocolate Lava Cake',
            'description' => 'Warm chocolate cake with a molten center, served with vanilla ice cream',
            'price' => 8.99,
            'image_url' => '/images/chocolate-lava-cake.jpg',
            'category_name' => 'Desserts',
            'is_vegetarian' => true,
            'is_vegan' => false,
            'is_gluten_free' => false,
            'contains_nuts' => false,
            'spice_level' => 0,
            'is_featured' => true,
            'is_active' => true
        ],
        [
            'original_id' => 302,
            'name' => 'New York Cheesecake',
            'description' => 'Creamy cheesecake with a graham cracker crust, topped with berry compote',
            'price' => 7.99,
            'image_url' => '/images/cheesecake.jpg',
            'category_name' => 'Desserts',
            'is_vegetarian' => true,
            'is_vegan' => false,
            'is_gluten_free' => false,
            'contains_nuts' => false,
            'spice_level' => 0,
            'is_featured' => false,
            'is_active' => true
        ],
        
        // Beverages
        [
            'original_id' => 401,
            'name' => 'Fresh Lemonade',
            'description' => 'Homemade lemonade with fresh lemons and mint',
            'price' => 3.99,
            'image_url' => '/images/lemonade.jpg',
            'category_name' => 'Beverages',
            'is_vegetarian' => true,
            'is_vegan' => true,
            'is_gluten_free' => true,
            'contains_nuts' => false,
            'spice_level' => 0,
            'is_featured' => false,
            'is_active' => true
        ],
        [
            'original_id' => 402,
            'name' => 'Iced Coffee',
            'description' => 'Cold brewed coffee served over ice with your choice of milk and sweetener',
            'price' => 4.99,
            'image_url' => '/images/iced-coffee.jpg',
            'category_name' => 'Beverages',
            'is_vegetarian' => true,
            'is_vegan' => true,
            'is_gluten_free' => true,
            'contains_nuts' => false,
            'spice_level' => 0,
            'is_featured' => false,
            'is_active' => true
        ]
    ];
    
    // Insert menu items
    foreach ($menuItems as $item) {
        $stmt = $conn->prepare("
            INSERT INTO menu_items (
                name, description, price, image_url, category_id, 
                is_vegetarian, is_vegan, is_gluten_free, contains_nuts, 
                spice_level, is_featured, is_active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                description = VALUES(description),
                price = VALUES(price),
                image_url = VALUES(image_url),
                is_vegetarian = VALUES(is_vegetarian),
                is_vegan = VALUES(is_vegan),
                is_gluten_free = VALUES(is_gluten_free),
                contains_nuts = VALUES(contains_nuts),
                spice_level = VALUES(spice_level),
                is_featured = VALUES(is_featured),
                is_active = VALUES(is_active)
        ");
        
        $category_id = $categoryIds[$item['category_name']];
        $is_vegetarian = $item['is_vegetarian'] ? 1 : 0;
        $is_vegan = $item['is_vegan'] ? 1 : 0;
        $is_gluten_free = $item['is_gluten_free'] ? 1 : 0;
        $contains_nuts = $item['contains_nuts'] ? 1 : 0;
        $is_featured = $item['is_featured'] ? 1 : 0;
        $is_active = $item['is_active'] ? 1 : 0;
        
        $stmt->bind_param('ssdsiiiiiiii', 
            $item['name'],
            $item['description'],
            $item['price'],
            $item['image_url'],
            $category_id,
            $is_vegetarian,
            $is_vegan,
            $is_gluten_free,
            $contains_nuts,
            $item['spice_level'],
            $is_featured,
            $is_active
        );
        
        $stmt->execute();
        $stmt->close();
    }
    
    // Insert some restaurant tables
    $tables = [
        ['table_number' => 'A1', 'capacity' => 2, 'location' => 'Window'],
        ['table_number' => 'A2', 'capacity' => 2, 'location' => 'Window'],
        ['table_number' => 'B1', 'capacity' => 4, 'location' => 'Center'],
        ['table_number' => 'B2', 'capacity' => 4, 'location' => 'Center'],
        ['table_number' => 'C1', 'capacity' => 6, 'location' => 'Corner'],
        ['table_number' => 'D1', 'capacity' => 8, 'location' => 'Private Room']
    ];
    
    foreach ($tables as $table) {
        $stmt = $conn->prepare("
            INSERT INTO tables (table_number, capacity, location)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                capacity = VALUES(capacity),
                location = VALUES(location)
        ");
        
        $stmt->bind_param('sis', 
            $table['table_number'],
            $table['capacity'],
            $table['location']
        );
        
        $stmt->execute();
        $stmt->close();
    }
    
    // Insert settings
    $settings = [
        ['setting_key' => 'restaurant_name', 'setting_value' => 'Savoria', 'setting_type' => 'string'],
        ['setting_key' => 'restaurant_address', 'setting_value' => '123 Main St, City, Country', 'setting_type' => 'string'],
        ['setting_key' => 'restaurant_phone', 'setting_value' => '+1 (555) 123-4567', 'setting_type' => 'string'],
        ['setting_key' => 'restaurant_email', 'setting_value' => 'info@savoria.com', 'setting_type' => 'string'],
        ['setting_key' => 'opening_hours', 'setting_value' => json_encode([
            'monday' => '11:00-22:00',
            'tuesday' => '11:00-22:00',
            'wednesday' => '11:00-22:00',
            'thursday' => '11:00-22:00',
            'friday' => '11:00-23:00',
            'saturday' => '11:00-23:00',
            'sunday' => '12:00-21:00'
        ]), 'setting_type' => 'json'],
        ['setting_key' => 'reservation_interval', 'setting_value' => '30', 'setting_type' => 'number']
    ];
    
    foreach ($settings as $setting) {
        $stmt = $conn->prepare("
            INSERT INTO settings (setting_key, setting_value, setting_type)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                setting_value = VALUES(setting_value),
                setting_type = VALUES(setting_type)
        ");
        
        $stmt->bind_param('sss', 
            $setting['setting_key'],
            $setting['setting_value'],
            $setting['setting_type']
        );
        
        $stmt->execute();
        $stmt->close();
    }
    
    // Commit transaction
    $conn->commit();
    
    echo "Database seeded successfully!";
    
} catch (Exception $e) {
    // Roll back transaction on error
    $conn->rollback();
    die("Error seeding database: " . $e->getMessage());
} finally {
    // Close connection
    $conn->close();
} 