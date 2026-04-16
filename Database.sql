-- UNIDEALS DATABASE SETUP

DROP DATABASE IF EXISTS unideals_db;
CREATE DATABASE unideals_db;
USE unideals_db;

-- 1. USERS & AUTHENTICATION

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashedPassword VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CORE COMMERCE TABLES

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    stock_quantity INT DEFAULT 0,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE active_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_uuid VARCHAR(255) NOT NULL UNIQUE,
    product_id INT NOT NULL,
    is_active BOOLEAN DEFAULT 1,  -- Fixed the typo here
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    location_tag VARCHAR(50),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE pricing_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    decay_rate_percent DECIMAL(5, 2) NOT NULL,
    decay_interval_minutes DECIMAL(10, 2),
    minimum_floor_price DECIMAL(10, 2) NOT NULL,
    flash_duration_minutes INT DEFAULT 5,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    final_price_paid DECIMAL(10, 2) NOT NULL,
    customer_email VARCHAR(255),
    status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);


-- 3. ANALYTICS & LOGS

CREATE TABLE market_baskets (
    basket_id VARCHAR(255) PRIMARY KEY,
    items_json JSON,
    total_value DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_associations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_antecedent INT,
    rule_consequent INT,
    confidence_score DECIMAL(5, 4),
    lift_score DECIMAL(5, 4),
    FOREIGN KEY (rule_antecedent) REFERENCES products(id),
    FOREIGN KEY (rule_consequent) REFERENCES products(id)
);

-- 4. SEED DATA

-- Users
INSERT INTO users (username, first_name, last_name, email, hashedPassword, is_admin) VALUES 
('admin_user', 'System', 'Admin', 'admin@unideals.com', '1234', TRUE),
('student_john', 'John', 'Doe', 'john@uni.edu', '1234', FALSE);

-- Products
INSERT INTO products (name, description, base_price, is_public, stock_quantity, image_url) VALUES 
('Demo Fast-Drop Hoodie', 'Drops rapidly for video demo', 50.00, TRUE, 10, 'https://www.goldsmithssu.org/asset/Product/10014660/Grey-Hoodie.jpg?auto=format&fit=crop&w=600&q=80'),
('Secret Library Coffee', 'Hidden from the radar!', 4.50, FALSE, 50, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=600&q=80'),
('Last-Chance Backpack', 'Only 1 left - Price is frozen!', 40.00, TRUE, 1, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'),
('Flash Deal Gym Pass', 'Short session timer', 15.00, TRUE, 20, 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80'),
('Goldsmiths Water Bottle', 'Stay hydrated in style', 12.00, TRUE, 100, 'https://www.goldsmithssu.org/asset/Product/10014490/sports-bottle-red.jpg?auto=format&fit=crop&w=600&q=80'),
('Goldsmiths Graduation Bear', 'Commemorate your achievement with this exclusive bear', 25.00, TRUE, 50, 'https://www.goldsmithssu.org/asset/Product/10014450/bear-graduation.jpg?auto=format&fit=crop&w=600&q=80');

-- Pricing Rules
INSERT INTO pricing_rules (product_id, decay_rate_percent, decay_interval_minutes, minimum_floor_price, flash_duration_minutes) VALUES 
(1, 20.00, 0.2, 35.00, 60), -- Product 1: Drops 20% every 10 seconds. Hits the £35 floor fast.
(2, 5.00, 5, 1.00, 30),     -- Product 2: Hidden item, standard drop.
(3, 15.00, 2, 15.00, 60),   -- Product 3: Because stock is 1, your backend logic will freeze the decay at £40!
(4, 5.00, 0.01, 4.99, 5),   -- Product 4: The session expires in exactly 5 minutes.
(5, 5.00, 5, 12.00, 120),   -- Product 5: No decay, but the flash lasts for 2 hours.
(6, 10.00, 10, 15.00, 60);  -- Product 6: Drops 10% every 10 minutes, with a 1-hour flash duration.

-- Analytics
INSERT INTO product_associations (rule_antecedent, rule_consequent, confidence_score, lift_score) VALUES
(1, 2, 0.85, 2.10);


SELECT "Database Setup Complete" as Status;