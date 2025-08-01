-- Test Schema for Minecraft Marketplace
-- Minimal schema for testing - matches production structure

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    discord_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    shop_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    owner_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    minecraft_id VARCHAR(255),
    category VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prices table
CREATE TABLE IF NOT EXISTS prices (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES items(id),
    price_diamonds DECIMAL(10,2) NOT NULL,
    trading_unit VARCHAR(50) DEFAULT 'per_item',
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Community reports table
CREATE TABLE IF NOT EXISTS community_reports (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES items(id),
    reporter_id VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    confidence_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Evidence table
CREATE TABLE IF NOT EXISTS evidence (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES community_reports(id),
    evidence_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500),
    verified_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_owner ON items(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_prices_item ON prices(item_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_item ON community_reports(item_id);

-- Grant permissions to test user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_user;