-- Test Data for Item Listing Feature
-- Realistic Minecraft marketplace data for development and testing

-- Insert test users
INSERT INTO users (id, discord_id, username, email, shop_name, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '123456789012345678', 'DiamondMiner92', 'diamond@example.com', 'Diamond Deluxe Shop', 'shop_owner'),
  ('550e8400-e29b-41d4-a716-446655440002', '234567890123456789', 'NetheriteNinja', 'netherite@example.com', 'Netherite Emporium', 'shop_owner'),
  ('550e8400-e29b-41d4-a716-446655440003', '345678901234567890', 'RedstoneRook', 'redstone@example.com', 'Redstone Robotics', 'shop_owner'),
  ('550e8400-e29b-41d4-a716-446655440004', '456789012345678901', 'EnchantedElf', 'enchanted@example.com', 'Enchanted Emporium', 'shop_owner'),
  ('550e8400-e29b-41d4-a716-446655440005', '567890123456789012', 'BuilderBob', 'builder@example.com', NULL, 'user');

-- Insert test items with various categories and prices
INSERT INTO items (id, owner_id, name, description, category, minecraft_id, stock_quantity, server_name, shop_location) VALUES
  -- Diamond tools and weapons
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Diamond Sword', 'Sharp diamond sword, lightly used', 'tools', 'diamond_sword', 5, 'SurvivalCraft', 'spawn market, stall 12'),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Diamond Pickaxe', 'Efficiency III, Unbreaking II diamond pickaxe', 'tools', 'diamond_pickaxe', 3, 'SurvivalCraft', 'spawn market, stall 12'),
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Diamond Boots', 'Protection IV diamond boots with Feather Falling III', 'armor', 'diamond_boots', 2, 'SurvivalCraft', 'spawn market, stall 12'),
  
  -- Netherite gear
  ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Netherite Helmet', 'Brand new netherite helmet with Protection IV', 'armor', 'netherite_helmet', 1, 'HardcoreWorld', 'nether hub, shop 5'),
  ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Netherite Sword', 'Sharpness V, Mending, Unbreaking III netherite sword', 'tools', 'netherite_sword', 1, 'HardcoreWorld', 'nether hub, shop 5'),
  
  -- Building blocks
  ('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'Oak Wood', 'Fresh oak wood logs, perfect for building', 'blocks', 'oak_log', 2000, 'BuildServer', 'wood district, lot 7'),
  ('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'Stone Bricks', 'Smooth stone bricks, great for castles', 'blocks', 'stone_bricks', 5000, 'BuildServer', 'wood district, lot 7'),
  ('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'Glass', 'Clear glass blocks for windows', 'blocks', 'glass', 1000, 'BuildServer', 'wood district, lot 7'),
  
  -- Enchanted books and misc
  ('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', 'Mending Book', 'Enchanted book with Mending enchantment', 'misc', 'enchanted_book', 3, 'MagicRealm', 'enchanter tower, floor 3'),
  ('650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', 'Shulker Box', 'Purple shulker box for extra storage', 'misc', 'shulker_box', 10, 'MagicRealm', 'enchanter tower, floor 3'),
  
  -- Food items
  ('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'Golden Apples', 'Enchanted golden apples for healing', 'food', 'enchanted_golden_apple', 20, 'SurvivalCraft', 'spawn market, stall 12'),
  ('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440003', 'Cooked Beef', 'Fresh cooked beef, perfect for adventures', 'food', 'cooked_beef', 500, 'BuildServer', 'food court, stand 2');

-- Insert pricing data with various trading units
INSERT INTO prices (item_id, price_diamond_blocks, trading_unit, created_by) VALUES
  -- Diamond gear - moderate prices
  ('650e8400-e29b-41d4-a716-446655440001', 2.50, 'per_item', '550e8400-e29b-41d4-a716-446655440001'),
  ('650e8400-e29b-41d4-a716-446655440002', 3.00, 'per_item', '550e8400-e29b-41d4-a716-446655440001'),
  ('650e8400-e29b-41d4-a716-446655440003', 2.00, 'per_item', '550e8400-e29b-41d4-a716-446655440001'),
  
  -- Netherite gear - premium prices
  ('650e8400-e29b-41d4-a716-446655440004', 8.00, 'per_item', '550e8400-e29b-41d4-a716-446655440002'),
  ('650e8400-e29b-41d4-a716-446655440005', 12.00, 'per_item', '550e8400-e29b-41d4-a716-446655440002'),
  
  -- Building blocks - bulk pricing
  ('650e8400-e29b-41d4-a716-446655440006', 0.50, 'per_stack', '550e8400-e29b-41d4-a716-446655440003'),
  ('650e8400-e29b-41d4-a716-446655440007', 0.75, 'per_stack', '550e8400-e29b-41d4-a716-446655440003'),
  ('650e8400-e29b-41d4-a716-446655440008', 1.00, 'per_stack', '550e8400-e29b-41d4-a716-446655440003'),
  
  -- Special items
  ('650e8400-e29b-41d4-a716-446655440009', 5.00, 'per_item', '550e8400-e29b-41d4-a716-446655440004'),
  ('650e8400-e29b-41d4-a716-446655440010', 15.00, 'per_item', '550e8400-e29b-41d4-a716-446655440004'),
  
  -- Food items
  ('650e8400-e29b-41d4-a716-446655440011', 1.50, 'per_item', '550e8400-e29b-41d4-a716-446655440001'),
  ('650e8400-e29b-41d4-a716-446655440012', 0.25, 'per_stack', '550e8400-e29b-41d4-a716-446655440003');

-- Update item attributes with some realistic enchantment data (JSONB)
UPDATE items SET enchantments = '{"sharpness": 1}' WHERE minecraft_id = 'diamond_sword';
UPDATE items SET enchantments = '{"efficiency": 3, "unbreaking": 2}' WHERE minecraft_id = 'diamond_pickaxe';
UPDATE items SET enchantments = '{"protection": 4, "feather_falling": 3}' WHERE minecraft_id = 'diamond_boots';
UPDATE items SET enchantments = '{"protection": 4}' WHERE minecraft_id = 'netherite_helmet';
UPDATE items SET enchantments = '{"sharpness": 5, "mending": 1, "unbreaking": 3}' WHERE minecraft_id = 'netherite_sword';
UPDATE items SET enchantments = '{"mending": 1}' WHERE minecraft_id = 'enchanted_book';