-- Minecraft Marketplace Database Schema
-- From 000_consolidated_specification.md - Complete PostgreSQL schema

-- Create ENUMs first (order matters for dependencies)
CREATE TYPE user_role AS ENUM ('user', 'shop_owner', 'admin');
CREATE TYPE item_category AS ENUM ('blocks', 'items', 'tools', 'armor', 'food', 'redstone', 'decorative', 'other');
CREATE TYPE currency_unit AS ENUM ('diamonds', 'diamond_blocks', 'emeralds', 'emerald_blocks', 'iron_ingots', 'iron_blocks');
CREATE TYPE report_type AS ENUM ('price_change', 'out_of_stock', 'back_in_stock', 'shop_closed', 'incorrect_info');
CREATE TYPE report_status AS ENUM ('pending', 'approved', 'rejected', 'auto_approved');
CREATE TYPE evidence_type AS ENUM ('screenshot', 'transaction', 'shop_visit', 'external_link', 'word_of_mouth');
CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE file_access AS ENUM ('public', 'authenticated', 'private');
CREATE TYPE market_activity AS ENUM ('dead', 'low', 'medium', 'high');

-- Users: Clean role-based system with extensible permissions
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Shop information (optional)
  shop_name VARCHAR(100),
  discord_contact VARCHAR(50),
  
  -- Access control
  role user_role NOT NULL DEFAULT 'user',
  permissions TEXT[] DEFAULT '{}', -- Extensible permissions for future features
  is_active BOOLEAN DEFAULT true,
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Items: Clean relational pricing
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category item_category,
  
  -- Inventory
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  is_available BOOLEAN DEFAULT true,
  
  -- Ownership
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Item prices: Proper relational design
CREATE TABLE item_prices (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  
  -- Original user input
  amount DECIMAL(12,4) NOT NULL CHECK (amount > 0),
  currency_unit currency_unit NOT NULL,
  
  -- Normalized for comparisons (calculated on insert/update)
  diamond_equivalent DECIMAL(12,4) NOT NULL,
  
  -- Optional pricing notes
  notes VARCHAR(500),
  
  -- Price validity
  is_current BOOLEAN DEFAULT true,
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- File management: Secure and organized
CREATE TABLE uploaded_files (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE,
  
  -- File details
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0),
  
  -- Storage
  storage_path VARCHAR(500) NOT NULL,
  storage_provider VARCHAR(50) DEFAULT 'local',
  
  -- Access control
  uploaded_by INTEGER REFERENCES users(id),
  access_level file_access DEFAULT 'private',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Community reports: Proper relational design
CREATE TABLE community_reports (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  
  -- Report details
  report_type report_type NOT NULL,
  description TEXT NOT NULL,
  
  -- Reporter information
  reporter_contact VARCHAR(100),
  reporter_ip INET,
  
  -- Workflow
  status report_status DEFAULT 'pending',
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report evidence: Separate normalized table
CREATE TABLE report_evidence (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL REFERENCES community_reports(id) ON DELETE CASCADE,
  
  -- Evidence type and details
  evidence_type evidence_type NOT NULL,
  description TEXT NOT NULL,
  
  -- File or URL reference
  file_id INTEGER REFERENCES uploaded_files(id),
  external_url VARCHAR(1000),
  
  -- Metadata
  confidence_level confidence_level DEFAULT 'medium',
  timestamp_captured TIMESTAMP WITH TIME ZONE,
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report suggested changes: Specific to report type
CREATE TABLE report_price_changes (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL REFERENCES community_reports(id) ON DELETE CASCADE,
  
  -- Current price (what reporter believes is wrong)
  current_amount DECIMAL(12,4),
  current_currency currency_unit,
  
  -- Suggested price (what reporter believes is correct)
  suggested_amount DECIMAL(12,4) NOT NULL,
  suggested_currency currency_unit NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trade history: Track completed transactions for market analytics
CREATE TABLE trade_history (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  
  -- Trade participants (optional for privacy)
  buyer_id INTEGER REFERENCES users(id),
  seller_id INTEGER REFERENCES users(id),
  
  -- Trade details
  qty_traded INTEGER NOT NULL CHECK (qty_traded > 0),
  price_per_unit DECIMAL(12,4) NOT NULL CHECK (price_per_unit > 0),
  currency_unit currency_unit NOT NULL,
  total_value DECIMAL(12,4) NOT NULL CHECK (total_value > 0),
  diamond_equivalent_total DECIMAL(12,4) NOT NULL,
  
  -- Source and metadata
  trade_source VARCHAR(50) DEFAULT 'marketplace',
  notes TEXT,
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Market references: Aggregated market data for performance
CREATE TABLE market_references (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  
  -- Current market prices
  current_sell_low DECIMAL(12,4),
  current_sell_high DECIMAL(12,4),
  current_buy_high DECIMAL(12,4), 
  current_buy_low DECIMAL(12,4),
  
  -- Recent trade data
  last_trade_price DECIMAL(12,4),
  last_trade_date TIMESTAMP WITH TIME ZONE,
  
  -- Market volume and activity
  total_sell_volume INTEGER DEFAULT 0,
  total_buy_interest INTEGER DEFAULT 0,
  market_activity market_activity DEFAULT 'dead',
  
  -- Calculated metrics
  spread_percentage DECIMAL(8,2),
  active_sellers INTEGER DEFAULT 0,
  active_buyers INTEGER DEFAULT 0,
  
  -- Update tracking
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(item_id)
);


-- Performance indexes
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_available ON items(is_available) WHERE is_available = true;
CREATE INDEX idx_items_search ON items USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

CREATE INDEX idx_item_prices_item_id ON item_prices(item_id);
CREATE INDEX idx_item_prices_current ON item_prices(is_current) WHERE is_current = true;
CREATE INDEX idx_item_prices_diamond_equiv ON item_prices(diamond_equivalent);

CREATE INDEX idx_reports_item_id ON community_reports(item_id);
CREATE INDEX idx_reports_status ON community_reports(status);
CREATE INDEX idx_reports_created ON community_reports(created_at);

CREATE INDEX idx_report_evidence_report_id ON report_evidence(report_id);
CREATE INDEX idx_report_price_changes_report_id ON report_price_changes(report_id);

CREATE INDEX idx_files_uuid ON uploaded_files(uuid);
CREATE INDEX idx_files_uploader ON uploaded_files(uploaded_by);

CREATE INDEX idx_trade_history_item_id ON trade_history(item_id);
CREATE INDEX idx_trade_history_created ON trade_history(created_at);
CREATE INDEX idx_trade_history_price ON trade_history(diamond_equivalent_total);

CREATE INDEX idx_market_refs_item_id ON market_references(item_id);
CREATE INDEX idx_market_refs_activity ON market_references(market_activity);
CREATE INDEX idx_market_refs_updated ON market_references(last_updated);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();