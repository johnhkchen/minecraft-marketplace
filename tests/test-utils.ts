import { faker } from '@faker-js/faker';
import type { ShopListing, Seller, Item, Transaction } from '../src/types/marketplace.js';
import { getRandomItem, getRandomItemFromCategory, MINECRAFT_CATEGORIES } from '../src/lib/minecraft-items.js';
import type { MinecraftCategory } from '../src/lib/minecraft-items.js';

// Helper to convert SQLite boolean (0/1) to actual boolean
export function sqliteBoolean(value: any): boolean {
  return Boolean(value);
}

// Generate a unique seller using proper test isolation (no timestamp dependency)
export function createTestSeller(overrides: Partial<Omit<Seller, 'last_seen'>> = {}): Omit<Seller, 'last_seen'> {
  const uniqueId = faker.string.uuid(); // Deterministic in tests, unique in reality
  const random = faker.string.alphanumeric(8);
  return {
    seller_id: `seller_${uniqueId.replace(/-/g, '_')}_${random}`,
    seller_name: `${faker.internet.username()}_${random}`,
    stall_id: faker.helpers.arrayElement(['A', 'B', 'C', 'D']) + '-' + faker.number.int({ min: 1, max: 50 }),
    is_online: faker.datatype.boolean(),
    ...overrides
  };
}

// Generate a unique item using real Minecraft items (proper test isolation)
export function createTestItem(overrides: Partial<Item> = {}): Item {
  const uniqueId = faker.string.uuid().substring(0, 8);
  const random = faker.string.alphanumeric(8);
  
  // Use a real Minecraft item unless overridden
  const minecraftItem = getRandomItem();
  
  return {
    item_id: overrides.item_id || `TEST_${minecraftItem.id}_${uniqueId}_${random}`,
    item_name: overrides.item_name || `TEST ${minecraftItem.name}`,
    category: overrides.category || minecraftItem.category,
    ...overrides
  };
}

// Generate a unique listing using proper test isolation
export function createTestListing(
  sellerId: string, 
  itemId: string, 
  overrides: Partial<ShopListing> = {}
): ShopListing {
  // Use proper random generation instead of timestamp dependency
  const listingId = faker.number.int({ min: 100000000, max: 999999999 }); // 9-digit number
  
  return {
    listing_id: listingId,
    seller_id: sellerId,
    item_id: itemId,
    date_created: faker.date.recent().toISOString(),
    qty: faker.number.int({ min: 1, max: 64 }),
    price: faker.number.float({ min: 0.5, max: 50, fractionDigits: 3 }), // More realistic Minecraft pricing
    description: generateMinecraftDescription(),
    is_active: true,
    ...overrides
  };
}

// Generate a unique transaction
export function createTestTransaction(
  listingId: number,
  sellerId: string,
  overrides: Partial<Transaction> = {}
): Transaction {
  const qty = faker.number.int({ min: 1, max: 10 });
  const price = faker.number.float({ min: 1, max: 50, fractionDigits: 2 });
  
  return {
    transaction_id: `txn_${faker.string.alphanumeric(12)}`,
    listing_id: listingId,
    buyer_id: `buyer_${faker.string.alphanumeric(8)}`,
    seller_id: sellerId,
    qty_purchased: qty,
    total_price: qty * price,
    change_given: faker.number.float({ min: 0, max: 10, fractionDigits: 2 }),
    transaction_date: faker.date.recent().toISOString(),
    status: faker.helpers.arrayElement(['pending', 'completed', 'cancelled']),
    ...overrides
  };
}

// Create a test context for API testing
export function createTestAPIContext(url: string, options: RequestInit = {}) {
  const request = new Request(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  return {
    request,
    url: new URL(url),
    params: {},
    props: {},
    redirect: (url: string) => Response.redirect(url),
    locals: {}
  };
}

// Seed fresh test data with real Minecraft items
export function seedTestData(db: any) {
  const seller = createMinecraftSeller();
  const item = createTestItem();
  
  db.createSeller(seller);
  db.createItem(item);
  
  const listing = createTestListing(seller.seller_id, item.item_id);
  db.createListing(listing);
  
  return { seller, item, listing };
}

// Create test data with specific Minecraft category
export function seedTestDataWithCategory(db: any, category: MinecraftCategory) {
  const seller = createMinecraftSeller();
  const minecraftItem = getRandomItemFromCategory(category);
  const item = createTestItem({
    item_id: minecraftItem.id,
    item_name: minecraftItem.name,
    category: minecraftItem.category
  });
  
  db.createSeller(seller);
  db.createItem(item);
  
  const listing = createTestListing(seller.seller_id, item.item_id);
  db.createListing(listing);
  
  return { seller, item, listing };
}

// Generate Minecraft-appropriate item descriptions
function generateMinecraftDescription(): string {
  const descriptions = [
    'High quality item from the overworld',
    'Rare drop with excellent condition',
    'Freshly mined and ready to use',
    'Enchanted with powerful magic',
    'Perfect for your next adventure',
    'Crafted by expert smiths',
    'Found in ancient dungeons',
    'Blessed by the nether gods',
    'Imbued with end crystal energy',
    'Forged in dragon fire'
  ];
  return faker.helpers.arrayElement(descriptions);
}

// Create test seller with Minecraft-themed names (proper test isolation)
export function createMinecraftSeller(overrides: Partial<Omit<Seller, 'last_seen'>> = {}): Omit<Seller, 'last_seen'> {
  const uniqueId = faker.string.uuid().substring(0, 8);
  const minecraftNames = ['CraftMaster', 'DiamondMiner', 'EnderExplorer', 'NetherTrader', 'BlockBuilder', 'RedstoneEngineer'];
  const baseName = faker.helpers.arrayElement(minecraftNames);
  
  return {
    seller_id: `TEST_${baseName.toLowerCase()}_${uniqueId}`,
    seller_name: `TEST_${baseName}_${faker.number.int({ min: 1000, max: 9999 })}`,
    stall_id: 'TEST-' + faker.helpers.arrayElement(['A', 'B', 'C', 'D']) + '-' + faker.number.int({ min: 1, max: 50 }),
    is_online: faker.datatype.boolean(),
    ...overrides
  };
}

// Create a fresh test database instance with proper connection management
export function createTestDatabase(explicitPath?: string): any {
  const { MarketplaceDB } = require('../src/lib/database.js');
  
  // Generate unique test database path if not provided
  const testDbPath = explicitPath || `./tests/test-marketplace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.db`;
  
  // Always use explicit path for tests to avoid environment variable contamination
  return new MarketplaceDB(testDbPath);
}