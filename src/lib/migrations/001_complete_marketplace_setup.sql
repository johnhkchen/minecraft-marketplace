-- Complete Minecraft Marketplace Database Setup
-- This migration creates the entire database structure and populates it with all data

-- Disable foreign key constraints temporarily
PRAGMA foreign_keys = OFF;

-- Drop existing tables if they exist (ensures clean up/down cycles)
DROP TABLE IF EXISTS match_alerts;
DROP TABLE IF EXISTS market_snapshots;
DROP TABLE IF EXISTS price_references;
DROP TABLE IF EXISTS trade_history;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS sellers;

-- Create sellers table
CREATE TABLE sellers (
  seller_id TEXT PRIMARY KEY,
  seller_name TEXT NOT NULL,
  stall_id TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create items table
CREATE TABLE items (
  item_id TEXT PRIMARY KEY,
  item_name TEXT NOT NULL,
  category TEXT DEFAULT 'misc'
);

-- Create listings table with bidding support (price >= 0) and buy/sell types
CREATE TABLE listings (
  listing_id INTEGER PRIMARY KEY,
  seller_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  date_created TEXT DEFAULT CURRENT_TIMESTAMP,
  qty INTEGER NOT NULL CHECK(qty > 0),
  price REAL NOT NULL CHECK(price >= 0), -- Allow 0 for bidding items
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  inventory_unit TEXT DEFAULT 'per item',
  listing_type TEXT DEFAULT 'sell' CHECK(listing_type IN ('buy', 'sell')),
  expires_at TEXT,
  contact_info TEXT,
  FOREIGN KEY (seller_id) REFERENCES sellers(seller_id),
  FOREIGN KEY (item_id) REFERENCES items(item_id)
);

-- Create transactions table
CREATE TABLE transactions (
  transaction_id TEXT PRIMARY KEY,
  listing_id INTEGER NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  qty_purchased INTEGER NOT NULL CHECK(qty_purchased > 0),
  total_price REAL NOT NULL CHECK(total_price > 0),
  change_given REAL DEFAULT 0,
  transaction_date TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT CHECK(status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
  FOREIGN KEY (listing_id) REFERENCES listings(listing_id),
  FOREIGN KEY (seller_id) REFERENCES sellers(seller_id)
);

-- Insert all sellers (original + new)
INSERT INTO sellers (seller_id, seller_name, stall_id, is_online, last_seen) VALUES
('seller1', 'Iron_Trader', 'A-1', 1, '2025-07-27T12:00:00Z'),
('seller2', 'Elytra_Shop', 'B-2', 1, '2025-07-27T12:00:00Z'), 
('seller3', 'Epic_Gear', 'C-3', 1, '2025-07-27T12:00:00Z'),
('_Pythos692016', '_Pythos692016', 'D-4', 1, '2025-07-27T12:00:00Z'),
('nethy', 'nethy', NULL, 1, '2025-07-27T12:00:00Z'),
('hikoo', 'Hikoo', NULL, 1, '2025-07-27T12:00:00Z'),
('_kwix_', '_kwix_', 'East of Desert Warp', 1, '2025-07-27T12:00:00Z');

-- Insert all items (original + new)
INSERT INTO items (item_id, item_name, category) VALUES
-- Original seed items
('iron_block', 'Iron Block', 'materials'),
('elytra', 'Elytra', 'transportation'),
('elytra_enchanted', 'Enchanted Elytra', 'transportation'),
('diamond_sword', 'Epic Diamond Sword', 'weapons'),
('netherite_sword', 'Netherite Sword', 'weapons'),
('diamond_pickaxe', 'Diamond Pickaxe', 'tools'),
('netherite_pickaxe', 'Netherite Pickaxe', 'tools'),
('diamond_shovel', 'Diamond Shovel', 'tools'),
('netherite_shovel', 'Netherite Shovel', 'tools'),
('diamond_hoe', 'Diamond Hoe', 'tools'),
('netherite_hoe', 'Netherite Hoe', 'tools'),
('bow', 'Bow', 'weapons'),
('crossbow', 'Crossbow', 'weapons'),
('netherite_helmet', 'Champions Netherite Helmet', 'armor'),
('netherite_helmet_mythical', 'Mythical Netherite Helmet', 'armor'),
('leather_boots', 'Explorer Leather Boots', 'armor'),
('elytra_regular', 'Regular Elytra', 'transportation'),
('elytra_cape', 'Enchanted Elytra Cape', 'transportation'),
('elytra_mythical', 'Mythical Elytra Cape', 'transportation'),
('heart_of_the_sea', 'Sorcerer Heart of the Sea', 'magical'),
('totem_of_undying', 'Totem of Undying', 'magical'),
('enchanted_book', 'Mythical Enchanted Book', 'books'),
('skeleton_horse_spawn_egg', 'Skeleton Horse Spawn Egg', 'spawn_eggs'),
('zombie_horse_spawn_egg', 'Zombie Horse Spawn Egg', 'spawn_eggs'),
('bee_spawn_egg', 'Bee Spawn Egg', 'spawn_eggs'),
('amethyst_shard', 'Amethyst Shard', 'materials'),
-- New marketplace items
('gilded_blackstone', 'Gilded Blackstone', 'blocks'),
('netherite_upgrade_smithing_template', 'Netherite Upgrade Template', 'smithing'),
('snout_armor_trim_smithing_template', 'Snout Armor Trim', 'smithing'),
('rib_armor_trim_smithing_template', 'Rib Armor Trim', 'smithing'),
('golden_apple', 'Golden Apple', 'food'),
('obsidian', 'Obsidian', 'blocks'),
('crying_obsidian', 'Crying Obsidian', 'blocks'),
('chain', 'Chains', 'decoration'),
('enchanted_book_soul_speed_3', 'Soul Speed III Book', 'enchanted_books'),
('enchanted_book_soul_speed_2', 'Soul Speed II Book', 'enchanted_books'),
('enchanted_book_soul_speed_1', 'Soul Speed I Book', 'enchanted_books'),
('arrow', 'Arrow', 'combat'),
('spectral_arrow', 'Spectral Arrow', 'combat'),
('music_disc_pigstep', 'Pigstep Music Disk', 'misc'),
('snout_banner_pattern', 'Snout Banner Pattern', 'misc'),
('iron_horse_armor', 'Iron Horse Armor', 'misc'),
('golden_horse_armor', 'Golden Horse Armor', 'misc'),
('diamond_horse_armor', 'Diamond Horse Armor', 'misc'),
('saddle', 'Saddle', 'misc'),
('diamond_pickaxe_unbreakable', 'Unbreakable Pickaxe', 'tools'),
('diamond_sword_unbreakable', 'Unbreakable Sword', 'weapons'),
('diamond_axe_unbreakable', 'Unbreakable Axe', 'tools'),
('diamond_shovel_unbreakable', 'Unbreakable Shovel', 'tools'),
('diamond_hoe_unbreakable', 'Unbreakable Hoe', 'tools'),
('bow_unbreakable', 'Unbreakable Bow', 'weapons'),
('crossbow_unbreakable', 'Unbreakable Crossbow', 'weapons'),
('elytra_enhanced', 'Enhanced Elytra', 'transportation'),
('elytra_mythical_cape', 'Mythical Cape', 'transportation'),
('fishing_rod_unbreakable', 'Unbreakable Fishing Rod', 'tools'),
('diamond_sword_epic_blade', 'Epic Blade', 'weapons'),
('epic_hat_pack_shulker', 'Epic Hat Pack Shulker', 'misc'),
('player_head_champion', 'Champion Rank Head', 'decoration'),
('player_head_galaxy', 'Galaxy Rank Head', 'decoration'),
('player_head_mythical', 'Mythical Rank Head', 'decoration'),
('dark_oak_log', 'Dark Oak Log', 'blocks'),
('pale_oak_log', 'Pale Oak Log', 'blocks'),
('oak_log', 'Oak Log', 'blocks'),
('cherry_log', 'Cherry Log', 'blocks'),
('spruce_log', 'Spruce Log', 'blocks'),
('birch_log', 'Birch Log', 'blocks'),
('acacia_log', 'Acacia Log', 'blocks'),
('wool', 'Wool', 'blocks');

-- Insert original seed listings with proper inventory units
INSERT INTO listings (listing_id, seller_id, item_id, date_created, qty, price, description, is_active, inventory_unit) VALUES
-- Iron Listing (corrected: 27 stacks = 1 shulker)
(1, 'seller1', 'iron_block', '2025-07-27', 1, 32, 'Iron blocks - 6IB per diamond, 32 DB total. Happy to split or sell whole lot.', 1, 'per shulker'),
-- Elytra Listings
(2, 'seller2', 'elytra', '2025-07-27', 1, 18, 'Normal elytra', 1, 'per item'),
(3, 'seller2', 'elytra_enchanted', '2025-07-27', 1, 23, 'Elytra with Unbreaking III and Mending', 1, 'per item'),
-- Tools & Weapons
(4, 'seller3', 'diamond_sword', '2025-07-27', 2, 30, 'Unbreakable Diamond Sword, Sharpness V, Looting III, +1 Armor', 1, 'per item'),
(5, 'seller3', 'netherite_sword', '2025-07-27', 2, 14, 'Unbreakable Netherite Sword', 1, 'per item'),
(6, 'seller3', 'diamond_pickaxe', '2025-07-27', 8, 16, 'Unbreakable Diamond Pickaxe', 1, 'per item'),
(7, 'seller3', 'netherite_pickaxe', '2025-07-27', 1, 17, 'Unbreakable Netherite Pickaxe', 1, 'per item'),
(8, 'seller3', 'diamond_shovel', '2025-07-27', 6, 12, 'Unbreakable Diamond Shovel', 1, 'per item'),
(9, 'seller3', 'netherite_shovel', '2025-07-27', 2, 13, 'Unbreakable Netherite Shovel', 1, 'per item'),
(10, 'seller3', 'diamond_hoe', '2025-07-27', 3, 8, 'Unbreakable Diamond Hoe', 1, 'per item'),
(11, 'seller3', 'netherite_hoe', '2025-07-27', 1, 9, 'Unbreakable Netherite Hoe', 1, 'per item'),
(12, 'seller3', 'bow', '2025-07-27', 5, 12, 'Unbreakable Bow', 1, 'per item'),
(13, 'seller3', 'crossbow', '2025-07-27', 3, 10, 'Unbreakable Crossbow', 1, 'per item'),
-- Armor
(14, 'seller3', 'netherite_helmet', '2025-07-27', 4, 6, 'Netherite Helmet, Unbreaking III, Protection IV', 1, 'per item'),
(15, 'seller3', 'netherite_helmet_mythical', '2025-07-27', 3, 9, 'Netherite Helmet, Protection IV, Mending', 1, 'per item'),
(16, 'seller3', 'leather_boots', '2025-07-27', 5, 6, 'Dyed Leather Boots, Feather Falling IV, Unbreaking VII, Knockback Resistance +1', 1, 'per item'),
-- Elytras
(17, 'seller3', 'elytra_regular', '2025-07-27', 1, 28, 'Regular Elytra', 1, 'per item'),
(18, 'seller3', 'elytra_cape', '2025-07-27', 3, 30, 'Unbreakable Elytra, +2 Armor Toughness, +2 Armor', 1, 'per item'),
(19, 'seller3', 'elytra_mythical', '2025-07-27', 1, 64, 'Unbreakable Elytra, +3 Armor, +2 Armor Toughness, +1 Max Absorption', 1, 'per item'),
-- Misc Items
(20, 'seller3', 'heart_of_the_sea', '2025-07-27', 2, 26, '+2 Armor Toughness, +6 Max Health, +2 Max Absorption, +0.02 Max Speed', 1, 'per item'),
(21, 'seller3', 'totem_of_undying', '2025-07-27', 3, 10, 'Totem of Undying', 1, 'per item'),
(22, 'seller3', 'enchanted_book', '2025-07-27', 6, 2, 'Enchanted Book: Protection IV, Thorns III, Sharpness V, Efficiency V, Power V, Multishot, Frost Walker II', 1, 'per item'),
(23, 'seller3', 'skeleton_horse_spawn_egg', '2025-07-27', 3, 10, 'Skeleton Horse Spawn Egg', 1, 'per item'),
(24, 'seller3', 'zombie_horse_spawn_egg', '2025-07-27', 6, 10, 'Zombie Horse Spawn Egg', 1, 'per item'),
(25, 'seller3', 'bee_spawn_egg', '2025-07-27', 4, 0.625, 'Bee Spawn Egg', 1, 'per item'),
-- Amethyst Listing (corrected: 27 stacks = 1 shulker)
(26, '_Pythos692016', 'amethyst_shard', '2025-07-27', 1, 4, 'Amethyst going rate 6DB per shulker, selling for 4DB plus 32 phantom membranes bonus', 1, 'per shulker');

-- Insert new marketplace listings (starting from listing_id 100 to avoid conflicts)
INSERT INTO listings (seller_id, item_id, date_created, qty, price, description, is_active, inventory_unit) VALUES
-- nethy's nether items (with corrected pricing)
('nethy', 'gilded_blackstone', '2025-07-27T12:00:00Z', 102, 1.422, 'Gilded Blackstone - 1 dia per 5', 1, 'per stack'),
('nethy', 'netherite_upgrade_smithing_template', '2025-07-27T12:00:00Z', 167, 0.667, 'Netherite upgrade Template - 6 dia per unit', 1, 'per item'),
('nethy', 'snout_armor_trim_smithing_template', '2025-07-27T12:00:00Z', 123, 0.667, 'Snout Armor Trim - 6 dia per unit', 1, 'per item'),
('nethy', 'rib_armor_trim_smithing_template', '2025-07-27T12:00:00Z', 54, 0.667, 'Rib Armor Trim - 6 dia per unit', 1, 'per item'),
('nethy', 'golden_apple', '2025-07-27T12:00:00Z', 184, 0.056, 'Golden Apple - 1 dia per 2', 1, 'per item'),
('nethy', 'obsidian', '2025-07-27T12:00:00Z', 49, 0.444, 'Obsidian - 1 dia per 16', 1, 'per stack'),
('nethy', 'crying_obsidian', '2025-07-27T12:00:00Z', 1, 0.444, 'Crying Obsidian - 1 dia per 16 (SOLD OUT)', 0, 'per stack'),
('nethy', 'chain', '2025-07-27T12:00:00Z', 1, 0.222, 'Chains - 1 dia per 32 (SOLD OUT)', 0, 'per stack'),
('nethy', 'enchanted_book_soul_speed_3', '2025-07-27T12:00:00Z', 44, 0.889, 'Soul Speed III Book - 8 dia per unit', 1, 'per item'),
('nethy', 'enchanted_book_soul_speed_2', '2025-07-27T12:00:00Z', 42, 0.444, 'Soul Speed II Book - 4 dia per unit', 1, 'per item'),
('nethy', 'enchanted_book_soul_speed_1', '2025-07-27T12:00:00Z', 48, 0.222, 'Soul Speed I Book - 2 dia per unit', 1, 'per item'),
-- nethy's bidding items (price = 0)
('nethy', 'arrow', '2025-07-27T12:00:00Z', 149, 0, 'Arrow - make an offer', 1, 'per stack'),
('nethy', 'spectral_arrow', '2025-07-27T12:00:00Z', 45, 0, 'Spectral Arrow - make an offer', 1, 'per stack'),
('nethy', 'music_disc_pigstep', '2025-07-27T12:00:00Z', 73, 0, 'Pigstep Music Disk - make an offer', 1, 'per item'),
('nethy', 'snout_banner_pattern', '2025-07-27T12:00:00Z', 113, 0, 'Snout Banner Pattern - make an offer', 1, 'per item'),
('nethy', 'iron_horse_armor', '2025-07-27T12:00:00Z', 189, 0, 'Iron Horse Armor - make an offer', 1, 'per item'),
('nethy', 'golden_horse_armor', '2025-07-27T12:00:00Z', 317, 0, 'Golden Horse Armor - make an offer', 1, 'per item'),
('nethy', 'diamond_horse_armor', '2025-07-27T12:00:00Z', 125, 0, 'Diamond Horse Armor - make an offer', 1, 'per item'),
('nethy', 'saddle', '2025-07-27T12:00:00Z', 365, 0, 'Saddle - make an offer', 1, 'per item'),
-- Hikoo's unbreakable tools
('hikoo', 'diamond_pickaxe_unbreakable', '2025-07-27T12:00:00Z', 10, 17, 'Unbreakable Pickaxe', 1, 'per item'),
('hikoo', 'diamond_sword_unbreakable', '2025-07-27T12:00:00Z', 1, 14, 'Unbreakable Sword (SOLD)', 0, 'per item'),
('hikoo', 'diamond_axe_unbreakable', '2025-07-27T12:00:00Z', 1, 16, 'Unbreakable Axe (SOLD)', 0, 'per item'),
('hikoo', 'diamond_shovel_unbreakable', '2025-07-27T12:00:00Z', 10, 12, 'Unbreakable Shovel', 1, 'per item'),
('hikoo', 'diamond_hoe_unbreakable', '2025-07-27T12:00:00Z', 10, 8, 'Unbreakable Hoe', 1, 'per item'),
('hikoo', 'bow_unbreakable', '2025-07-27T12:00:00Z', 10, 12, 'Unbreakable Bow', 1, 'per item'),
('hikoo', 'crossbow_unbreakable', '2025-07-27T12:00:00Z', 3, 10, 'Unbreakable Crossbow', 1, 'per item'),
('hikoo', 'elytra_enhanced', '2025-07-27T12:00:00Z', 1, 1, 'Enhanced Elytra (SOLD)', 0, 'per item'),
('hikoo', 'elytra_mythical_cape', '2025-07-27T12:00:00Z', 1, 1, 'Mythical Cape (SOLD)', 0, 'per item'),
('hikoo', 'fishing_rod_unbreakable', '2025-07-27T12:00:00Z', 1, 5, 'Unbreakable Fishing Rod (SOLD)', 0, 'per item'),
('hikoo', 'diamond_sword_epic_blade', '2025-07-27T12:00:00Z', 5, 30, 'Epic Blade - Sharpness V, Looting III, +2 Armor', 1, 'per item'),
-- Hikoo's bidding items
('hikoo', 'epic_hat_pack_shulker', '2025-07-27T12:00:00Z', 1, 0, 'Epic Hat Pack Shulker - Shiny Blocks + 3 Heads: Wither Skeleton Plushie, Bag of Coins and Fox Cupcake', 1, 'per item'),
('hikoo', 'player_head_champion', '2025-07-27T12:00:00Z', 9, 0, 'Champion Rank Heads - Mailbox, Alarm Clock, Wooden Flowerpot, Toaster, Bird house', 1, 'per item'),
('hikoo', 'player_head_galaxy', '2025-07-27T12:00:00Z', 4, 0, 'Galaxy Rank Heads - Galaxy, Galaxy Slime, Calico Cat, Fish Bowl', 1, 'per item'),
('hikoo', 'player_head_mythical', '2025-07-27T12:00:00Z', 3, 0, 'Mythical Rank Heads - Minecraft World, Penguin Plushie, Cauldron on Fireplace', 1, 'per item'),
-- _Pythos692016's wood logs
('_Pythos692016', 'dark_oak_log', '2025-07-27T12:00:00Z', 2, 2, 'Dark oak wood logs - msg me in game _Pythos692016', 1, 'per shulker'),
('_Pythos692016', 'pale_oak_log', '2025-07-27T12:00:00Z', 1, 2, 'Pale oak wood logs - msg me in game _Pythos692016', 1, 'per shulker'),
('_Pythos692016', 'oak_log', '2025-07-27T12:00:00Z', 1, 2, 'Oak wood logs - msg me in game _Pythos692016', 1, 'per shulker'),
('_Pythos692016', 'cherry_log', '2025-07-27T12:00:00Z', 1, 2, 'Cherry wood logs - msg me in game _Pythos692016', 1, 'per shulker'),
('_Pythos692016', 'spruce_log', '2025-07-27T12:00:00Z', 1, 2, 'Spruce wood logs - msg me in game _Pythos692016', 1, 'per shulker'),
('_Pythos692016', 'birch_log', '2025-07-27T12:00:00Z', 1, 2, 'Birch wood logs - msg me in game _Pythos692016', 1, 'per shulker'),
('_Pythos692016', 'acacia_log', '2025-07-27T12:00:00Z', 1, 2, 'Acacia wood logs - msg me in game _Pythos692016', 1, 'per shulker'),
-- _kwix_'s wool
('_kwix_', 'wool', '2025-07-27T12:00:00Z', 100, 1, 'Wool - 3 stacks per diamond, 1 color per Shulker Box. Bulk prices: 1 Box = 1DB, 6 Boxes = 5DB, 12 Boxes = 9DB, 16 Boxes = 12DB, 20 Boxes = 15DB, 45 Boxes = 32DB, 100 Boxes = 64DB', 1, 'per shulker');

-- Add new buyers to sellers table
INSERT INTO sellers (seller_id, seller_name, stall_id, is_online, last_seen) VALUES
('xwudn3r', 'xWudn3r', NULL, 1, '2025-07-28T14:42:00Z'),
('hikoo_buyer', 'Hikoo', NULL, 1, '2025-07-28T14:42:00Z'),
('jerseymaid', 'Jerseymaid', NULL, 1, '2025-07-28T14:42:00Z'),
('lupus', 'Lupus', NULL, 1, '2025-07-28T14:42:00Z'),
('tanthalas', 'Tanthalas', 'East roofed forest', 1, '2025-07-28T14:42:00Z'),
('tchunko', 'tchunko', NULL, 1, '2025-07-28T14:42:00Z');

-- Add new items to items table (avoiding duplicates)
INSERT INTO items (item_id, item_name, category) VALUES
('sorcerer_donor_rank', 'Sorcerer Donor Rank', 'ranks'),
('diamond_boots_unbreakable', 'Unbreakable Diamond Boots', 'armor'),
('player_head_hermit_crab', 'Hermit Crab Head', 'event_heads'),
('player_head_pink_macaron', 'Pink Macaron Head', 'event_heads'),
('player_head_ice_cream_sandwich', 'Ice Cream Sandwich Head', 'event_heads'),
('player_head_golden_dragon_plushie', 'Golden Dragon Plushie Head', 'event_heads'),
('player_head_polaroid_camera', 'Polaroid Camera Head', 'event_heads'),
('player_head_flower_bush', 'Flower Bush Head', 'event_heads'),
('player_head_computer_monitor', 'Computer Monitor Head', 'event_heads'),
('player_head_tnt', 'TNT Head', 'event_heads'),
('player_head_rubber_ducky', 'Rubber Ducky Head', 'event_heads'),
('player_head_sushi', 'Sushi Head', 'event_heads'),
('player_head_perry_platypus', 'Perry the Platypus Head', 'event_heads'),
('player_head_the_flash', 'The Flash Head', 'event_heads'),
('player_head_sonic', 'Sonic the Hedgehog Head', 'event_heads'),
('player_head_generic', 'Player Head', 'decoration'),
('netherite_ingot', 'Netherite Ingot', 'materials'),
('sand', 'Sand', 'blocks'),
('deepslate', 'Deepslate', 'blocks'),
('gravel', 'Gravel', 'blocks'),
('terracotta', 'Plain Terracotta', 'blocks'),
('stone', 'Stone', 'blocks'),
('dirt', 'Dirt', 'blocks'),
('elytra_unbreakable', 'Unbreakable Elytra', 'transportation'),
-- Wood items (logs)
('jungle_log', 'Jungle Log', 'wood'),
('mangrove_log', 'Mangrove Log', 'wood'),
-- Wood items (planks)
('oak_planks', 'Oak Planks', 'wood'),
('spruce_planks', 'Spruce Planks', 'wood'),
('birch_planks', 'Birch Planks', 'wood'),
('jungle_planks', 'Jungle Planks', 'wood'),
('dark_oak_planks', 'Dark Oak Planks', 'wood'),
('mangrove_planks', 'Mangrove Planks', 'wood'),
('pale_oak_planks', 'Pale Oak Planks', 'wood'),
('cherry_planks', 'Cherry Planks', 'wood');

-- Buy listings for xWudn3r (Wood - Logs)
INSERT INTO listings (seller_id, item_id, listing_type, date_created, qty, price, description, is_active, inventory_unit, contact_info) VALUES
('xwudn3r', 'oak_log', 'buy', '2025-07-28T14:42:00Z', 81, 2, 'Buying oak logs - 1 dia per 96 logs or best offer', 1, 'per shulker', 'msg xWudn3r in game'),
('xwudn3r', 'spruce_log', 'buy', '2025-07-28T14:42:00Z', 81, 2, 'Buying spruce logs - 1 dia per 96 logs or best offer', 1, 'per shulker', 'msg xWudn3r in game'),
('xwudn3r', 'birch_log', 'buy', '2025-07-28T14:42:00Z', 54, 2, 'Buying birch logs - 1 dia per 96 logs or best offer', 1, 'per shulker', 'msg xWudn3r in game'),
('xwudn3r', 'jungle_log', 'buy', '2025-07-28T14:42:00Z', 27, 2, 'Buying jungle logs - 1 dia per 96 logs or best offer', 1, 'per shulker', 'msg xWudn3r in game'),
('xwudn3r', 'dark_oak_log', 'buy', '2025-07-28T14:42:00Z', 54, 2, 'Buying dark oak logs - 1 dia per 96 logs or best offer', 1, 'per shulker', 'msg xWudn3r in game'),
('xwudn3r', 'mangrove_log', 'buy', '2025-07-28T14:42:00Z', 27, 2, 'Buying mangrove logs - 1 dia per 96 logs or best offer', 1, 'per shulker', 'msg xWudn3r in game'),
('xwudn3r', 'pale_oak_log', 'buy', '2025-07-28T14:42:00Z', 27, 2, 'Buying pale oak logs - 1 dia per 96 logs or best offer', 1, 'per shulker', 'msg xWudn3r in game'),
('xwudn3r', 'cherry_log', 'buy', '2025-07-28T14:42:00Z', 27, 2, 'Buying cherry logs - 1 dia per 96 logs or best offer', 1, 'per shulker', 'msg xWudn3r in game');

-- Buy listings for xWudn3r (Wood - Planks) - 1 log = 4 planks, so planks are 1/4 price of logs
INSERT INTO listings (seller_id, item_id, listing_type, date_created, qty, price, description, is_active, inventory_unit, contact_info) VALUES
('xwudn3r', 'oak_planks', 'buy', '2025-07-28T14:42:00Z', 81, 0.5, 'Buying oak planks - 1 dia per 384 planks or best offer', 1, 'per shulker', 'msg xWudn3r in game'),
('xwudn3r', 'spruce_planks', 'buy', '2025-07-28T14:42:00Z', 81, 0.5, 'Buying spruce planks - 1 dia per 384 planks or best offer', 1, 'per shulker', 'msg xWudn3r in game'),
('xwudn3r', 'birch_planks', 'buy', '2025-07-28T14:42:00Z', 54, 0.5, 'Buying birch planks - 1 dia per 384 planks or best offer', 1, 'per shulker', 'msg xWudn3r in game'),
('xwudn3r', 'jungle_planks', 'buy', '2025-07-28T14:42:00Z', 27, 0.5, 'Buying jungle planks - 1 dia per 384 planks or best offer', 1, 'per shulker', 'msg xWudn3r in game'),
('xwudn3r', 'dark_oak_planks', 'buy', '2025-07-28T14:42:00Z', 54, 0.5, 'Buying dark oak planks - 1 dia per 384 planks or best offer', 1, 'per shulker', 'msg xWudn3r in game'),
('xwudn3r', 'mangrove_planks', 'buy', '2025-07-28T14:42:00Z', 27, 0.5, 'Buying mangrove planks - 1 dia per 384 planks or best offer', 1, 'per shulker', 'msg xWudn3r in game'),
('xwudn3r', 'pale_oak_planks', 'buy', '2025-07-28T14:42:00Z', 27, 0.5, 'Buying pale oak planks - 1 dia per 384 planks or best offer', 1, 'per shulker', 'msg xWudn3r in game'),
('xwudn3r', 'cherry_planks', 'buy', '2025-07-28T14:42:00Z', 27, 0.5, 'Buying cherry planks - 1 dia per 384 planks or best offer', 1, 'per shulker', 'msg xWudn3r in game');

-- Buy listings for xWudn3r (Sorcerer Donor Rank)
INSERT INTO listings (seller_id, item_id, listing_type, date_created, qty, price, description, is_active, inventory_unit, contact_info) VALUES
('xwudn3r', 'sorcerer_donor_rank', 'buy', '2025-07-28T14:42:00Z', 1, 224, 'Buying Sorcerer Donor Rank for alt - offering 3.5 stacks of DBs (about 8db per dollar)', 1, 'per item', 'msg xWudn3r in game');

-- Buy listings for Hikoo (Unbreakable Diamond Boots)
INSERT INTO listings (seller_id, item_id, listing_type, date_created, qty, price, description, is_active, inventory_unit, contact_info) VALUES
('hikoo_buyer', 'diamond_boots_unbreakable', 'buy', '2025-07-28T14:42:00Z', 1, 0, 'Looking to buy unbreakable diamond boots - please dm with price', 1, 'per item', 'dm Hikoo');

-- Buy listings for Jerseymaid (Event Heads)
INSERT INTO listings (seller_id, item_id, listing_type, date_created, qty, price, description, is_active, inventory_unit, contact_info) VALUES
('jerseymaid', 'player_head_hermit_crab', 'buy', '2025-07-28T14:42:00Z', 1, 0, 'Buying Hermit Crab head from Head Hunt event', 1, 'per item', 'msg jerseymaid in game or here'),
('jerseymaid', 'player_head_pink_macaron', 'buy', '2025-07-28T14:42:00Z', 1, 0, 'Buying Pink Macaron head from Head Hunt event', 1, 'per item', 'msg jerseymaid in game or here'),
('jerseymaid', 'player_head_ice_cream_sandwich', 'buy', '2025-07-28T14:42:00Z', 1, 0, 'Buying Ice Cream Sandwich head from Head Hunt event', 1, 'per item', 'msg jerseymaid in game or here'),
('jerseymaid', 'player_head_golden_dragon_plushie', 'buy', '2025-07-28T14:42:00Z', 1, 0, 'Buying Golden Dragon Plushie head from Head Hunt event', 1, 'per item', 'msg jerseymaid in game or here'),
('jerseymaid', 'player_head_polaroid_camera', 'buy', '2025-07-28T14:42:00Z', 1, 0, 'Buying Polaroid Camera head from Head Hunt event', 1, 'per item', 'msg jerseymaid in game or here'),
('jerseymaid', 'player_head_flower_bush', 'buy', '2025-07-28T14:42:00Z', 1, 0, 'Buying Flower Bush head from Head Hunt event', 1, 'per item', 'msg jerseymaid in game or here'),
('jerseymaid', 'player_head_computer_monitor', 'buy', '2025-07-28T14:42:00Z', 1, 0, 'Buying Computer Monitor head from Head Hunt event', 1, 'per item', 'msg jerseymaid in game or here'),
('jerseymaid', 'player_head_tnt', 'buy', '2025-07-28T14:42:00Z', 1, 0, 'Buying TNT head from Head Hunt event', 1, 'per item', 'msg jerseymaid in game or here'),
('jerseymaid', 'player_head_rubber_ducky', 'buy', '2025-07-28T14:42:00Z', 1, 0, 'Buying Rubber Ducky head from Head Hunt event', 1, 'per item', 'msg jerseymaid in game or here'),
('jerseymaid', 'player_head_sushi', 'buy', '2025-07-28T14:42:00Z', 1, 0, 'Buying Sushi head from Head Hunt event', 1, 'per item', 'msg jerseymaid in game or here'),
('jerseymaid', 'player_head_perry_platypus', 'buy', '2025-07-28T14:42:00Z', 1, 0, 'Buying Perry the Platypus head from Head Hunt event', 1, 'per item', 'msg jerseymaid in game or here'),
('jerseymaid', 'player_head_the_flash', 'buy', '2025-07-28T14:42:00Z', 1, 0, 'Buying The Flash head from Obstacle Course event', 1, 'per item', 'msg jerseymaid in game or here'),
('jerseymaid', 'player_head_sonic', 'buy', '2025-07-28T14:42:00Z', 1, 0, 'Buying Sonic the Hedgehog head from Obstacle Course event', 1, 'per item', 'msg jerseymaid in game or here'),
('jerseymaid', 'player_head_generic', 'buy', '2025-07-28T14:42:00Z', 999, 5, 'Buying player heads - paying 5 DB each', 1, 'per item', 'msg jerseymaid in game or here');

-- Buy listings for Lupus (Netherite)
INSERT INTO listings (seller_id, item_id, listing_type, date_created, qty, price, description, is_active, inventory_unit, contact_info) VALUES
('lupus', 'netherite_ingot', 'buy', '2025-07-28T14:42:00Z', 5, 2, 'Buying Netherite - 2 DBs each, trying to get 5', 1, 'per item', 'msg Lupus in game');

-- Buy listings for Tanthalas (Auto buyers for bulk blocks)
INSERT INTO listings (seller_id, item_id, listing_type, date_created, qty, price, description, is_active, inventory_unit, contact_info) VALUES
('tanthalas', 'sand', 'buy', '2025-07-28T14:42:00Z', 999, 0.0159, 'Auto buyer: Sand - 1 diamond for 7 stacks', 1, 'per stack', 'East roofed forest auto buyers'),
('tanthalas', 'deepslate', 'buy', '2025-07-28T14:42:00Z', 999, 0.0111, 'Auto buyer: Deepslate - 1 diamond for 10 stacks', 1, 'per stack', 'East roofed forest auto buyers'),
('tanthalas', 'gravel', 'buy', '2025-07-28T14:42:00Z', 999, 0.0185, 'Auto buyer: Gravel - 1 diamond for 6 stacks', 1, 'per stack', 'East roofed forest auto buyers'),
('tanthalas', 'terracotta', 'buy', '2025-07-28T14:42:00Z', 999, 0.0278, 'Auto buyer: Plain Terracotta - 1 diamond for 4 stacks', 1, 'per stack', 'East roofed forest auto buyers'),
('tanthalas', 'stone', 'buy', '2025-07-28T14:42:00Z', 999, 0.0111, 'Auto buyer: Stone - 1 diamond for 10 stacks', 1, 'per stack', 'East roofed forest auto buyers'),
('tanthalas', 'dirt', 'buy', '2025-07-28T14:42:00Z', 999, 0.0111, 'Auto buyer: Dirt - 1 diamond for 10 stacks', 1, 'per stack', 'East roofed forest auto buyers');

-- Buy listings for tchunko (Unbreakable Elytra)
INSERT INTO listings (seller_id, item_id, listing_type, date_created, qty, price, description, is_active, inventory_unit, contact_info) VALUES
('tchunko', 'elytra_unbreakable', 'buy', '2025-07-28T14:42:00Z', 1, 0, 'Looking to buy an unbreakable elytra - please let me know your price', 1, 'per item', 'msg tchunko in game');

-- Create trade history table for manual/negotiated trades
CREATE TABLE trade_history (
  trade_id INTEGER PRIMARY KEY,
  item_id TEXT NOT NULL,
  buyer_id TEXT,
  seller_id TEXT,
  qty_traded INTEGER NOT NULL CHECK(qty_traded > 0),
  price_per_unit REAL NOT NULL CHECK(price_per_unit > 0),
  total_value REAL NOT NULL,
  trade_date TEXT DEFAULT CURRENT_TIMESTAMP,
  trade_source TEXT DEFAULT 'marketplace', -- 'marketplace', 'private_deal', 'auction'
  notes TEXT,
  FOREIGN KEY (item_id) REFERENCES items(item_id)
);

-- Create price references table for market context
CREATE TABLE price_references (
  ref_id INTEGER PRIMARY KEY,
  item_id TEXT NOT NULL,
  date_recorded TEXT DEFAULT CURRENT_TIMESTAMP,
  current_sell_low REAL, -- lowest current sell offer
  current_sell_high REAL, -- highest current sell offer  
  current_buy_high REAL, -- highest current buy offer
  current_buy_low REAL, -- lowest current buy offer
  last_trade_price REAL, -- most recent actual transaction
  last_trade_date TEXT,
  total_sell_volume INTEGER DEFAULT 0, -- items for sale
  total_buy_interest INTEGER DEFAULT 0, -- items wanted
  market_activity TEXT CHECK(market_activity IN ('dead', 'low', 'medium', 'high')) DEFAULT 'low',
  FOREIGN KEY (item_id) REFERENCES items(item_id)
);

-- Create market snapshots for historical context
CREATE TABLE market_snapshots (
  snapshot_id INTEGER PRIMARY KEY,
  item_id TEXT NOT NULL,
  snapshot_date TEXT DEFAULT CURRENT_TIMESTAMP,
  period_type TEXT CHECK(period_type IN ('weekly', 'monthly')) DEFAULT 'weekly',
  
  -- Simple metrics that work with sparse data
  active_sellers INTEGER DEFAULT 0,
  active_buyers INTEGER DEFAULT 0,
  sell_price_low REAL,
  sell_price_high REAL,
  buy_price_high REAL,
  trades_this_period INTEGER DEFAULT 0,
  avg_trade_price REAL,
  
  -- Qualitative assessment
  market_activity TEXT CHECK(market_activity IN ('dead', 'low', 'medium', 'high')) DEFAULT 'low',
  price_trend TEXT CHECK(price_trend IN ('falling', 'stable', 'rising', 'volatile')) DEFAULT 'stable',
  
  FOREIGN KEY (item_id) REFERENCES items(item_id)
);

-- Create match alerts for notifications
CREATE TABLE match_alerts (
  alert_id INTEGER PRIMARY KEY,
  item_id TEXT NOT NULL,
  interested_trader_id TEXT NOT NULL,
  alert_type TEXT CHECK(alert_type IN ('price_match', 'new_seller', 'new_buyer')) NOT NULL,
  target_price REAL,
  message TEXT,
  created_date TEXT DEFAULT CURRENT_TIMESTAMP,
  is_sent BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (item_id) REFERENCES items(item_id),
  FOREIGN KEY (interested_trader_id) REFERENCES sellers(seller_id)
);

-- Initialize price references for items that have both buy and sell listings
INSERT INTO price_references (item_id, current_sell_low, current_sell_high, current_buy_high, current_buy_low, total_sell_volume, total_buy_interest, market_activity)
SELECT 
  i.item_id,
  MIN(CASE WHEN l.listing_type = 'sell' AND l.price > 0 THEN l.price END) as current_sell_low,
  MAX(CASE WHEN l.listing_type = 'sell' AND l.price > 0 THEN l.price END) as current_sell_high,
  MAX(CASE WHEN l.listing_type = 'buy' AND l.price > 0 THEN l.price END) as current_buy_high,
  MIN(CASE WHEN l.listing_type = 'buy' AND l.price > 0 THEN l.price END) as current_buy_low,
  SUM(CASE WHEN l.listing_type = 'sell' AND l.is_active = 1 THEN l.qty ELSE 0 END) as total_sell_volume,
  SUM(CASE WHEN l.listing_type = 'buy' AND l.is_active = 1 THEN l.qty ELSE 0 END) as total_buy_interest,
  CASE 
    WHEN COUNT(l.listing_id) >= 5 THEN 'high'
    WHEN COUNT(l.listing_id) >= 3 THEN 'medium' 
    WHEN COUNT(l.listing_id) >= 1 THEN 'low'
    ELSE 'dead'
  END as market_activity
FROM items i
LEFT JOIN listings l ON i.item_id = l.item_id AND l.is_active = 1
GROUP BY i.item_id
HAVING COUNT(l.listing_id) > 0;

-- Re-enable foreign key constraints
PRAGMA foreign_keys = ON;