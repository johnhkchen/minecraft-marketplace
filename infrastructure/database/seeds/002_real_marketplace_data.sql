-- Real Marketplace Data
-- Based on actual Minecraft server marketplace transactions
-- Replaces synthetic test data with real community data

-- Clear existing test data
DELETE FROM prices;
DELETE FROM items;
DELETE FROM users;

-- Insert real users (mapped from sellers)
INSERT INTO users (id, discord_id, username, email, shop_name, role, created_at) VALUES
-- Active sellers
('550e8400-e29b-41d4-a716-446655440001', '123456789012345001', 'seller1', 'seller1@example.com', 'General Trading Post', 'shop_owner', '2025-07-27 12:00:00'),
('550e8400-e29b-41d4-a716-446655440002', '123456789012345002', 'seller2', 'seller2@example.com', 'Elytra Emporium', 'shop_owner', '2025-07-27 12:00:00'),
('550e8400-e29b-41d4-a716-446655440003', '123456789012345003', 'seller3', 'seller3@example.com', 'Ultimate Gear Shop', 'shop_owner', '2025-07-27 12:00:00'),
('550e8400-e29b-41d4-a716-446655440004', '123456789012345004', 'nethy', 'nethy@example.com', 'Nether Materials Co', 'shop_owner', '2025-07-27 12:00:00'),
('550e8400-e29b-41d4-a716-446655440005', '123456789012345005', 'Hikoo', 'hikoo@example.com', 'Premium Tools & Weapons', 'shop_owner', '2025-07-27 12:00:00'),
('550e8400-e29b-41d4-a716-446655440006', '123456789012345006', '_Pythos692016', 'pythos@example.com', 'Wood & Amethyst Trader', 'shop_owner', '2025-07-27 12:00:00'),
('550e8400-e29b-41d4-a716-446655440007', '123456789012345007', '_kwix_', 'kwix@example.com', 'Wool Warehouse', 'shop_owner', '2025-07-27 12:00:00'),

-- Active buyers
('550e8400-e29b-41d4-a716-446655440008', '123456789012345008', 'xWudn3r', 'xwudn3r@example.com', NULL, 'user', '2025-07-28 14:42:00'),
('550e8400-e29b-41d4-a716-446655440009', '123456789012345009', 'Jerseymaid', 'jerseymaid@example.com', NULL, 'user', '2025-07-28 14:42:00'),
('550e8400-e29b-41d4-a716-446655440010', '123456789012345010', 'Lupus', 'lupus@example.com', NULL, 'user', '2025-07-28 14:42:00'),
('550e8400-e29b-41d4-a716-446655440011', '123456789012345011', 'Tanthalas', 'tanthalas@example.com', 'Auto Buyer Network', 'shop_owner', '2025-07-28 14:42:00'),
('550e8400-e29b-41d4-a716-446655440012', '123456789012345012', 'tchunko', 'tchunko@example.com', NULL, 'user', '2025-07-28 14:42:00');

-- Insert real items with proper categories
INSERT INTO items (id, owner_id, name, description, category, minecraft_id, stock_quantity, server_name, shop_location, created_at) VALUES
-- Blocks & Materials
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Iron Blocks', 'Iron blocks - 6IB per diamond, 32 DB total. Happy to split or sell whole lot.', 'blocks', 'iron_block', 27, 'Safe Survival', 'spawn market, stall 1', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'Gilded Blackstone', 'Gilded Blackstone - 1 dia per 5', 'blocks', 'gilded_blackstone', 102, 'Safe Survival', 'nether trading post', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'Obsidian', 'Obsidian - 1 dia per 16', 'blocks', 'obsidian', 49, 'Safe Survival', 'nether trading post', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'Crying Obsidian', 'Crying Obsidian - 1 dia per 16 (SOLD OUT)', 'blocks', 'crying_obsidian', 0, 'Safe Survival', 'nether trading post', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440007', 'Wool', 'Wool - 3 stacks per diamond, 1 color per Shulker Box', 'blocks', 'wool', 100, 'Safe Survival', 'east of desert warp', '2025-07-27 12:00:00'),

-- Transportation (Elytra)
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Normal Elytra', 'Normal elytra', 'misc', 'elytra', 1, 'Safe Survival', 'end city shop', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 'Enchanted Elytra', 'Elytra with Unbreaking III and Mending', 'misc', 'elytra', 1, 'Safe Survival', 'end city shop', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'Regular Elytra', 'Regular Elytra', 'misc', 'elytra', 1, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440003', 'Enchanted Cape', 'Unbreakable Elytra, +2 Armor Toughness, +2 Armor', 'misc', 'elytra', 3, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', 'Mythical Cape', 'Unbreakable Elytra, +3 Armor, +2 Armor Toughness, +1 Max Absorption', 'misc', 'elytra', 1, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),

-- Weapons
('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440003', 'Epic Blade', 'Unbreakable Diamond Sword, Sharpness V, Looting III, +1 Armor', 'tools', 'diamond_sword', 2, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440003', 'Unbreakable Netherite Sword', 'Unbreakable Netherite Sword', 'tools', 'netherite_sword', 2, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440005', 'Unbreakable Diamond Sword', 'Unbreakable Sword (SOLD)', 'tools', 'diamond_sword', 0, 'Safe Survival', 'premium tools shop', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440005', 'Epic Blade Diamond Sword', 'Epic Blade - Sharpness V, Looting III, +2 Armor', 'tools', 'diamond_sword', 5, 'Safe Survival', 'premium tools shop', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440003', 'Unbreakable Bow', 'Unbreakable Bow', 'tools', 'bow', 5, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440003', 'Unbreakable Crossbow', 'Unbreakable Crossbow', 'tools', 'crossbow', 3, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),

-- Tools 
('650e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440003', 'Unbreakable Diamond Pickaxe', 'Unbreakable Diamond Pickaxe', 'tools', 'diamond_pickaxe', 8, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440003', 'Unbreakable Netherite Pickaxe', 'Unbreakable Netherite Pickaxe', 'tools', 'netherite_pickaxe', 1, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440005', 'Unbreakable Diamond Pickaxe Hikoo', 'Unbreakable Pickaxe', 'tools', 'diamond_pickaxe', 10, 'Safe Survival', 'premium tools shop', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440003', 'Unbreakable Diamond Shovel', 'Unbreakable Diamond Shovel', 'tools', 'diamond_shovel', 6, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440003', 'Unbreakable Netherite Shovel', 'Unbreakable Netherite Shovel', 'tools', 'netherite_shovel', 2, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440003', 'Unbreakable Diamond Hoe', 'Unbreakable Diamond Hoe', 'tools', 'diamond_hoe', 3, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440003', 'Unbreakable Netherite Hoe', 'Unbreakable Netherite Hoe', 'tools', 'netherite_hoe', 1, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440005', 'Unbreakable Diamond Axe', 'Unbreakable Axe (SOLD)', 'tools', 'diamond_axe', 0, 'Safe Survival', 'premium tools shop', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440005', 'Unbreakable Fishing Rod', 'Unbreakable Fishing Rod (SOLD)', 'tools', 'fishing_rod', 0, 'Safe Survival', 'premium tools shop', '2025-07-27 12:00:00'),

-- Armor
('650e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440003', 'Champions Full Helm', 'Netherite Helmet, Unbreaking III, Protection IV', 'armor', 'netherite_helmet', 4, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440003', 'Mythical Full Helm', 'Netherite Helmet, Protection IV, Mending', 'armor', 'netherite_helmet', 3, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440003', 'Explorers Boots', 'Dyed Leather Boots, Feather Falling IV, Unbreaking VII, Knockback Resistance +1', 'armor', 'leather_boots', 5, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),

-- Food & Consumables
('650e8400-e29b-41d4-a716-446655440029', '550e8400-e29b-41d4-a716-446655440004', 'Golden Apple', 'Golden Apple - 1 dia per 2', 'food', 'golden_apple', 184, 'Safe Survival', 'nether trading post', '2025-07-27 12:00:00'),

-- Miscellaneous & Special Items
('650e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440003', 'Sorcerers Stone', '+2 Armor Toughness, +6 Max Health, +2 Max Absorption, +0.02 Max Speed', 'misc', 'sorcerer_stone', 2, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440003', 'Totem of Undying', 'Totem of Undying', 'misc', 'totem_of_undying', 3, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440003', 'Skeleton Horse Spawn Egg', 'Skeleton Horse Spawn Egg', 'misc', 'skeleton_horse_spawn_egg', 3, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440003', 'Zombie Horse Spawn Egg', 'Zombie Horse Spawn Egg', 'misc', 'zombie_horse_spawn_egg', 6, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440003', 'Bee Spawn Egg', 'Bee Spawn Egg', 'misc', 'bee_spawn_egg', 4, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),

-- Materials & Crafting
('650e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440006', 'Amethyst Shards', 'Amethyst going rate 6DB per shulker, selling for 4DB plus 32 phantom membranes bonus', 'misc', 'amethyst_shard', 27, 'Safe Survival', 'amethyst caves trading', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440004', 'Netherite Upgrade Template', 'Netherite upgrade Template - 6 dia per unit', 'misc', 'netherite_upgrade_smithing_template', 167, 'Safe Survival', 'nether trading post', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440037', '550e8400-e29b-41d4-a716-446655440004', 'Snout Armor Trim', 'Snout Armor Trim - 6 dia per unit', 'misc', 'snout_armor_trim_smithing_template', 123, 'Safe Survival', 'nether trading post', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440038', '550e8400-e29b-41d4-a716-446655440004', 'Rib Armor Trim', 'Rib Armor Trim - 6 dia per unit', 'misc', 'rib_armor_trim_smithing_template', 54, 'Safe Survival', 'nether trading post', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440039', '550e8400-e29b-41d4-a716-446655440004', 'Chains', 'Chains - 1 dia per 32 (SOLD OUT)', 'misc', 'chain', 0, 'Safe Survival', 'nether trading post', '2025-07-27 12:00:00'),

-- Enchanted Books
('650e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440003', 'Mythical Tome', 'Enchanted Book: Protection IV, Thorns III, Sharpness V, Efficiency V, Power V, Multishot, Frost Walker II', 'misc', 'enchanted_book', 6, 'Safe Survival', 'gear shop district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440004', 'Soul Speed III Book', 'Soul Speed III Book - 8 dia per unit', 'misc', 'enchanted_book', 44, 'Safe Survival', 'nether trading post', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440004', 'Soul Speed II Book', 'Soul Speed II Book - 4 dia per unit', 'misc', 'enchanted_book', 42, 'Safe Survival', 'nether trading post', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440004', 'Soul Speed I Book', 'Soul Speed I Book - 2 dia per unit', 'misc', 'enchanted_book', 48, 'Safe Survival', 'nether trading post', '2025-07-27 12:00:00'),

-- Wood & Logs (for bulk buyers)
('650e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440006', 'Dark Oak Logs', 'Dark oak wood logs - msg me in game _Pythos692016', 'blocks', 'dark_oak_log', 2, 'Safe Survival', 'wood district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440045', '550e8400-e29b-41d4-a716-446655440006', 'Pale Oak Logs', 'Pale oak wood logs - msg me in game _Pythos692016', 'blocks', 'pale_oak_log', 1, 'Safe Survival', 'wood district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440046', '550e8400-e29b-41d4-a716-446655440006', 'Oak Logs', 'Oak wood logs - msg me in game _Pythos692016', 'blocks', 'oak_log', 1, 'Safe Survival', 'wood district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440047', '550e8400-e29b-41d4-a716-446655440006', 'Cherry Logs', 'Cherry wood logs - msg me in game _Pythos692016', 'blocks', 'cherry_log', 1, 'Safe Survival', 'wood district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440048', '550e8400-e29b-41d4-a716-446655440006', 'Spruce Logs', 'Spruce wood logs - msg me in game _Pythos692016', 'blocks', 'spruce_log', 1, 'Safe Survival', 'wood district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440049', '550e8400-e29b-41d4-a716-446655440006', 'Birch Logs', 'Birch wood logs - msg me in game _Pythos692016', 'blocks', 'birch_log', 1, 'Safe Survival', 'wood district', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440006', 'Acacia Logs', 'Acacia wood logs - msg me in game _Pythos692016', 'blocks', 'acacia_log', 1, 'Safe Survival', 'wood district', '2025-07-27 12:00:00'),

-- Special Items & Collectibles  
('650e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440005', 'Epic Hat Pack Shulker', 'Epic Hat Pack Shulker - Shiny Blocks + 3 Heads: Wither Skeleton Plushie, Bag of Coins and Fox Cupcake', 'misc', 'shulker_box', 1, 'Safe Survival', 'premium tools shop', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440004', 'Pigstep Music Disk', 'Pigstep Music Disk - make an offer', 'misc', 'music_disc_pigstep', 73, 'Safe Survival', 'nether trading post', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440004', 'Snout Banner Pattern', 'Snout Banner Pattern - make an offer', 'misc', 'snout_banner_pattern', 113, 'Safe Survival', 'nether trading post', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440054', '550e8400-e29b-41d4-a716-446655440004', 'Diamond Horse Armor', 'Diamond Horse Armor - make an offer', 'misc', 'diamond_horse_armor', 125, 'Safe Survival', 'nether trading post', '2025-07-27 12:00:00'),
('650e8400-e29b-41d4-a716-446655440055', '550e8400-e29b-41d4-a716-446655440004', 'Saddle', 'Saddle - make an offer', 'misc', 'saddle', 365, 'Safe Survival', 'nether trading post', '2025-07-27 12:00:00');

-- Insert pricing data (converting original prices to our diamond-based system)
INSERT INTO prices (item_id, price_diamonds, trading_unit, created_by, created_at) VALUES
-- Blocks & Materials
('650e8400-e29b-41d4-a716-446655440001', 288.00, 'per_shulker', '550e8400-e29b-41d4-a716-446655440001', '2025-07-27 12:00:00'), -- 32 DB * 9 = 288 diamonds
('650e8400-e29b-41d4-a716-446655440002', 0.20, 'per_stack', '550e8400-e29b-41d4-a716-446655440004', '2025-07-27 12:00:00'), -- 1 dia per 5 items
('650e8400-e29b-41d4-a716-446655440003', 0.0625, 'per_stack', '550e8400-e29b-41d4-a716-446655440004', '2025-07-27 12:00:00'), -- 1 dia per 16 items
('650e8400-e29b-41d4-a716-446655440004', 0.0625, 'per_stack', '550e8400-e29b-41d4-a716-446655440004', '2025-07-27 12:00:00'), -- 1 dia per 16 items (SOLD OUT)
('650e8400-e29b-41d4-a716-446655440005', 9.00, 'per_shulker', '550e8400-e29b-41d4-a716-446655440007', '2025-07-27 12:00:00'), -- 1 DB * 9 = 9 diamonds

-- Transportation (Elytra)  
('650e8400-e29b-41d4-a716-446655440006', 162.00, 'per_item', '550e8400-e29b-41d4-a716-446655440002', '2025-07-27 12:00:00'), -- 18 DB * 9 = 162 diamonds
('650e8400-e29b-41d4-a716-446655440007', 207.00, 'per_item', '550e8400-e29b-41d4-a716-446655440002', '2025-07-27 12:00:00'), -- 23 DB * 9 = 207 diamonds
('650e8400-e29b-41d4-a716-446655440008', 252.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 28 DB * 9 = 252 diamonds
('650e8400-e29b-41d4-a716-446655440009', 270.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 30 DB * 9 = 270 diamonds
('650e8400-e29b-41d4-a716-446655440010', 576.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 64 DB * 9 = 576 diamonds

-- Weapons
('650e8400-e29b-41d4-a716-446655440011', 270.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 30 DB * 9 = 270 diamonds
('650e8400-e29b-41d4-a716-446655440012', 126.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 14 DB * 9 = 126 diamonds
('650e8400-e29b-41d4-a716-446655440013', 126.00, 'per_item', '550e8400-e29b-41d4-a716-446655440005', '2025-07-27 12:00:00'), -- 14 DB * 9 = 126 diamonds (SOLD)
('650e8400-e29b-41d4-a716-446655440014', 270.00, 'per_item', '550e8400-e29b-41d4-a716-446655440005', '2025-07-27 12:00:00'), -- 30 DB * 9 = 270 diamonds
('650e8400-e29b-41d4-a716-446655440015', 108.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 12 DB * 9 = 108 diamonds
('650e8400-e29b-41d4-a716-446655440016', 90.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 10 DB * 9 = 90 diamonds

-- Tools
('650e8400-e29b-41d4-a716-446655440017', 144.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 16 DB * 9 = 144 diamonds
('650e8400-e29b-41d4-a716-446655440018', 153.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 17 DB * 9 = 153 diamonds
('650e8400-e29b-41d4-a716-446655440019', 153.00, 'per_item', '550e8400-e29b-41d4-a716-446655440005', '2025-07-27 12:00:00'), -- 17 DB * 9 = 153 diamonds
('650e8400-e29b-41d4-a716-446655440020', 108.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 12 DB * 9 = 108 diamonds
('650e8400-e29b-41d4-a716-446655440021', 117.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 13 DB * 9 = 117 diamonds
('650e8400-e29b-41d4-a716-446655440022', 72.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 8 DB * 9 = 72 diamonds
('650e8400-e29b-41d4-a716-446655440023', 81.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 9 DB * 9 = 81 diamonds
('650e8400-e29b-41d4-a716-446655440024', 144.00, 'per_item', '550e8400-e29b-41d4-a716-446655440005', '2025-07-27 12:00:00'), -- 16 DB * 9 = 144 diamonds (SOLD)
('650e8400-e29b-41d4-a716-446655440025', 45.00, 'per_item', '550e8400-e29b-41d4-a716-446655440005', '2025-07-27 12:00:00'), -- 5 DB * 9 = 45 diamonds (SOLD)

-- Armor
('650e8400-e29b-41d4-a716-446655440026', 54.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 6 DB * 9 = 54 diamonds
('650e8400-e29b-41d4-a716-446655440027', 81.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 9 DB * 9 = 81 diamonds
('650e8400-e29b-41d4-a716-446655440028', 54.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 6 DB * 9 = 54 diamonds

-- Food & Consumables
('650e8400-e29b-41d4-a716-446655440029', 0.50, 'per_item', '550e8400-e29b-41d4-a716-446655440004', '2025-07-27 12:00:00'), -- 1 dia per 2 items

-- Miscellaneous & Special Items
('650e8400-e29b-41d4-a716-446655440030', 234.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 26 DB * 9 = 234 diamonds
('650e8400-e29b-41d4-a716-446655440031', 90.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 10 DB * 9 = 90 diamonds
('650e8400-e29b-41d4-a716-446655440032', 90.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 10 DB * 9 = 90 diamonds
('650e8400-e29b-41d4-a716-446655440033', 90.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 10 DB * 9 = 90 diamonds
('650e8400-e29b-41d4-a716-446655440034', 5.625, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 0.625 DB * 9 = 5.625 diamonds

-- Materials & Crafting
('650e8400-e29b-41d4-a716-446655440035', 36.00, 'per_shulker', '550e8400-e29b-41d4-a716-446655440006', '2025-07-27 12:00:00'), -- 4 DB * 9 = 36 diamonds
('650e8400-e29b-41d4-a716-446655440036', 6.00, 'per_item', '550e8400-e29b-41d4-a716-446655440004', '2025-07-27 12:00:00'), -- 6 dia per unit
('650e8400-e29b-41d4-a716-446655440037', 6.00, 'per_item', '550e8400-e29b-41d4-a716-446655440004', '2025-07-27 12:00:00'), -- 6 dia per unit
('650e8400-e29b-41d4-a716-446655440038', 6.00, 'per_item', '550e8400-e29b-41d4-a716-446655440004', '2025-07-27 12:00:00'), -- 6 dia per unit
('650e8400-e29b-41d4-a716-446655440039', 0.03125, 'per_stack', '550e8400-e29b-41d4-a716-446655440004', '2025-07-27 12:00:00'), -- 1 dia per 32 items (SOLD OUT)

-- Enchanted Books
('650e8400-e29b-41d4-a716-446655440040', 18.00, 'per_item', '550e8400-e29b-41d4-a716-446655440003', '2025-07-27 12:00:00'), -- 2 DB * 9 = 18 diamonds
('650e8400-e29b-41d4-a716-446655440041', 8.00, 'per_item', '550e8400-e29b-41d4-a716-446655440004', '2025-07-27 12:00:00'), -- 8 dia per unit
('650e8400-e29b-41d4-a716-446655440042', 4.00, 'per_item', '550e8400-e29b-41d4-a716-446655440004', '2025-07-27 12:00:00'), -- 4 dia per unit
('650e8400-e29b-41d4-a716-446655440043', 2.00, 'per_item', '550e8400-e29b-41d4-a716-446655440004', '2025-07-27 12:00:00'), -- 2 dia per unit

-- Wood & Logs
('650e8400-e29b-41d4-a716-446655440044', 18.00, 'per_shulker', '550e8400-e29b-41d4-a716-446655440006', '2025-07-27 12:00:00'), -- 2 DB * 9 = 18 diamonds
('650e8400-e29b-41d4-a716-446655440045', 18.00, 'per_shulker', '550e8400-e29b-41d4-a716-446655440006', '2025-07-27 12:00:00'), -- 2 DB * 9 = 18 diamonds
('650e8400-e29b-41d4-a716-446655440046', 18.00, 'per_shulker', '550e8400-e29b-41d4-a716-446655440006', '2025-07-27 12:00:00'), -- 2 DB * 9 = 18 diamonds
('650e8400-e29b-41d4-a716-446655440047', 18.00, 'per_shulker', '550e8400-e29b-41d4-a716-446655440006', '2025-07-27 12:00:00'), -- 2 DB * 9 = 18 diamonds
('650e8400-e29b-41d4-a716-446655440048', 18.00, 'per_shulker', '550e8400-e29b-41d4-a716-446655440006', '2025-07-27 12:00:00'), -- 2 DB * 9 = 18 diamonds
('650e8400-e29b-41d4-a716-446655440049', 18.00, 'per_shulker', '550e8400-e29b-41d4-a716-446655440006', '2025-07-27 12:00:00'), -- 2 DB * 9 = 18 diamonds
('650e8400-e29b-41d4-a716-446655440050', 18.00, 'per_shulker', '550e8400-e29b-41d4-a716-446655440006', '2025-07-27 12:00:00'), -- 2 DB * 9 = 18 diamonds

-- Special Items & Collectibles (make offer items = 0)
('650e8400-e29b-41d4-a716-446655440051', 0.00, 'per_item', '550e8400-e29b-41d4-a716-446655440005', '2025-07-27 12:00:00'), -- Make offer
('650e8400-e29b-41d4-a716-446655440052', 0.00, 'per_item', '550e8400-e29b-41d4-a716-446655440004', '2025-07-27 12:00:00'), -- Make offer
('650e8400-e29b-41d4-a716-446655440053', 0.00, 'per_item', '550e8400-e29b-41d4-a716-446655440004', '2025-07-27 12:00:00'), -- Make offer
('650e8400-e29b-41d4-a716-446655440054', 0.00, 'per_item', '550e8400-e29b-41d4-a716-446655440004', '2025-07-27 12:00:00'), -- Make offer
('650e8400-e29b-41d4-a716-446655440055', 0.00, 'per_item', '550e8400-e29b-41d4-a716-446655440004', '2025-07-27 12:00:00'); -- Make offer

-- Add some enchantment data for key items
UPDATE items SET enchantments = '{"sharpness": 5, "looting": 3}' WHERE minecraft_id = 'diamond_sword' AND name LIKE '%Epic Blade%';
UPDATE items SET enchantments = '{"unbreaking": 3, "mending": 1}' WHERE minecraft_id = 'elytra' AND name LIKE '%Enchanted%';
UPDATE items SET enchantments = '{"protection": 4, "unbreaking": 3}' WHERE minecraft_id = 'netherite_helmet';
UPDATE items SET enchantments = '{"feather_falling": 4, "unbreaking": 7}' WHERE minecraft_id = 'leather_boots';
UPDATE items SET enchantments = '{"soul_speed": 3}' WHERE description LIKE '%Soul Speed III%';
UPDATE items SET enchantments = '{"soul_speed": 2}' WHERE description LIKE '%Soul Speed II%';
UPDATE items SET enchantments = '{"soul_speed": 1}' WHERE description LIKE '%Soul Speed I%';
UPDATE items SET enchantments = '{"protection": 4, "thorns": 3, "sharpness": 5, "efficiency": 5, "power": 5, "multishot": 1, "frost_walker": 2}' WHERE name = 'Mythical Tome';

-- Update server names to use single server presentation
-- All items are now on 'Safe Survival' server (single-server presentation while keeping backend scalable)