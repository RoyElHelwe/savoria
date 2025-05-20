-- Create order_tracking table for tracking order status history
CREATE TABLE IF NOT EXISTS `order_tracking` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `event_type` enum('order_placed','status_update','payment_update','note_added','order_completed') NOT NULL,
  `status` varchar(50) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `order_tracking_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `order_tracking_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add a trigger to automatically add a tracking entry when an order is placed
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS `orders_after_insert` 
AFTER INSERT ON `orders` FOR EACH ROW
BEGIN
    INSERT INTO `order_tracking` (
        `order_id`, 
        `event_type`, 
        `status`, 
        `details`,
        `user_id`,
        `timestamp`
    ) VALUES (
        NEW.`order_id`,
        'order_placed',
        NEW.`status`,
        'Order received by the system',
        NEW.`user_id`,
        NEW.`created_at`
    );
END$$
DELIMITER ;

-- Add a trigger to automatically add a tracking entry when an order status is updated
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS `orders_after_update` 
AFTER UPDATE ON `orders` FOR EACH ROW
BEGIN
    -- Only add a tracking record if the status has changed
    IF NEW.`status` <> OLD.`status` THEN
        INSERT INTO `order_tracking` (
            `order_id`, 
            `event_type`, 
            `status`, 
            `details`,
            `user_id`,
            `timestamp`
        ) VALUES (
            NEW.`order_id`,
            'status_update',
            NEW.`status`,
            CONCAT('Order status updated from "', OLD.`status`, '" to "', NEW.`status`, '"'),
            NULL,
            NEW.`updated_at`
        );
    END IF;
    
    -- If order is completed, add a completed tracking record
    IF NEW.`completed_at` IS NOT NULL AND OLD.`completed_at` IS NULL THEN
        INSERT INTO `order_tracking` (
            `order_id`, 
            `event_type`, 
            `status`, 
            `details`,
            `user_id`,
            `timestamp`
        ) VALUES (
            NEW.`order_id`,
            'order_completed',
            NEW.`status`,
            'Order marked as completed',
            NULL,
            NEW.`completed_at`
        );
    END IF;
END$$
DELIMITER ; 