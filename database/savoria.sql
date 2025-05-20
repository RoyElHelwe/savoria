-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 20, 2025 at 02:37 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `savoria`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`, `image_url`, `display_order`, `created_at`, `updated_at`) VALUES
(1, 'Appetizers', 'Start your meal with our delicious appetizers', NULL, 1, '2025-05-03 14:36:22', '2025-05-03 14:36:22'),
(2, 'Main Courses', 'Our chef\'s special main courses', NULL, 2, '2025-05-03 14:36:22', '2025-05-03 14:36:22'),
(3, 'Desserts', 'Sweet treats to end your meal', NULL, 3, '2025-05-03 14:36:22', '2025-05-03 14:36:22'),
(4, 'Beverages', 'Refreshing drinks to complement your food', NULL, 4, '2025-05-03 14:36:22', '2025-05-03 14:36:22');

-- --------------------------------------------------------

--
-- Table structure for table `menu_items`
--

CREATE TABLE `menu_items` (
  `item_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `category_id` int(11) NOT NULL,
  `is_vegetarian` tinyint(1) NOT NULL DEFAULT 0,
  `is_vegan` tinyint(1) NOT NULL DEFAULT 0,
  `is_gluten_free` tinyint(1) NOT NULL DEFAULT 0,
  `contains_nuts` tinyint(1) NOT NULL DEFAULT 0,
  `spice_level` tinyint(4) NOT NULL DEFAULT 0,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `menu_items`
--

INSERT INTO `menu_items` (`item_id`, `name`, `description`, `price`, `image_url`, `category_id`, `is_vegetarian`, `is_vegan`, `is_gluten_free`, `contains_nuts`, `spice_level`, `is_featured`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Garlic Breadd', 'Freshly baked bread with garlic butter and herbs', 7.00, '/images/garlic-bread.jpg', 1, 1, 0, 0, 0, 0, 1, 1, '2025-05-03 14:36:22', '2025-05-04 08:27:36'),
(2, 'Mozzarella Sticks', 'Breaded mozzarella sticks served with marinara sauce', 7.99, '/images/mozzarella-sticks.jpg', 1, 1, 0, 0, 0, 0, 1, 1, '2025-05-03 14:36:22', '2025-05-03 14:36:22'),
(3, 'Spicy Buffalo Wings', 'Crispy chicken wings tossed in our signature buffalo sauce', 10.99, '/images/buffalo-wings.jpg', 1, 0, 0, 1, 0, 3, 1, 1, '2025-05-03 14:36:22', '2025-05-03 14:36:22'),
(4, 'Classic Cheeseburger', 'Juicy beef patty with cheddar cheese, lettuce, tomato, and our special sauce', 12.99, '/images/cheeseburger.jpg', 2, 0, 0, 0, 0, 0, 1, 1, '2025-05-03 14:36:22', '2025-05-03 14:36:22'),
(5, 'Margherita Pizza', 'Traditional pizza with tomato sauce, fresh mozzarella, and basil', 14.99, '/images/margherita-pizza.jpg', 2, 1, 0, 0, 0, 0, 0, 1, '2025-05-03 14:36:22', '2025-05-03 14:36:22'),
(6, 'Spicy Thai Curry', 'Authentic Thai curry with your choice of protein and seasonal vegetables', 16.99, '/images/thai-curry.jpg', 2, 0, 0, 1, 1, 4, 1, 1, '2025-05-03 14:36:22', '2025-05-03 14:36:22'),
(7, 'Chocolate Lava Cake', 'Warm chocolate cake with a molten center, served with vanilla ice cream', 8.99, '/images/chocolate-lava-cake.jpg', 3, 1, 0, 0, 0, 0, 1, 1, '2025-05-03 14:36:22', '2025-05-03 14:36:22'),
(8, 'New York Cheesecake', 'Creamy cheesecake with a graham cracker crust, topped with berry compote', 7.99, '/images/cheesecake.jpg', 3, 1, 0, 0, 0, 0, 0, 1, '2025-05-03 14:36:22', '2025-05-03 14:36:22'),
(9, 'Fresh Lemonade', 'Homemade lemonade with fresh lemons and mint', 3.99, '/images/lemonade.jpg', 4, 1, 1, 1, 0, 0, 0, 1, '2025-05-03 14:36:22', '2025-05-03 14:36:22'),
(10, 'Iced Coffee', 'Cold brewed coffee served over ice with your choice of milk and sweetener', 4.99, '/images/iced-coffee.jpg', 4, 1, 1, 1, 0, 0, 0, 1, '2025-05-03 14:36:22', '2025-05-03 14:36:22');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `order_type` enum('delivery','pickup','dine-in') NOT NULL DEFAULT 'delivery',
  `status` enum('pending','confirmed','preparing','out for delivery','delivered','ready for pickup','completed','cancelled') NOT NULL DEFAULT 'pending',
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL DEFAULT 'cash',
  `payment_status` enum('pending','paid','failed') NOT NULL DEFAULT 'pending',
  `delivery_address` text DEFAULT NULL,
  `delivery_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `order_item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price_per_unit` decimal(10,2) NOT NULL,
  `special_instructions` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reservations`
--

CREATE TABLE `reservations` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `guests` int(11) NOT NULL,
  `special_requests` text DEFAULT NULL,
  `status` enum('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
  `user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reservations`
--

INSERT INTO `reservations` (`id`, `date`, `time`, `name`, `email`, `phone`, `guests`, `special_requests`, `status`, `user_id`, `created_at`, `updated_at`) VALUES
(1, '2025-05-05', '17:00:00', 'Roy Helwe', 'markazhelwe@gmail.com', '+96171567290', 5, 'CANCELLED: Rejected by administrator', 'cancelled', NULL, '2025-05-04 09:55:54', '2025-05-04 10:25:33'),
(2, '2025-05-05', '17:00:00', 'Roy Helwe', 'markazhelwe@gmail.com', '+96171567290', 5, NULL, 'confirmed', NULL, '2025-05-04 09:58:16', '2025-05-04 10:25:36'),
(3, '2025-05-05', '17:00:00', 'Roy Helwe', 'markazhelwe@gmail.com', '+96171567290', 5, NULL, 'pending', NULL, '2025-05-04 09:59:17', '2025-05-04 09:59:17'),
(4, '2025-05-05', '17:00:00', 'Roy Helwe', 'markazhelwe@gmail.com', '+96171567290', 5, NULL, 'pending', NULL, '2025-05-04 10:00:35', '2025-05-04 10:00:35'),
(5, '2025-05-05', '17:00:00', 'Roy Helwe', 'markazhelwe@gmail.com', '+96171567290', 5, NULL, 'pending', NULL, '2025-05-04 10:01:16', '2025-05-04 10:01:16'),
(6, '2025-05-06', '15:00:00', 'Karim', 'karim@gmail.com', '+96181193427', 5, NULL, 'pending', NULL, '2025-05-04 17:52:31', '2025-05-04 17:52:31'),
(7, '2025-05-07', '16:00:00', 'Mhamad Alwan', 'test@gmail.com', '+96171567290', 5, NULL, 'confirmed', NULL, '2025-05-04 18:35:03', '2025-05-04 18:37:07'),
(8, '2025-05-20', '15:00:00', 'raed helwe', 'markazhelwe@gmail.com', '+96171567290', 2, NULL, 'confirmed', NULL, '2025-05-20 11:14:15', '2025-05-20 11:24:40');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `rating` tinyint(4) NOT NULL,
  `comment` text DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `role_name` enum('customer','staff','manager','admin') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`, `created_at`, `updated_at`) VALUES
(1, 'customer', '2025-05-20 12:15:26', '2025-05-20 12:15:26'),
(2, 'staff', '2025-05-20 12:15:26', '2025-05-20 12:15:26'),
(3, 'manager', '2025-05-20 12:15:26', '2025-05-20 12:15:26'),
(4, 'admin', '2025-05-20 12:15:26', '2025-05-20 12:15:26');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `name`, `value`, `created_at`, `updated_at`) VALUES
(1, 'restaurant_name', 'Soveria', '2025-05-04 08:52:31', '2025-05-04 18:37:57'),
(2, 'address', 'Tripoli', '2025-05-04 08:52:31', '2025-05-04 18:38:09'),
(3, 'phone', '(123) 456-7890', '2025-05-04 08:52:31', '2025-05-04 08:52:31'),
(4, 'email', 'contact@savoria.com', '2025-05-04 08:52:31', '2025-05-04 08:52:31'),
(5, 'opening_hours', '{\"monday\":{\"open\":\"11:00\",\"close\":\"22:00\",\"closed\":false},\"tuesday\":{\"open\":\"11:00\",\"close\":\"22:00\",\"closed\":false},\"wednesday\":{\"open\":\"11:00\",\"close\":\"22:00\",\"closed\":false},\"thursday\":{\"open\":\"11:00\",\"close\":\"22:00\",\"closed\":false},\"friday\":{\"open\":\"11:00\",\"close\":\"23:00\",\"closed\":false},\"saturday\":{\"open\":\"10:00\",\"close\":\"23:00\",\"closed\":false},\"sunday\":{\"open\":\"10:00\",\"close\":\"22:00\",\"closed\":true}}', '2025-05-04 08:52:31', '2025-05-04 08:53:07'),
(6, 'social_media', '{\"facebook\":\"https:\\/\\/facebook.com\\/savoria\",\"instagram\":\"https:\\/\\/instagram.com\\/savoria\",\"twitter\":\"https:\\/\\/twitter.com\\/savoria\"}', '2025-05-04 08:52:31', '2025-05-04 08:52:51'),
(7, 'reservation_max_days', '30', '2025-05-04 08:52:31', '2025-05-04 08:52:31'),
(8, 'reservation_min_hours', '2', '2025-05-04 08:52:31', '2025-05-04 08:52:31'),
(9, 'reservation_time_slot', '30', '2025-05-04 08:52:31', '2025-05-04 08:52:31'),
(10, 'reservation_duration', '90', '2025-05-04 08:52:31', '2025-05-04 08:52:31'),
(11, 'delivery_fee', '5.00', '2025-05-20 12:15:26', '2025-05-20 12:15:26'),
(12, 'tax_rate', '8.5', '2025-05-20 12:15:26', '2025-05-20 12:15:26');

-- --------------------------------------------------------

--
-- Table structure for table `tables`
--

CREATE TABLE `tables` (
  `id` int(11) NOT NULL,
  `table_number` varchar(10) NOT NULL,
  `capacity` int(11) NOT NULL,
  `location` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tables`
--

INSERT INTO `tables` (`id`, `table_number`, `capacity`, `location`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'A1', 2, 'Window', 1, '2025-05-03 14:36:22', '2025-05-03 14:36:22'),
(2, 'A2', 2, 'Window', 1, '2025-05-03 14:36:22', '2025-05-03 14:36:22'),
(3, 'B1', 4, 'Center', 1, '2025-05-03 14:36:22', '2025-05-03 14:36:22'),
(4, 'B2', 4, 'Center', 1, '2025-05-03 14:36:22', '2025-05-03 14:36:22'),
(5, 'C1', 6, 'Corner', 1, '2025-05-03 14:36:22', '2025-05-03 14:36:22'),
(6, 'D1', 8, 'Private Room', 1, '2025-05-03 14:36:22', '2025-05-03 14:36:22');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `role` enum('customer','staff','manager','admin') NOT NULL DEFAULT 'customer',
  `role_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `first_name`, `last_name`, `phone`, `address`, `role`, `role_id`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@savoria.com', '$2y$10$cNK7bG7ZcKif5gwk9LMwQ.gNr.9QyXjZBbYbrguwjI/WDcWP1Ctd6', 'Admin', 'User', NULL, NULL, 'admin', 4, '2025-05-03 14:35:10', '2025-05-20 12:15:26'),
(2, 'RoyHelwe', 'raedhelwe@hotmail.com', '$2y$10$cNK7bG7ZcKif5gwk9LMwQ.gNr.9QyXjZBbYbrguwjI/WDcWP1Ctd6', 'Roy', 'Helwe', '+96171567290', 'Tripoli', 'staff', 2, '2025-05-03 14:45:36', '2025-05-20 12:15:26'),
(3, 'raedhelwe', 'markazhelwe@gmail.com', '$2y$10$Owt7AJBvv3bCcfwYuforrOv61DNKZmPnrtPbgPlawGg9ntctHo26O', 'raed', 'helwe', '71567290', 'test', 'customer', 1, '2025-05-04 10:27:06', '2025-05-20 12:15:26');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `menu_items_ibfk_1` (`category_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `tables`
--
ALTER TABLE `tables`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `table_number` (`table_number`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `users_ibfk_1` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `tables`
--
ALTER TABLE `tables`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD CONSTRAINT `menu_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`item_id`) ON DELETE CASCADE;

--
-- Constraints for table `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
