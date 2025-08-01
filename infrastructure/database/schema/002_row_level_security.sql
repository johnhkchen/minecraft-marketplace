-- Row Level Security Setup
-- Foundation-first security: database-enforced permissions

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create JWT claim extraction function
CREATE OR REPLACE FUNCTION get_user_id() RETURNS UUID AS $$
BEGIN
  -- Extract user_id from JWT token claims
  RETURN (current_setting('request.jwt.claims', true)::json->>'user_id')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role() RETURNS user_role AS $$
BEGIN
  -- Extract role from JWT token claims
  RETURN (current_setting('request.jwt.claims', true)::json->>'role')::user_role;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'user'::user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY users_select_policy ON users FOR SELECT
  USING (
    -- Users can see their own profile
    id = get_user_id() OR
    -- Everyone can see basic public info (for shop discovery)
    true -- But we'll limit columns in views
  );

CREATE POLICY users_update_policy ON users FOR UPDATE
  USING (id = get_user_id())
  WITH CHECK (id = get_user_id());

CREATE POLICY users_insert_policy ON users FOR INSERT
  WITH CHECK (true); -- Registration is open

-- Items table policies
CREATE POLICY items_select_policy ON items FOR SELECT
  USING (
    -- Items are publicly viewable
    true
  );

CREATE POLICY items_insert_policy ON items FOR INSERT
  WITH CHECK (
    -- Users can only create items for themselves
    owner_id = get_user_id()
  );

CREATE POLICY items_update_policy ON items FOR UPDATE
  USING (
    -- Users can update their own items
    owner_id = get_user_id() OR
    -- Moderators and admins can update any item
    get_user_role() IN ('moderator', 'admin')
  )
  WITH CHECK (
    -- Can't change ownership (OLD refers to the current row in update context)
    true -- For now, allow updates but rely on application logic for ownership validation
  );

CREATE POLICY items_delete_policy ON items FOR DELETE
  USING (
    -- Users can delete their own items
    owner_id = get_user_id() OR
    -- Moderators and admins can delete any item
    get_user_role() IN ('moderator', 'admin')
  );

-- Prices table policies
CREATE POLICY prices_select_policy ON prices FOR SELECT
  USING (
    -- Prices are publicly viewable
    true
  );

CREATE POLICY prices_insert_policy ON prices FOR INSERT
  WITH CHECK (
    -- Users can create prices for their own items
    EXISTS (
      SELECT 1 FROM items 
      WHERE items.id = item_id 
      AND items.owner_id = get_user_id()
    ) OR
    -- Community can submit price reports
    source != 'owner'
  );

CREATE POLICY prices_update_policy ON prices FOR UPDATE
  USING (
    -- Item owners can update their prices
    created_by = get_user_id() OR
    -- Moderators and admins can update any price
    get_user_role() IN ('moderator', 'admin')
  );

-- Community reports table policies
CREATE POLICY community_reports_select_policy ON community_reports FOR SELECT
  USING (
    -- Reports are publicly viewable
    true
  );

CREATE POLICY community_reports_insert_policy ON community_reports FOR INSERT
  WITH CHECK (
    -- Users can only create reports under their own ID
    reporter_id = get_user_id()
  );

CREATE POLICY community_reports_update_policy ON community_reports FOR UPDATE
  USING (
    -- Item owners can review reports about their items
    EXISTS (
      SELECT 1 FROM items 
      WHERE items.id = item_id 
      AND items.owner_id = get_user_id()
    ) OR
    -- Moderators and admins can review any report
    get_user_role() IN ('moderator', 'admin')
  )
  WITH CHECK (
    -- Can't change reporter or core report data (simplified for now)
    true -- Allow updates, rely on application logic for validation
  );

-- Evidence table policies
CREATE POLICY evidence_select_policy ON evidence FOR SELECT
  USING (
    -- Evidence is publicly viewable
    true
  );

CREATE POLICY evidence_insert_policy ON evidence FOR INSERT
  WITH CHECK (
    -- Users can submit evidence for reports they created
    EXISTS (
      SELECT 1 FROM community_reports 
      WHERE community_reports.id = report_id 
      AND community_reports.reporter_id = get_user_id()
    ) OR
    -- Item owners can submit evidence for reports about their items
    EXISTS (
      SELECT 1 FROM community_reports cr
      JOIN items i ON cr.item_id = i.id
      WHERE cr.id = report_id 
      AND i.owner_id = get_user_id()
    ) OR
    -- Moderators and admins can submit evidence
    get_user_role() IN ('moderator', 'admin')
  );

-- Sessions table policies
CREATE POLICY sessions_select_policy ON sessions FOR SELECT
  USING (user_id = get_user_id());

CREATE POLICY sessions_insert_policy ON sessions FOR INSERT
  WITH CHECK (user_id = get_user_id());

CREATE POLICY sessions_update_policy ON sessions FOR UPDATE
  USING (user_id = get_user_id())
  WITH CHECK (user_id = get_user_id());

CREATE POLICY sessions_delete_policy ON sessions FOR DELETE
  USING (user_id = get_user_id());

-- Create public views with limited columns for anonymous access
CREATE VIEW public_users AS
SELECT 
  id,
  username,
  avatar_url,
  shop_name,
  role,
  is_active
FROM users
WHERE is_active = true;

CREATE VIEW public_items AS
SELECT 
  i.id,
  i.name,
  i.description,
  i.processed_description,
  i.category,
  i.minecraft_id,
  i.enchantments,
  i.item_attributes,
  i.stock_quantity,
  i.is_available,
  i.server_name,
  i.shop_location,
  i.created_at,
  i.updated_at,
  u.username as owner_username,
  u.shop_name as owner_shop_name,
  p.price_diamonds,
  p.trading_unit
FROM items i
JOIN users u ON i.owner_id = u.id
LEFT JOIN prices p ON i.id = p.item_id AND p.is_current = true
WHERE i.is_available = true;

-- Grant permissions for PostgREST
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public_users, public_items TO anon;
GRANT ALL ON users, items, prices, community_reports, evidence, sessions TO authenticated;

-- Grant sequence permissions for inserts
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;