-- Drop the existing table if it exists
DROP TABLE IF EXISTS settings;

-- Create the settings table with the correct structure
CREATE TABLE settings (
  id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (name, value) VALUES
('restaurant_name', 'Savoria Restaurant'),
('address', '123 Main Street, Cityville'),
('phone', '(123) 456-7890'),
('email', 'contact@savoria.com'),
('opening_hours', '{\"monday\":{\"open\":\"11:00\",\"close\":\"22:00\",\"closed\":false},\"tuesday\":{\"open\":\"11:00\",\"close\":\"22:00\",\"closed\":false},\"wednesday\":{\"open\":\"11:00\",\"close\":\"22:00\",\"closed\":false},\"thursday\":{\"open\":\"11:00\",\"close\":\"22:00\",\"closed\":false},\"friday\":{\"open\":\"11:00\",\"close\":\"23:00\",\"closed\":false},\"saturday\":{\"open\":\"10:00\",\"close\":\"23:00\",\"closed\":false},\"sunday\":{\"open\":\"10:00\",\"close\":\"22:00\",\"closed\":false}}'),
('social_media', '{\"facebook\":\"https://facebook.com/savoria\",\"instagram\":\"https://instagram.com/savoria\",\"twitter\":\"https://twitter.com/savoria\"}'),
('reservation_max_days', '30'),
('reservation_min_hours', '2'),
('reservation_time_slot', '30'),
('reservation_duration', '90');
