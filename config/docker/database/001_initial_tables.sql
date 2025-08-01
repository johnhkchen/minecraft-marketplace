-- Initial Database Schema
-- Foundation-first approach: core entities with proper constraints

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create PostgREST roles early
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;

-- Custom types
CREATE TYPE user_role AS ENUM ('user', 'shop_owner', 'moderator', 'admin');
CREATE TYPE item_category AS ENUM ('tools', 'armor', 'blocks', 'food', 'misc');
CREATE TYPE trading_unit_type AS ENUM ('per_item', 'per_stack', 'per_shulker', 'per_dozen');
CREATE TYPE report_type AS ENUM ('price_change', 'stock_status', 'shop_closure', 'incorrect_info');
CREATE TYPE report_status AS ENUM ('pending', 'approved', 'rejected', 'under_review');
CREATE TYPE confidence_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE evidence_type AS ENUM ('screenshot', 'transaction_record', 'description', 'external_link');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  shop_name TEXT,
  role user_role NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Items table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  processed_description TEXT, -- BAML processed
  category item_category NOT NULL,
  minecraft_id TEXT NOT NULL,
  enchantments JSONB, -- BAML extracted enchantment data
  item_attributes JSONB, -- BAML extracted attributes
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_available BOOLEAN NOT NULL DEFAULT true,
  server_name TEXT,
  shop_location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prices table - using diamonds as base currency unit
-- Currency System: Diamonds are the base unit (1 diamond block = 9 diamonds)
-- Price storage: Always in diamonds for precise calculations
-- Display logic: Smart formatting based on amount (diamonds vs diamond blocks)
CREATE TABLE prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  price_diamonds DECIMAL(10,2) NOT NULL CHECK (price_diamonds >= 0),
  trading_unit trading_unit_type NOT NULL DEFAULT 'per_item',
  is_current BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'owner',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Community reports table
CREATE TABLE community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id),
  report_type report_type NOT NULL,
  description TEXT NOT NULL,
  status report_status NOT NULL DEFAULT 'pending',
  confidence_level confidence_level,
  auto_approved BOOLEAN NOT NULL DEFAULT false,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evidence table
CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES community_reports(id) ON DELETE CASCADE,
  evidence_type evidence_type NOT NULL,
  file_path TEXT,
  external_url TEXT,
  description TEXT,
  timestamp_captured TIMESTAMPTZ,
  minecraft_server TEXT,
  coordinates TEXT,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sessions table for authentication
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_users_discord_id ON users(discord_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_shop_name ON users(shop_name) WHERE shop_name IS NOT NULL;

CREATE INDEX idx_items_owner_id ON items(owner_id);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_minecraft_id ON items(minecraft_id);
CREATE INDEX idx_items_available ON items(is_available) WHERE is_available = true;
CREATE INDEX idx_items_server_name ON items(server_name) WHERE server_name IS NOT NULL;
CREATE INDEX idx_items_name_search ON items USING gin(to_tsvector('english', name || ' ' || description));

CREATE INDEX idx_prices_item_id ON prices(item_id);
CREATE INDEX idx_prices_current ON prices(is_current) WHERE is_current = true;
CREATE INDEX idx_prices_created_at ON prices(created_at);

CREATE INDEX idx_community_reports_item_id ON community_reports(item_id);
CREATE INDEX idx_community_reports_reporter_id ON community_reports(reporter_id);
CREATE INDEX idx_community_reports_status ON community_reports(status);
CREATE INDEX idx_community_reports_pending ON community_reports(status) WHERE status = 'pending';

CREATE INDEX idx_evidence_report_id ON evidence(report_id);
CREATE INDEX idx_evidence_type ON evidence(evidence_type);

CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_active ON sessions(expires_at);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();