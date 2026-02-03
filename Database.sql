
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
    hashedPassword VARCHAR(255) NOT NULL, -- Stores password
    is_admin BOOLEAN DEFAULT FALSE,       -- 0 = Student, 1 = Admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CORE COMMERCE TABLES

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE active_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_uuid VARCHAR(255) NOT NULL UNIQUE,
    product_id INT NOT NULL,
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
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE active_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_uuid VARCHAR(255) NOT NULL UNIQUE,
    product_id INT NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    location_tag VARCHAR(50),
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

-- Users (Password is '1234' for simplicity in this prototype)
INSERT INTO users (username, first_name, last_name, email, hashedPassword, is_admin) VALUES 
('admin_user', 'System', 'Admin', 'admin@unideals.com', '1234', TRUE),
('student_john', 'John', 'Doe', 'john@uni.edu', '1234', FALSE);

-- Products
INSERT INTO products (name, description, base_price, stock_quantity, image_url) VALUES 
('Varsity Hoodie', 'Premium cotton hoodie', 45.00, 50, 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80'),
('Gym Cap', 'Black cap', 15.00, 20, 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80'),
('Uni Slides', 'Comfort slides', 25.00, 10, 'https://images.unsplash.com/photo-1562183241-b937e95585b6?auto=format&fit=crop&w=600&q=80'),
('Coffee Mug', 'Ceramic mug', 8.50, 100, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=600&q=80');

-- Pricing Rules
INSERT INTO pricing_rules (product_id, decay_rate_percent, decay_interval_minutes, minimum_floor_price) VALUES 
(1, 10.00, 5, 20.00), -- Hoodie
(2, 5.00, 10, 10.00); -- Cap

-- Analytics
INSERT INTO product_associations (rule_antecedent, rule_consequent, confidence_score, lift_score) VALUES
(1, 2, 0.85, 2.10);

SELECT "Database Setup Complete" as Status;