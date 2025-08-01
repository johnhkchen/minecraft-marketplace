-- Test Data for Minecraft Marketplace
-- Consistent test data for reproducible tests

-- Insert test users
INSERT INTO users (discord_id, username, shop_name, role) VALUES 
    ('123456789012345678', 'steve', 'Steve''s Diamond Shop', 'user'),
    ('234567890123456789', 'alex', 'Alex''s Tool Emporium', 'user'),
    ('345678901234567890', 'bob', 'Bob''s Materials', 'user')
ON CONFLICT (discord_id) DO NOTHING;

-- Insert test items
INSERT INTO items (owner_id, name, minecraft_id, category, stock_quantity) VALUES 
    ('steve', 'Diamond Sword', 'minecraft:diamond_sword', 'weapons', 5),
    ('steve', 'Diamond Pickaxe', 'minecraft:diamond_pickaxe', 'tools', 3),
    ('alex', 'Iron Sword', 'minecraft:iron_sword', 'weapons', 10),
    ('alex', 'Iron Pickaxe', 'minecraft:iron_pickaxe', 'tools', 8),
    ('bob', 'Diamond Block', 'minecraft:diamond_block', 'materials', 50);

-- Insert test prices
INSERT INTO prices (item_id, price_diamonds, trading_unit) VALUES 
    (1, 2.5, 'per_item'),
    (2, 3.0, 'per_item'),
    (3, 1.25, 'per_item'),
    (4, 1.5, 'per_item'),
    (5, 9.0, 'per_item');