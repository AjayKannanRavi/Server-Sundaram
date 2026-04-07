-- Tenant Database Schema

-- Restaurant Table (Metadata required in tenant DB for JPA relationships)
CREATE TABLE IF NOT EXISTS restaurant (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    owner_email VARCHAR(255),
    owner_password VARCHAR(255),
    contact_number VARCHAR(255),
    logo_url VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(255),
    plan_type VARCHAR(50) NOT NULL DEFAULT 'STARTER',
    plan_expiry DATETIME,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    tax_percentage DOUBLE DEFAULT 5.0,
    service_charge DOUBLE DEFAULT 0.0
);

-- Staff Table
CREATE TABLE IF NOT EXISTS staff (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    username VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    restaurant_id BIGINT,
    UNIQUE KEY uk_username_restaurant (username, restaurant_id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurant(id)
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    restaurant_id BIGINT,
    FOREIGN KEY (restaurant_id) REFERENCES restaurant(id)
);

-- Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DOUBLE NOT NULL,
    cost_price DOUBLE NOT NULL DEFAULT 0.0,
    stock_quantity INT NOT NULL DEFAULT 0,
    category_id BIGINT,
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    restaurant_id BIGINT,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurant(id)
);

-- Restaurant Tables Table
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    table_number INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    qr_generated BOOLEAN DEFAULT FALSE,
    qr_code_url VARCHAR(500),
    current_session_id VARCHAR(255),
    restaurant_id BIGINT,
    FOREIGN KEY (restaurant_id) REFERENCES restaurant(id)
);


-- Restaurant Orders Table
CREATE TABLE IF NOT EXISTS restaurant_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT,
    table_id BIGINT,
    session_id VARCHAR(255),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    status VARCHAR(50) NOT NULL,
    total_amount DOUBLE NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'UNPAID',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    rejection_reason TEXT,
    payment_method VARCHAR(50),
    created_at DATETIME,
    order_time DATETIME,
    restaurant_id BIGINT,
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurant(id)
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT,
    menu_item_id BIGINT,
    quantity INT NOT NULL,
    price DOUBLE NOT NULL,
    restaurant_id BIGINT,
    FOREIGN KEY (order_id) REFERENCES restaurant_orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurant(id)
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT,
    session_id VARCHAR(255),
    subtotal DOUBLE,
    tax_amount DOUBLE,
    service_charge DOUBLE,
    total_amount DOUBLE NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50),
    payment_date DATETIME,
    restaurant_id BIGINT,
    FOREIGN KEY (order_id) REFERENCES restaurant_orders(id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurant(id)
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255),
    table_id BIGINT,
    overall_rating INT,
    item_ratings_json TEXT,
    restaurant_id BIGINT,
    comment TEXT,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(255),
    created_at DATETIME,
    FOREIGN KEY (restaurant_id) REFERENCES restaurant(id)
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    mobile_number VARCHAR(20) NOT NULL,
    visit_count INT DEFAULT 0,
    last_visited_date DATETIME,
    last_table_used VARCHAR(255),
    current_otp VARCHAR(20),
    otp_generated_at DATETIME,
    created_at DATETIME,
    restaurant_id BIGINT,
    UNIQUE KEY uk_mobile_restaurant (mobile_number, restaurant_id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurant(id)
);

-- Raw Materials Table
CREATE TABLE IF NOT EXISTS raw_materials (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity DOUBLE NOT NULL,
    unit VARCHAR(50),
    min_threshold DOUBLE,
    restaurant_id BIGINT,
    FOREIGN KEY (restaurant_id) REFERENCES restaurant(id)
);

-- Daily Usage Logs Table
CREATE TABLE IF NOT EXISTS daily_usage_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    material_name VARCHAR(255) NOT NULL,
    used_quantity DOUBLE NOT NULL,
    remaining_quantity DOUBLE NOT NULL,
    unit VARCHAR(50),
    date DATETIME NOT NULL,
    restaurant_id BIGINT,
    FOREIGN KEY (restaurant_id) REFERENCES restaurant(id)
);

