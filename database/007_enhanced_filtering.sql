-- Enhanced HATEOAS Filtering - Database Schema Extensions
-- Phase 1A: Add location and verification fields to support enhanced filtering

-- Add location and verification columns to items table
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS biome VARCHAR(20),
ADD COLUMN IF NOT EXISTS direction VARCHAR(10),
ADD COLUMN IF NOT EXISTS warp_command VARCHAR(100),
ADD COLUMN IF NOT EXISTS coordinates_x INTEGER,
ADD COLUMN IF NOT EXISTS coordinates_z INTEGER,
ADD COLUMN IF NOT EXISTS last_verified TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS confidence_level VARCHAR(10) DEFAULT 'medium';

-- Create indexes for enhanced filtering performance
CREATE INDEX IF NOT EXISTS idx_items_biome ON public.items(biome);
CREATE INDEX IF NOT EXISTS idx_items_direction ON public.items(direction);
CREATE INDEX IF NOT EXISTS idx_items_confidence_level ON public.items(confidence_level);
CREATE INDEX IF NOT EXISTS idx_items_last_verified ON public.items(last_verified);

-- Update existing Safe Survival data with sample locations
UPDATE public.items SET 
  biome = CASE 
    WHEN name ILIKE '%jungle%' OR name ILIKE '%wood%' OR name ILIKE '%log%' THEN 'jungle'
    WHEN name ILIKE '%nether%' OR name ILIKE '%obsidian%' OR name ILIKE '%soul%' THEN 'nether'
    WHEN name ILIKE '%end%' OR name ILIKE '%elytra%' THEN 'end'
    WHEN name ILIKE '%ocean%' OR name ILIKE '%water%' THEN 'ocean'
    WHEN name ILIKE '%mountain%' OR name ILIKE '%stone%' THEN 'mountains'
    ELSE 'plains'
  END,
  direction = CASE 
    WHEN EXTRACT(EPOCH FROM created_at)::INTEGER % 4 = 0 THEN 'north'
    WHEN EXTRACT(EPOCH FROM created_at)::INTEGER % 4 = 1 THEN 'south'
    WHEN EXTRACT(EPOCH FROM created_at)::INTEGER % 4 = 2 THEN 'east'
    ELSE 'west'
  END,
  warp_command = '/warp ' || LOWER(REPLACE(REPLACE(name, ' ', ''), '''', '')),
  coordinates_x = (RANDOM() * 2000 - 1000)::INTEGER,
  coordinates_z = (RANDOM() * 2000 - 1000)::INTEGER,
  confidence_level = CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.prices p 
      WHERE p.item_id = public.items.id 
      AND p.is_current = true 
      AND p.price_diamonds > 100
    ) THEN 'high'
    WHEN EXISTS (
      SELECT 1 FROM public.prices p 
      WHERE p.item_id = public.items.id 
      AND p.is_current = true 
      AND p.price_diamonds > 10
    ) THEN 'medium'
    ELSE 'low'
  END
WHERE server_name = 'Safe Survival' AND biome IS NULL;

-- Create HATEOAS link generation function
CREATE OR REPLACE FUNCTION generate_item_links(
  item_id TEXT,
  owner_id TEXT,
  current_user_id TEXT DEFAULT NULL,
  user_role TEXT DEFAULT 'user'
) RETURNS JSONB AS $$
DECLARE
  links JSONB := '{}';
BEGIN
  -- Self link (always available)
  links := jsonb_set(links, '{self}', jsonb_build_object(
    'href', '/api/data/public_items?id=eq.' || item_id
  ));
  
  -- Copy warp link (always available)
  links := jsonb_set(links, '{copyWarp}', jsonb_build_object(
    'href', '/api/v1/warp/copy',
    'method', 'POST',
    'title', 'Copy warp command'
  ));
  
  -- Owner actions (if user owns this item)
  IF current_user_id IS NOT NULL AND current_user_id = owner_id THEN
    links := jsonb_set(links, '{edit}', jsonb_build_object(
      'href', '/api/internal/items/' || item_id,
      'method', 'PUT',
      'title', 'Edit listing',
      'requiresAuth', true
    ));
    
    links := jsonb_set(links, '{updateStock}', jsonb_build_object(
      'href', '/api/internal/items/' || item_id || '/stock',
      'method', 'PATCH',
      'title', 'Update stock',
      'requiresAuth', true
    ));
  END IF;
  
  -- Community actions (if authenticated)
  IF current_user_id IS NOT NULL THEN
    links := jsonb_set(links, '{reportPrice}', jsonb_build_object(
      'href', '/api/v1/reports/price',
      'method', 'POST',
      'title', 'Report price change',
      'requiresAuth', true
    ));
    
    -- Moderator+ actions
    IF user_role IN ('moderator', 'admin') THEN
      links := jsonb_set(links, '{verify}', jsonb_build_object(
        'href', '/api/v1/items/' || item_id || '/verify',
        'method', 'PATCH',
        'title', 'Verify current',
        'requiresAuth', true,
        'permission', 'VERIFY_PRICES'
      ));
    END IF;
  END IF;
  
  RETURN links;
END;
$$ LANGUAGE plpgsql;

-- Create enhanced view with HATEOAS links
CREATE OR REPLACE VIEW public.items_with_links AS
SELECT 
  i.*,
  generate_item_links(i.id::TEXT, i.owner_id::TEXT) as _links
FROM public.items i;

-- Grant access to PostgREST (skip if roles don't exist yet)
-- GRANT SELECT ON public.items_with_links TO web_anon;
-- GRANT SELECT ON public.items_with_links TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN public.items.biome IS 'Minecraft biome location for filtering (jungle, desert, ocean, mountains, plains, nether, end)';
COMMENT ON COLUMN public.items.direction IS 'Directional location for filtering (north, south, east, west, spawn)';
COMMENT ON COLUMN public.items.warp_command IS 'Minecraft warp command for teleportation (/warp shopname)';
COMMENT ON COLUMN public.items.coordinates_x IS 'Minecraft X coordinate';
COMMENT ON COLUMN public.items.coordinates_z IS 'Minecraft Z coordinate';
COMMENT ON COLUMN public.items.last_verified IS 'Timestamp when item was last verified by community';
COMMENT ON COLUMN public.items.verified_by IS 'Username of user who verified this item';
COMMENT ON COLUMN public.items.confidence_level IS 'Community confidence in item data (low, medium, high)';

COMMENT ON FUNCTION generate_item_links IS 'Generates HATEOAS links based on user permissions and item ownership';
COMMENT ON VIEW public.items_with_links IS 'Items with contextual HATEOAS action links for API consumers';