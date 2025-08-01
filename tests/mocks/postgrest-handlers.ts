/**
 * PostgREST Mock Handlers using MSW
 * 
 * Provides fast, isolated API mocking for unit tests without infrastructure dependency.
 * Follows PostgREST REST API patterns for realistic testing.
 */

import { http, HttpResponse } from 'msw';

// TEMPORAL CONFIG - Update for your project's endpoints
// Detect if we're in Docker environment to match URLConstructionService behavior
const isDockerDeployment = process.env.COMPOSE_PROJECT_NAME || 
                          process.env.DOCKER_COMPOSE || 
                          process.env.HOME === '/app' ||
                          process.env.PATH?.includes('/app');

const BASE_URL = isDockerDeployment ? 'http://localhost:7410' : 'http://localhost:3000';
const DOCKER_BASE_URL = 'http://localhost:7410'; // Docker environment
const DEV_BASE_URL = 'http://localhost:3000'; // Development environment

const TEMPORAL_ENDPOINTS = {
  items: `${BASE_URL}/api/data/public_items`,
  itemsSimple: `${BASE_URL}/api/data/items`, // Simplified endpoint used by API service
  listingsWithDetails: `${BASE_URL}/api/data/listings_with_details`, // Component endpoint
  users: `${BASE_URL}/api/data/public_users`,
  prices: `${BASE_URL}/api/data/public_prices`,
  health: `${BASE_URL}/api/health`
};

// EVERGREEN - Mock data factories following PostgREST response format with enhanced fields
const mockItem = (overrides = {}) => ({
  id: 'item_123',
  owner_id: 'user_123',
  name: 'Diamond Sword',
  category: 'weapons',
  server_name: 'Safe Survival',
  price_diamonds: 5,
  trading_unit: 'per_item',
  stock_quantity: 5,
  is_available: true,
  created_at: '2025-01-01T00:00:00Z',
  // Enhanced fields with defaults
  biome: 'plains',
  direction: 'north',
  warp_command: '/warp diamondsword',
  coordinates_x: 0,
  coordinates_z: 0,
  confidence_level: 'medium',
  last_verified: null,
  verified_by: null,
  owner_shop_name: 'Test Shop',
  ...overrides
});

const mockUser = (overrides = {}) => ({
  id: 'user_123',
  discord_id: 'discord_123',
  username: 'TestUser',
  shop_name: 'Test Shop',
  role: 'user',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  ...overrides
});

// REALISTIC DATASET - 55 items from 7 shops matching real marketplace data
const REALISTIC_MARKETPLACE_DATA = [
  // Blocks & Materials
  mockItem({ 
    id: 'item_001', 
    name: 'Iron Blocks', 
    category: 'blocks', 
    price_diamonds: 288.00, 
    trading_unit: 'per_shulker', 
    stock_quantity: 27, 
    owner_shop_name: 'General Trading Post',
    // Enhanced fields
    biome: 'mountains',
    direction: 'north',
    warp_command: '/warp ironblocks',
    coordinates_x: 150,
    coordinates_z: -200,
    confidence_level: 'high',
    last_verified: '2025-01-01T10:00:00Z',
    verified_by: 'moderator_steve'
  }),
  mockItem({ id: 'item_002', name: 'Gilded Blackstone', category: 'blocks', price_diamonds: 12.8, trading_unit: 'per_stack', stock_quantity: 102, owner_shop_name: 'Nether Materials Co' }),
  mockItem({ id: 'item_003', name: 'Obsidian', category: 'blocks', price_diamonds: 4, trading_unit: 'per_stack', stock_quantity: 49, owner_shop_name: 'Nether Materials Co' }),
  mockItem({ id: 'item_004', name: 'Crying Obsidian', category: 'blocks', price_diamonds: 4, trading_unit: 'per_stack', stock_quantity: 0, owner_shop_name: 'Nether Materials Co', is_available: false }),
  mockItem({ id: 'item_005', name: 'Wool', category: 'blocks', price_diamonds: 9.00, trading_unit: 'per_shulker', stock_quantity: 100, owner_shop_name: 'Wool Warehouse' }),
  
  // Transportation (Elytra) - High value items
  mockItem({ id: 'item_006', name: 'Normal Elytra', category: 'misc', price_diamonds: 162.00, trading_unit: 'per_item', stock_quantity: 1, owner_shop_name: 'Elytra Emporium', last_verified: '2025-01-01T12:00:00Z', verified_by: 'admin_alex' }),
  mockItem({ id: 'item_007', name: 'Enchanted Elytra', category: 'misc', price_diamonds: 207.00, trading_unit: 'per_item', stock_quantity: 1, owner_shop_name: 'Elytra Emporium', last_verified: '2025-01-01T11:30:00Z', verified_by: 'moderator_notch' }),
  mockItem({ id: 'item_008', name: 'Regular Elytra', category: 'misc', price_diamonds: 252.00, trading_unit: 'per_item', stock_quantity: 1, owner_shop_name: 'Ultimate Gear Shop' }),
  mockItem({ id: 'item_009', name: 'Enchanted Cape', category: 'misc', price_diamonds: 270.00, trading_unit: 'per_item', stock_quantity: 3, owner_shop_name: 'Ultimate Gear Shop' }),
  mockItem({ id: 'item_010', name: 'Mythical Cape', category: 'misc', price_diamonds: 576.00, trading_unit: 'per_item', stock_quantity: 1, owner_shop_name: 'Ultimate Gear Shop' }),
  
  // Weapons
  mockItem({ id: 'item_011', name: 'Epic Blade', category: 'tools', price_diamonds: 270.00, trading_unit: 'per_item', stock_quantity: 2, owner_shop_name: 'Ultimate Gear Shop' }),
  mockItem({ id: 'item_012', name: 'Unbreakable Netherite Sword', category: 'tools', price_diamonds: 126.00, trading_unit: 'per_item', stock_quantity: 2, owner_shop_name: 'Ultimate Gear Shop' }),
  mockItem({ id: 'item_013', name: 'Unbreakable Diamond Sword', category: 'tools', price_diamonds: 126.00, trading_unit: 'per_item', stock_quantity: 0, owner_shop_name: 'Premium Tools & Weapons', is_available: false }),
  mockItem({ id: 'item_014', name: 'Epic Blade Diamond Sword', category: 'tools', price_diamonds: 270.00, trading_unit: 'per_item', stock_quantity: 5, owner_shop_name: 'Premium Tools & Weapons' }),
  mockItem({ id: 'item_015', name: 'Unbreakable Bow', category: 'tools', price_diamonds: 108.00, trading_unit: 'per_item', stock_quantity: 5, owner_shop_name: 'Ultimate Gear Shop' }),
  mockItem({ id: 'item_016', name: 'Unbreakable Crossbow', category: 'tools', price_diamonds: 90.00, trading_unit: 'per_item', stock_quantity: 3, owner_shop_name: 'Ultimate Gear Shop' }),
  
  // Tools
  mockItem({ id: 'item_017', name: 'Unbreakable Diamond Pickaxe', category: 'tools', price_diamonds: 144.00, trading_unit: 'per_item', stock_quantity: 8, owner_shop_name: 'Ultimate Gear Shop' }),
  mockItem({ id: 'item_018', name: 'Unbreakable Netherite Pickaxe', category: 'tools', price_diamonds: 153.00, trading_unit: 'per_item', stock_quantity: 1, owner_shop_name: 'Ultimate Gear Shop' }),
  mockItem({ id: 'item_019', name: 'Unbreakable Diamond Pickaxe Hikoo', category: 'tools', price_diamonds: 153.00, trading_unit: 'per_item', stock_quantity: 10, owner_shop_name: 'Premium Tools & Weapons' }),
  mockItem({ id: 'item_020', name: 'Unbreakable Diamond Shovel', category: 'tools', price_diamonds: 108.00, trading_unit: 'per_item', stock_quantity: 6, owner_shop_name: 'Ultimate Gear Shop' }),
  mockItem({ id: 'item_021', name: 'Unbreakable Netherite Shovel', category: 'tools', price_diamonds: 117.00, trading_unit: 'per_item', stock_quantity: 2, owner_shop_name: 'Ultimate Gear Shop' }),
  mockItem({ id: 'item_022', name: 'Unbreakable Diamond Hoe', category: 'tools', price_diamonds: 72.00, trading_unit: 'per_item', stock_quantity: 3, owner_shop_name: 'Ultimate Gear Shop' }),
  mockItem({ id: 'item_023', name: 'Unbreakable Netherite Hoe', category: 'tools', price_diamonds: 81.00, trading_unit: 'per_item', stock_quantity: 1, owner_shop_name: 'Ultimate Gear Shop' }),
  mockItem({ id: 'item_024', name: 'Unbreakable Diamond Axe', category: 'tools', price_diamonds: 144.00, trading_unit: 'per_item', stock_quantity: 0, owner_shop_name: 'Premium Tools & Weapons', is_available: false }),
  mockItem({ id: 'item_025', name: 'Unbreakable Fishing Rod', category: 'tools', price_diamonds: 45.00, trading_unit: 'per_item', stock_quantity: 0, owner_shop_name: 'Premium Tools & Weapons', is_available: false }),
  
  // Armor
  mockItem({ id: 'item_026', name: 'Champions Full Helm', category: 'armor', price_diamonds: 54.00, trading_unit: 'per_item', stock_quantity: 4, owner_shop_name: 'Ultimate Gear Shop' }),
  mockItem({ id: 'item_027', name: 'Mythical Full Helm', category: 'armor', price_diamonds: 81.00, trading_unit: 'per_item', stock_quantity: 3, owner_shop_name: 'Ultimate Gear Shop' }),
  mockItem({ id: 'item_028', name: 'Explorers Boots', category: 'armor', price_diamonds: 54.00, trading_unit: 'per_item', stock_quantity: 5, owner_shop_name: 'Ultimate Gear Shop' }),
  
  // Food & Consumables
  mockItem({ id: 'item_029', name: 'Golden Apple', category: 'food', price_diamonds: 0.50, trading_unit: 'per_item', stock_quantity: 184, owner_shop_name: 'Nether Materials Co' }),
  
  // Miscellaneous & Special Items
  mockItem({ id: 'item_030', name: 'Sorcerers Stone', category: 'misc', price_diamonds: 234.00, trading_unit: 'per_item', stock_quantity: 2, owner_shop_name: 'Ultimate Gear Shop' }),
  mockItem({ id: 'item_031', name: 'Totem of Undying', category: 'misc', price_diamonds: 90.00, trading_unit: 'per_item', stock_quantity: 3, owner_shop_name: 'Ultimate Gear Shop' }),
  mockItem({ id: 'item_032', name: 'Skeleton Horse Spawn Egg', category: 'misc', price_diamonds: 90.00, trading_unit: 'per_item', stock_quantity: 3, owner_shop_name: 'Ultimate Gear Shop' }),
  mockItem({ id: 'item_033', name: 'Zombie Horse Spawn Egg', category: 'misc', price_diamonds: 90.00, trading_unit: 'per_item', stock_quantity: 6, owner_shop_name: 'Ultimate Gear Shop' }),
  mockItem({ id: 'item_034', name: 'Bee Spawn Egg', category: 'misc', price_diamonds: 5.625, trading_unit: 'per_item', stock_quantity: 4, owner_shop_name: 'Ultimate Gear Shop' }),
  
  // Materials & Crafting
  mockItem({ id: 'item_035', name: 'Amethyst Shards', category: 'misc', price_diamonds: 36.00, trading_unit: 'per_shulker', stock_quantity: 27, owner_shop_name: 'Wood & Amethyst Trader' }),
  mockItem({ id: 'item_036', name: 'Netherite Upgrade Template', category: 'misc', price_diamonds: 6.00, trading_unit: 'per_item', stock_quantity: 167, owner_shop_name: 'Nether Materials Co' }),
  mockItem({ id: 'item_037', name: 'Snout Armor Trim', category: 'misc', price_diamonds: 6.00, trading_unit: 'per_item', stock_quantity: 123, owner_shop_name: 'Nether Materials Co' }),
  mockItem({ id: 'item_038', name: 'Rib Armor Trim', category: 'misc', price_diamonds: 6.00, trading_unit: 'per_item', stock_quantity: 54, owner_shop_name: 'Nether Materials Co' }),
  mockItem({ id: 'item_039', name: 'Chains', category: 'misc', price_diamonds: 2, trading_unit: 'per_stack', stock_quantity: 0, owner_shop_name: 'Nether Materials Co', is_available: false }),
  
  // Enchanted Books
  mockItem({ id: 'item_040', name: 'Mythical Tome', category: 'misc', price_diamonds: 18.00, trading_unit: 'per_item', stock_quantity: 6, owner_shop_name: 'Ultimate Gear Shop' }),
  mockItem({ id: 'item_041', name: 'Soul Speed III Book', category: 'misc', price_diamonds: 8.00, trading_unit: 'per_item', stock_quantity: 44, owner_shop_name: 'Nether Materials Co' }),
  mockItem({ id: 'item_042', name: 'Soul Speed II Book', category: 'misc', price_diamonds: 4.00, trading_unit: 'per_item', stock_quantity: 42, owner_shop_name: 'Nether Materials Co' }),
  mockItem({ id: 'item_043', name: 'Soul Speed I Book', category: 'misc', price_diamonds: 2.00, trading_unit: 'per_item', stock_quantity: 48, owner_shop_name: 'Nether Materials Co' }),
  
  // Wood & Logs (from _Pythos692016) - Set these as jungle biome
  mockItem({ 
    id: 'item_044', 
    name: 'Dark Oak Logs', 
    category: 'blocks', 
    price_diamonds: 18.00, 
    trading_unit: 'per_shulker', 
    stock_quantity: 2, 
    owner_shop_name: 'Wood & Amethyst Trader',
    biome: 'jungle',
    direction: 'south',
    warp_command: '/warp darkoaklogs'
  }),
  mockItem({ 
    id: 'item_045', 
    name: 'Pale Oak Logs', 
    category: 'blocks', 
    price_diamonds: 18.00, 
    trading_unit: 'per_shulker', 
    stock_quantity: 1, 
    owner_shop_name: 'Wood & Amethyst Trader',
    biome: 'jungle',
    direction: 'east',
    warp_command: '/warp paleoaklogs'
  }),
  mockItem({ 
    id: 'item_046', 
    name: 'Oak Logs', 
    category: 'blocks', 
    price_diamonds: 18.00, 
    trading_unit: 'per_shulker', 
    stock_quantity: 1, 
    owner_shop_name: 'Wood & Amethyst Trader',
    biome: 'jungle',
    direction: 'west',
    warp_command: '/warp oaklogs'
  }),
  mockItem({ id: 'item_047', name: 'Cherry Logs', category: 'blocks', price_diamonds: 18.00, trading_unit: 'per_shulker', stock_quantity: 1, owner_shop_name: 'Wood & Amethyst Trader' }),
  mockItem({ id: 'item_048', name: 'Spruce Logs', category: 'blocks', price_diamonds: 18.00, trading_unit: 'per_shulker', stock_quantity: 1, owner_shop_name: 'Wood & Amethyst Trader' }),
  mockItem({ id: 'item_049', name: 'Birch Logs', category: 'blocks', price_diamonds: 18.00, trading_unit: 'per_shulker', stock_quantity: 1, owner_shop_name: 'Wood & Amethyst Trader' }),
  mockItem({ id: 'item_050', name: 'Acacia Logs', category: 'blocks', price_diamonds: 18.00, trading_unit: 'per_shulker', stock_quantity: 1, owner_shop_name: 'Wood & Amethyst Trader' }),
  
  // Special Items & Collectibles - including some lower-priced items for testing
  mockItem({ id: 'item_051', name: 'Cobblestone', category: 'blocks', price_diamonds: 1.0, trading_unit: 'per_stack', stock_quantity: 100, owner_shop_name: 'General Trading Post' }),
  mockItem({ id: 'item_052', name: 'Stone Bricks', category: 'blocks', price_diamonds: 1.5, trading_unit: 'per_stack', stock_quantity: 50, owner_shop_name: 'General Trading Post' }),
  mockItem({ id: 'item_053', name: 'Cooked Beef', category: 'food', price_diamonds: 2.0, trading_unit: 'per_stack', stock_quantity: 25, owner_shop_name: 'General Trading Post' }),
  mockItem({ id: 'item_054', name: 'Bread', category: 'food', price_diamonds: 3.0, trading_unit: 'per_stack', stock_quantity: 30, owner_shop_name: 'General Trading Post' }),
  mockItem({ id: 'item_055', name: 'Glass', category: 'blocks', price_diamonds: 4.0, trading_unit: 'per_stack', stock_quantity: 40, owner_shop_name: 'General Trading Post' })
];

// Helper function to create handlers for both Docker and Dev environments
const createPublicItemsHandler = (baseUrl: string) => {
  return http.get(`${baseUrl}/api/data/public_items`, ({ request }) => {
    const url = new URL(request.url);
    console.log(`🎯 MSW Handler called: ${url.toString()}`);
    
    // Use realistic dataset - all 55 items from 7 shops
    let items = [...REALISTIC_MARKETPLACE_DATA];
    
    // Handle PostgREST query patterns
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset') || '0';
    const order = url.searchParams.get('order');
    const select = url.searchParams.get('select');
    
    // Handle enhanced filtering
    const biome = url.searchParams.get('biome')?.replace('eq.', '');
    const direction = url.searchParams.get('direction')?.replace('eq.', '');
    const category = url.searchParams.get('category')?.replace('eq.', '');
    const nameSearch = url.searchParams.get('name');
    
    // Handle price range filtering
    let minPrice, maxPrice;
    const priceParams = url.searchParams.getAll('price_diamonds');
    for (const priceParam of priceParams) {
      if (priceParam.startsWith('gte.')) {
        minPrice = parseFloat(priceParam.replace('gte.', ''));
      }
      if (priceParam.startsWith('lte.')) {
        maxPrice = parseFloat(priceParam.replace('lte.', ''));
      }
    }
    
    // Handle verification filtering
    const lastVerified = url.searchParams.get('last_verified');
    let verificationFilter = null;
    if (lastVerified === 'not.is.null') {
      verificationFilter = 'verified';
    } else if (lastVerified === 'is.null') {
      verificationFilter = 'unverified';
    }
    
    // Apply filters before ordering
    if (biome) {
      items = items.filter(item => item.biome === biome);
    }
    if (direction) {
      items = items.filter(item => item.direction === direction);
    }
    if (category) {
      items = items.filter(item => item.category === category);
    }
    if (nameSearch && nameSearch.includes('ilike')) {
      const searchTerm = nameSearch.replace('ilike.*', '').replace('*', '').toLowerCase();
      items = items.filter(item => item.name.toLowerCase().includes(searchTerm));
    }
    
    // Apply price range filtering
    if (minPrice !== undefined) {
      items = items.filter(item => item.price_diamonds >= minPrice);
    }
    if (maxPrice !== undefined) {
      items = items.filter(item => item.price_diamonds <= maxPrice);
    }
    
    // Apply verification filtering
    if (verificationFilter === 'verified') {
      items = items.filter(item => item.last_verified != null);
    } else if (verificationFilter === 'unverified') {
      items = items.filter(item => item.last_verified == null);
    }
    
    // Apply ordering
    if (order === 'price_diamonds.desc') {
      items.sort((a, b) => b.price_diamonds - a.price_diamonds);
    } else if (order === 'name.asc') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Apply pagination
    const startIndex = parseInt(offset, 10);
    const limitNum = limit ? parseInt(limit, 10) : items.length;
    items = items.slice(startIndex, startIndex + limitNum);
    
    // Handle select (for counting queries)
    if (select === 'id') {
      return HttpResponse.json(items.map(item => ({ id: item.id })));
    }
    if (select === 'owner_shop_name') {
      return HttpResponse.json(items.map(item => ({ owner_shop_name: item.owner_shop_name })));
    }
    if (select === 'category') {
      return HttpResponse.json(items.map(item => ({ category: item.category })));
    }
    
    return HttpResponse.json(items);
  });
};

// EVERGREEN - PostgREST-style handlers
export const postgrestHandlers = [
  // GET /api/data/public_items - Enhanced endpoint for homepage pagination (both environments)
  createPublicItemsHandler(DEV_BASE_URL),
  createPublicItemsHandler(DOCKER_BASE_URL),

  // GET /api/data/items - Simplified endpoint for API service
  http.get(TEMPORAL_ENDPOINTS.itemsSimple, ({ request }) => {
    const url = new URL(request.url);
    
    // Use realistic dataset for consistency
    let items = [...REALISTIC_MARKETPLACE_DATA];
    
    // Handle PostgREST query patterns
    for (const [key, value] of url.searchParams.entries()) {
      if (value.startsWith('eq.')) {
        const filterValue = value.replace('eq.', '');
        items = items.filter(item => (item as any)[key] === filterValue);
      } else if (value.startsWith('ilike.')) {
        const searchPattern = value.replace('ilike.*', '').replace('*', '');
        items = items.filter(item => 
          item.name.toLowerCase().includes(searchPattern.toLowerCase())
        );
      }
    }
    
    return HttpResponse.json(items);
  }),

  // GET /api/data/listings_with_details - For MarketplaceBrowser component  
  http.get(`${BASE_URL}/api/data/listings_with_details`, () => {
    const listings = [
      {
        listing_id: 123,
        seller_id: 'steve',
        item_id: 'diamond_sword',
        date_created: '2025-01-01T00:00:00Z',
        qty: 5,
        price: 10,
        description: 'Sharp diamond sword',
        is_active: true,
        inventory_unit: 'per_item',
        listing_type: 'sell',
        item_name: 'Diamond Sword',
        seller_name: 'steve',
        stall_id: 'spawn_market_A1'
      }
    ];
    return HttpResponse.json(listings);
  }),

  // Removed duplicate handler - using createPublicItemsHandler above instead

  // POST /api/data/public_items - Create item
  http.post(TEMPORAL_ENDPOINTS.items, async ({ request }) => {
    const body = await request.json() as any;
    const newItem = mockItem({
      id: `item_${Date.now()}`,
      ...body,
      created_at: new Date().toISOString()
    });
    
    return HttpResponse.json(newItem, { status: 201 });
  }),

  // GET /api/data/public_users - List users
  http.get(TEMPORAL_ENDPOINTS.users, ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    
    let users = [mockUser()];
    
    if (limit) {
      users = users.slice(0, parseInt(limit, 10));
    }
    
    return HttpResponse.json(users);
  }),

  // GET /api/data/listings_with_details - Detailed listings view
  http.get(TEMPORAL_ENDPOINTS.listingsWithDetails, ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    
    let listings = [
      {
        id: 'listing_123',
        item_name: 'Diamond Sword',
        category: 'weapons',
        price_diamonds: 5,
        trading_unit: 'per_item',
        stock_quantity: 3,
        server_name: 'Safe Survival',
        shop_name: 'Test Shop',
        owner_username: 'TestUser',
        is_available: true,
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'listing_124',
        item_name: 'Oak Wood',
        category: 'blocks',
        price_diamonds: 0.5,
        trading_unit: 'per_stack',
        stock_quantity: 10,
        server_name: 'Safe Survival',
        shop_name: 'Wood Shop',
        owner_username: 'WoodTrader',
        is_available: true,
        created_at: '2025-01-01T01:00:00Z'
      }
    ];
    
    if (limit) {
      listings = listings.slice(0, parseInt(limit, 10));
    }
    
    return HttpResponse.json(listings);
  }),

  // Health check endpoint
  http.get(TEMPORAL_ENDPOINTS.health, () => {
    return HttpResponse.json({ status: 'healthy', timestamp: new Date().toISOString() });
  })
];

// EVERGREEN - Error response helpers
export const postgrestErrorHandlers = [
  // Simulate validation errors
  http.post('/api/data/public_items', async ({ request }) => {
    const body = await request.json() as any;
    if (!body.owner_id) {
      return HttpResponse.json(
        { message: 'null value in column "owner_id" violates not-null constraint' },
        { status: 400 }
      );
    }
  })
];

export { mockItem, mockUser, REALISTIC_MARKETPLACE_DATA };