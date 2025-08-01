-- Seed data for development environment
-- This creates test users, items, and sample data for testing

-- Insert test users with different roles
INSERT INTO users (username, email, password_hash, shop_name, discord_contact, role, permissions) VALUES
  ('admin', 'admin@marketplace.dev', '$2b$10$dummy.hash.for.dev', NULL, 'Admin#1234', 'admin', '{"access_admin","manage_users","view_all_reports","edit_any_items","delete_any_items"}'),
  ('diamond_dave', 'dave@marketplace.dev', '$2b$10$dummy.hash.for.dev', 'Diamond Dave''s Depot', 'DiamondDave#5678', 'shop_owner', '{"create_items","edit_own_items","delete_own_items","review_reports"}'),
  ('emerald_emma', 'emma@marketplace.dev', '$2b$10$dummy.hash.for.dev', 'Emma''s Emerald Exchange', 'EmeraldEmma#9012', 'shop_owner', '{"create_items","edit_own_items","delete_own_items","review_reports"}'),
  ('regular_user', 'user@marketplace.dev', '$2b$10$dummy.hash.for.dev', NULL, 'RegularUser#3456', 'user', '{"submit_reports"}');

-- Insert test items with proper categories
INSERT INTO items (name, description, category, stock_quantity, is_available, user_id) VALUES
  ('Diamond Pickaxe', 'Enchanted with Fortune III and Unbreaking III', 'tools', 3, true, 2),
  ('Netherite Sword', 'Sharp V, Looting III, Unbreaking III', 'tools', 1, true, 2),
  ('Diamond Blocks', 'High-quality diamond blocks for building', 'blocks', 50, true, 2),
  ('Emerald Ore', 'Fresh emerald ore from the mines', 'blocks', 25, true, 3),
  ('Enchanted Golden Apple', 'Rare enchanted golden apples', 'food', 5, true, 3),
  ('Redstone Dust', 'Pure redstone dust for contraptions', 'redstone', 100, true, 3),
  ('Iron Ingots', 'Smelted iron ingots, ready for crafting', 'items', 200, false, 2),
  ('Mending Book', 'Enchanted book with Mending enchantment', 'items', 2, true, 3);

-- Insert pricing for items (using diamond equivalent calculation)
-- Diamond conversion rates: 1 DB = 9 D, 1 EM = 0.5 D, 1 EB = 4.5 D, 1 Iron = 0.1 D, 1 Iron Block = 0.9 D
INSERT INTO item_prices (item_id, amount, currency_unit, diamond_equivalent, notes, is_current) VALUES
  (1, 3.0, 'diamonds', 3.0, 'Standard price for enchanted pickaxe', true),
  (2, 1.5, 'diamond_blocks', 13.5, 'Premium sword with excellent enchants', true),
  (3, 1.0, 'diamond_blocks', 9.0, 'Per diamond block', true),
  (4, 4.0, 'emeralds', 2.0, 'Per emerald ore block', true),
  (5, 2.0, 'diamond_blocks', 18.0, 'Rare item premium pricing', true),
  (6, 50.0, 'iron_ingots', 5.0, 'Bulk redstone dust pricing', true),
  (7, 10.0, 'iron_ingots', 1.0, 'Currently out of stock', true),
  (8, 0.5, 'diamond_blocks', 4.5, 'Rare enchantment book', true);

-- Insert sample community reports
INSERT INTO community_reports (item_id, report_type, description, reporter_contact, reporter_ip, status) VALUES
  (7, 'back_in_stock', 'Saw iron ingots back in stock at Diamond Dave''s shop', 'Reporter#1111', '192.168.1.100', 'pending'),
  (1, 'price_change', 'Price seems to have decreased to 2.5 diamonds', 'Reporter#2222', '192.168.1.101', 'pending');

-- Insert evidence for reports
INSERT INTO report_evidence (report_id, evidence_type, description, confidence_level) VALUES
  (1, 'shop_visit', 'Visited the shop and confirmed iron ingots are available', 'high'),
  (2, 'screenshot', 'Screenshot showing new price of 2.5 diamonds', 'medium');

-- Insert price change suggestions
INSERT INTO report_price_changes (report_id, current_amount, current_currency, suggested_amount, suggested_currency) VALUES
  (2, 3.0, 'diamonds', 2.5, 'diamonds');

-- Confirm seed data was inserted
SELECT 'Seed data inserted successfully:' as message;
SELECT 'Users: ' || COUNT(*) as count FROM users;
SELECT 'Items: ' || COUNT(*) as count FROM items;  
SELECT 'Prices: ' || COUNT(*) as count FROM item_prices;
SELECT 'Reports: ' || COUNT(*) as count FROM community_reports;