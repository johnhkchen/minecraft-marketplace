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
-- Prices converted from diamond blocks to diamonds (multiply by 9)
INSERT INTO prices (item_id, price_diamonds, trading_unit, created_by) VALUES
  -- Diamond gear - moderate prices (2.5 DB = 22.5 diamonds, etc.)
  ('650e8400-e29b-41d4-a716-446655440001', 22.50, 'per_item', '550e8400-e29b-41d4-a716-446655440001'),
  ('650e8400-e29b-41d4-a716-446655440002', 27.00, 'per_item', '550e8400-e29b-41d4-a716-446655440001'),
  ('650e8400-e29b-41d4-a716-446655440003', 18.00, 'per_item', '550e8400-e29b-41d4-a716-446655440001'),
  
  -- Netherite gear - premium prices (8 DB = 72 diamonds, etc.)
  ('650e8400-e29b-41d4-a716-446655440004', 72.00, 'per_item', '550e8400-e29b-41d4-a716-446655440002'),
  ('650e8400-e29b-41d4-a716-446655440005', 108.00, 'per_item', '550e8400-e29b-41d4-a716-446655440002'),
  
  -- Building blocks - bulk pricing (0.5 DB = 4.5 diamonds per stack, etc.)
  ('650e8400-e29b-41d4-a716-446655440006', 4.50, 'per_stack', '550e8400-e29b-41d4-a716-446655440003'),
  ('650e8400-e29b-41d4-a716-446655440007', 6.75, 'per_stack', '550e8400-e29b-41d4-a716-446655440003'),
  ('650e8400-e29b-41d4-a716-446655440008', 9.00, 'per_stack', '550e8400-e29b-41d4-a716-446655440003'),
  
  -- Special items (converted to diamonds: 5 DB = 45 diamonds, 15 DB = 135 diamonds)
  ('650e8400-e29b-41d4-a716-446655440009', 45.00, 'per_item', '550e8400-e29b-41d4-a716-446655440004'),
  ('650e8400-e29b-41d4-a716-446655440010', 135.00, 'per_item', '550e8400-e29b-41d4-a716-446655440004'),
  
  -- Food items (converted: 1.5 DB = 13.5 diamonds, 0.25 DB = 2.25 diamonds)
  ('650e8400-e29b-41d4-a716-446655440011', 13.50, 'per_item', '550e8400-e29b-41d4-a716-446655440001'),
  ('650e8400-e29b-41d4-a716-446655440012', 2.25, 'per_stack', '550e8400-e29b-41d4-a716-446655440003');

-- Add more diverse marketplace items inspired by legacy data
INSERT INTO items (id, owner_id, name, description, category, minecraft_id, stock_quantity, server_name, shop_location) VALUES
  -- Epic gear
  ('650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 'Elytra', 'Unbreaking III and Mending elytra', 'tools', 'elytra', 1, 'SkyblockRealm', 'central marketplace'),
  ('650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440004', 'Totem of Undying', 'Life-saving totem', 'misc', 'totem_of_undying', 3, 'MagicRealm', 'enchanter tower'),
  
  -- Building materials 
  ('650e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440003', 'Obsidian', 'Strong building blocks', 'blocks', 'obsidian', 49, 'BuildServer', 'materials district'),
  ('650e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440003', 'Gilded Blackstone', 'Decorative nether blocks', 'blocks', 'gilded_blackstone', 102, 'BuildServer', 'nether materials'),
  
  -- Enchanted books
  ('650e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440004', 'Soul Speed III Book', 'Rare nether enchantment', 'misc', 'enchanted_book', 44, 'MagicRealm', 'rare books section'),
  
  -- Food and consumables
  ('650e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440001', 'Golden Apple', 'Healing golden apples', 'food', 'golden_apple', 184, 'SurvivalCraft', 'food court');

-- Add pricing for new items (converting legacy diamond block prices to diamonds)
INSERT INTO prices (item_id, price_diamonds, trading_unit, created_by) VALUES
  -- Epic items (converted from legacy prices)
  ('650e8400-e29b-41d4-a716-446655440013', 207.0, 'per_item', '550e8400-e29b-41d4-a716-446655440002'),  -- 23 DB = 207 diamonds
  ('650e8400-e29b-41d4-a716-446655440014', 90.0, 'per_item', '550e8400-e29b-41d4-a716-446655440004'),   -- 10 DB = 90 diamonds
  
  -- Building materials (bulk pricing)
  ('650e8400-e29b-41d4-a716-446655440015', 4.0, 'per_stack', '550e8400-e29b-41d4-a716-446655440003'),   -- 1 dia per 16 obsidian
  ('650e8400-e29b-41d4-a716-446655440016', 12.8, 'per_stack', '550e8400-e29b-41d4-a716-446655440003'),  -- 1 dia per 5 gilded blackstone
  
  -- Enchanted books
  ('650e8400-e29b-41d4-a716-446655440017', 8.0, 'per_item', '550e8400-e29b-41d4-a716-446655440004'),    -- 8 dia per soul speed book
  
  -- Food items
  ('650e8400-e29b-41d4-a716-446655440018', 0.5, 'per_item', '550e8400-e29b-41d4-a716-446655440001');    -- 1 dia per 2 golden apples

-- Update item attributes with some realistic enchantment data (JSONB)
UPDATE items SET enchantments = '{"sharpness": 1}' WHERE minecraft_id = 'diamond_sword';
UPDATE items SET enchantments = '{"efficiency": 3, "unbreaking": 2}' WHERE minecraft_id = 'diamond_pickaxe';
UPDATE items SET enchantments = '{"protection": 4, "feather_falling": 3}' WHERE minecraft_id = 'diamond_boots';
UPDATE items SET enchantments = '{"protection": 4}' WHERE minecraft_id = 'netherite_helmet';
UPDATE items SET enchantments = '{"sharpness": 5, "mending": 1, "unbreaking": 3}' WHERE minecraft_id = 'netherite_sword';
UPDATE items SET enchantments = '{"mending": 1}' WHERE minecraft_id = 'enchanted_book';