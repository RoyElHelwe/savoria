-- Create the database
CREATE DATABASE IF NOT EXISTS restaurant_db;
USE restaurant_db;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    role_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    category_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
    item_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    category_id INT NOT NULL,
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,
    is_gluten_free BOOLEAN DEFAULT FALSE,
    contains_nuts BOOLEAN DEFAULT FALSE,
    spice_level TINYINT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- Tables table (for restaurant seating)
CREATE TABLE IF NOT EXISTS restaurant_tables (
    table_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    table_number VARCHAR(20) NOT NULL,
    capacity INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    location VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
    reservation_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    table_id INT,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    party_size INT NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(table_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    order_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_type ENUM('delivery', 'pickup', 'dine-in') NOT NULL,
    status ENUM('pending', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'credit_card', 'debit_card', 'paypal', 'other') DEFAULT 'cash',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    delivery_address TEXT,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (item_id) REFERENCES menu_items(item_id)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_id INT,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

-- Contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    message_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'replied') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Restaurant settings table
CREATE TABLE IF NOT EXISTS settings (
    setting_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (role_name, description) VALUES
('admin', 'Administrator with full system access'),
('manager', 'Restaurant manager with elevated privileges'),
('staff', 'Restaurant staff with basic access'),
('customer', 'Regular customer');

-- Insert default admin user
INSERT INTO users (username, email, password, first_name, last_name, role_id) VALUES
('admin', 'admin@savoria.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 1);
-- Note: Password is "password" - change this in production!

-- Insert sample categories
INSERT INTO categories (name, description, display_order) VALUES
('Starters', 'Appetizers and small plates to start your meal', 1),
('Main Courses', 'Hearty main dishes featuring our signature flavors', 2),
('Desserts', 'Sweet treats to finish your dining experience', 3),
('Beverages', 'Refreshing drinks and signature cocktails', 4),
('Special Menu', 'Chef''s special creations and seasonal offerings', 5);

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, category_id, is_vegetarian, is_featured) VALUES
('Crispy Calamari', 'Tender calamari lightly fried and served with lemon aioli', 12.99, 1, FALSE, TRUE),
('Bruschetta', 'Toasted baguette topped with fresh tomatoes, basil and garlic', 9.99, 1, TRUE, FALSE),
('Garlic Bread', 'Freshly baked bread with garlic butter and herbs', 7.99, 1, TRUE, FALSE),
('Spinach Artichoke Dip', 'Creamy spinach and artichoke dip served with tortilla chips', 10.99, 1, TRUE, FALSE),
('Mozzarella Sticks', 'Breaded mozzarella sticks served with marinara sauce', 8.99, 1, TRUE, FALSE),

('Grilled Salmon', 'Fresh Atlantic salmon with roasted vegetables and lemon herb sauce', 24.99, 2, FALSE, TRUE),
('Filet Mignon', '8oz filet mignon with garlic mashed potatoes and seasonal vegetables', 32.99, 2, FALSE, TRUE),
('Chicken Parmesan', 'Breaded chicken breast topped with marinara and mozzarella, served with pasta', 18.99, 2, FALSE, FALSE),
('Mushroom Risotto', 'Creamy Arborio rice with wild mushrooms, finished with parmesan and truffle oil', 18.99, 2, TRUE, FALSE),
('Lobster Ravioli', 'Handmade ravioli filled with lobster meat in a creamy tomato sauce', 26.99, 2, FALSE, TRUE),

('Chocolate Soufflé', 'Warm chocolate soufflé with a molten center, served with vanilla ice cream', 12.99, 3, TRUE, TRUE),
('Tiramisu', 'Classic Italian dessert with layers of coffee-soaked ladyfingers and mascarpone', 10.99, 3, TRUE, FALSE),
('New York Cheesecake', 'Creamy cheesecake with a graham cracker crust and berry compote', 9.99, 3, TRUE, FALSE),
('Crème Brûlée', 'Classic vanilla custard with a caramelized sugar crust', 11.99, 3, TRUE, TRUE),
('Apple Tart', 'Warm apple tart with cinnamon, served with caramel sauce and ice cream', 10.99, 3, TRUE, FALSE),

('Fresh Mint Lemonade', 'Freshly squeezed lemons with mint and a touch of honey', 4.99, 4, TRUE, FALSE),
('Strawberry Basil Smash', 'Muddled strawberries and basil with soda water and a hint of lime', 5.99, 4, TRUE, TRUE),
('Espresso', 'Rich, full-bodied espresso', 3.99, 4, TRUE, FALSE),
('Cappuccino', 'Espresso with steamed milk and foam', 4.99, 4, TRUE, FALSE),
('Red Wine Sangria', 'Red wine with fresh fruits and a splash of brandy', 8.99, 4, TRUE, TRUE);

-- Insert sample restaurant tables
INSERT INTO restaurant_tables (table_number, capacity, location) VALUES
('A1', 2, 'Window'),
('A2', 2, 'Window'),
('A3', 2, 'Window'),
('A4', 2, 'Indoor'),
('B1', 4, 'Indoor'),
('B2', 4, 'Indoor'),
('B3', 4, 'Indoor'),
('C1', 6, 'Indoor'),
('C2', 6, 'Private'),
('D1', 8, 'Private');

-- Insert sample settings
INSERT INTO settings (setting_key, setting_value) VALUES
('restaurant_name', 'Savoria'),
('restaurant_address', '123 Gourmet Street, Culinary District'),
('restaurant_phone', '(123) 456-7890'),
('restaurant_email', 'info@savoria.com'),
('opening_hours_weekday', '11:30 AM - 10:00 PM'),
('opening_hours_weekend', '10:00 AM - 11:00 PM'),
('delivery_radius', '5'),
('delivery_minimum_order', '15.00'),
('order_preparation_time', '20'),
('reservation_interval', '30'),
('max_party_size', '20'),
('enable_online_ordering', 'true'),
('enable_reservations', 'true'),
('tax_rate', '8.5');