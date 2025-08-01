/**
 * Fast Test Setup - Universal Speed Optimization
 * 
 * Provides fast MSW mocking and data factories for all test types.
 * Reduces test execution from minutes to milliseconds.
 */

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { beforeAll, afterEach, afterAll, expect } from 'vitest';
import './auto-environment-guard.js'; // Auto-activate environment protection for fast tests

// CONFIGURABLE - Update endpoints for your project
const TEST_ENDPOINTS = {
  items: 'http://localhost:3000/api/data/public_items',
  itemsDocker: 'http://localhost:7410/api/data/public_items', // Docker environment
  users: 'http://localhost:3000/api/data/public_users', 
  reports: 'http://localhost:3000/api/data/public_community_reports',
  prices: 'http://localhost:3000/api/data/public_prices',
  health: 'http://localhost:3000/api/health',
  discord: {
    token: 'https://discord.com/api/oauth2/token',
    user: 'https://discord.com/api/users/@me',
    webhook: 'https://discord.com/api/webhooks/test/webhook'
  }
};

// CONFIGURABLE - Update test data for your project  
const TEST_DATA = {
  userId: 'steve',
  itemId: 'minecraft:diamond_sword', 
  reportId: '789',
  shopName: 'Steve\'s Diamond Shop',
  itemName: 'Diamond Sword',
  serverId: 'Safe Survival'
};

// Performance measurement utility (evolved from search-performance.evolved.test.ts)
export const measure = async <T>(
  operation: () => T | Promise<T>
): Promise<{ result: T; timeMs: number }> => {
  const startTime = performance.now();
  const result = await operation();
  const timeMs = performance.now() - startTime;
  return { result, timeMs };
};

// Epic 1 requirement validator (evolved from search-performance.evolved.test.ts)
export const expectEpic1Performance = (timeMs: number, requirement: 'search' | 'filter' | 'api') => {
  const limits = {
    search: 2000,  // <2s search requirement
    filter: 500,   // <500ms filtering requirement  
    api: 200       // <200ms API requirement
  };
  
  const limit = limits[requirement];
  expect(timeMs).toBeLessThan(limit);
};

// Fast test performance validator
export const expectFastExecution = (timeMs: number, maxMs: number) => {
  expect(timeMs).toBeLessThan(maxMs);
};

// Result quality validator (evolved from search-performance.evolved.test.ts)
export const expectQualityResults = (results: any[], searchTerm?: string, minResults = 0) => {
  expect(Array.isArray(results)).toBe(true);
  expect(results.length).toBeGreaterThanOrEqual(minResults);
  
  if (searchTerm && results.length > 0) {
    const relevantResults = results.filter(item => 
      item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    expect(relevantResults.length).toBeGreaterThan(0);
  }
};

// Fast data factories - create test data instantly
export const fastUser = (overrides = {}) => ({
  id: '123', // PostgREST needs numeric ID
  discord_id: '123456789012345678',
  username: TEST_DATA.userId, // Minecraft username
  shop_name: TEST_DATA.shopName,
  role: 'user',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  ...overrides
});

export const fastItem = (overrides = {}) => ({
  id: '456', // PostgREST needs numeric ID  
  owner_id: TEST_DATA.userId, // Minecraft username
  owner_username: TEST_DATA.userId, // For seller_name mapping
  name: TEST_DATA.itemName,
  minecraft_id: TEST_DATA.itemId, // Canonical Minecraft item ID
  category: 'weapons',
  stock_quantity: 5,
  is_available: true,
  server_name: TEST_DATA.serverId,
  shop_location: 'spawn_market',
  price_diamonds: 2.5,
  created_at: '2025-01-01T00:00:00Z',
  ...overrides
});

export const fastPrice = (overrides = {}) => ({
  id: `${Date.now()}`,
  item_id: '456', // PostgREST numeric ID
  price_diamonds: 2.5,
  trading_unit: 'per_item',
  is_current: true,
  created_by: TEST_DATA.userId, // Minecraft username
  created_at: '2025-01-01T00:00:00Z',
  ...overrides
});

export const fastReport = (overrides = {}) => ({
  id: TEST_DATA.reportId,
  item_id: '456', // PostgREST numeric ID
  reporter_id: TEST_DATA.userId, // Minecraft username
  report_type: 'price_change',
  description: 'Price changed from 2.0 to 2.5 diamonds',
  status: 'pending',
  confidence_level: 'medium',
  auto_approved: false,
  created_at: '2025-01-01T00:00:00Z',
  ...overrides
});

// Import realistic dataset from postgrest-handlers
import { REALISTIC_MARKETPLACE_DATA } from '../mocks/postgrest-handlers.js';

// Import Valkey mocking for fast tests
import { getMockValkeyService, resetMockValkey } from '../mocks/valkey-mock.js';
// Note: The correct import would need to be dynamic in tests since the paths are complex
// Let's handle this differently by making the mock work without path issues

// Helper function to create items handler for any URL
const createItemsHandler = (endpoint: string) => {
  return http.get(endpoint, ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset') || '0';
    const order = url.searchParams.get('order');
    const select = url.searchParams.get('select');
    
    // Handle PostgREST ilike search: name=ilike.*diamond*
    const nameIlike = url.searchParams.get('name');
    const search = nameIlike?.startsWith('ilike.') ? 
      nameIlike.slice(6).replace(/\*/g, '').toLowerCase() : 
      nameIlike?.toLowerCase();
    const category = url.searchParams.get('category')?.replace('eq.', '');
    const serverName = url.searchParams.get('server_name')?.replace('eq.', '');
    
    // Handle multiple price_diamonds parameters correctly
    let minPrice, maxPrice;
    const priceParams = url.searchParams.getAll('price_diamonds');
    for (const priceParam of priceParams) {
      if (priceParam.startsWith('gte.')) {
        minPrice = priceParam.match(/gte\.(\d+\.?\d*)/)?.[1];
      }
      if (priceParam.startsWith('lte.')) {
        maxPrice = priceParam.match(/lte\.(\d+\.?\d*)/)?.[1];
      }
    }
    
    // Use realistic dataset - all 55 items from 7 shops
    let items = [...REALISTIC_MARKETPLACE_DATA];
    
    // Apply ordering
    if (order === 'price_diamonds.desc') {
      items.sort((a, b) => b.price_diamonds - a.price_diamonds);
    } else if (order === 'name.asc') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Apply filters
    if (search) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(search) ||
        item.minecraft_id?.toLowerCase().includes(search)
      );
    }
    if (category) {
      items = items.filter(item => item.category === category);
    }
    if (serverName) {
      items = items.filter(item => item.server_name === serverName);
    }
    if (minPrice) {
      items = items.filter(item => item.price_diamonds >= parseFloat(minPrice));
    }
    if (maxPrice) {
      items = items.filter(item => item.price_diamonds <= parseFloat(maxPrice));
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

// Fast API handlers - respond instantly with no network calls
const fastHandlers = [
  // Items API with filtering support (both development and docker environments)
  createItemsHandler(TEST_ENDPOINTS.items),
  createItemsHandler(TEST_ENDPOINTS.itemsDocker),

  http.post(TEST_ENDPOINTS.items, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json(fastItem({ ...body, id: `${Date.now()}` }), { status: 201 });
  }),

  // Users API
  http.get(TEST_ENDPOINTS.users, () => {
    return HttpResponse.json([
      fastUser(),
      fastUser({ id: '124', username: 'alex', shop_name: 'Alex\'s Tool Shop' }),
      fastUser({ id: '125', username: 'notch', shop_name: 'Notch\'s Rare Items' })
    ]);
  }),

  http.post(TEST_ENDPOINTS.users, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json(fastUser({ ...body, id: `${Date.now()}` }), { status: 201 });
  }),

  // Reports API
  http.get(TEST_ENDPOINTS.reports, () => {
    return HttpResponse.json([fastReport()]);
  }),

  http.post(TEST_ENDPOINTS.reports, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json(fastReport({ ...body, id: `report_${Date.now()}` }), { status: 201 });
  }),

  // Prices API
  http.get(TEST_ENDPOINTS.prices, () => {
    return HttpResponse.json([fastPrice()]);    
  }),

  // Health check
  http.get(TEST_ENDPOINTS.health, () => {
    return HttpResponse.json({ status: 'healthy', timestamp: new Date().toISOString() });
  }),

  // Discord OAuth
  http.post(TEST_ENDPOINTS.discord.token, () => {
    return HttpResponse.json({
      access_token: 'mock_discord_token',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'mock_refresh_token',
      scope: 'identify email'
    });
  }),

  http.get(TEST_ENDPOINTS.discord.user, () => {
    return HttpResponse.json({
      id: '123456789012345678',
      username: 'testuser',
      discriminator: '1234',
      avatar: 'avatar_hash',
      email: 'test@example.com',
      verified: true
    });
  }),

  // Discord Webhooks
  http.post(TEST_ENDPOINTS.discord.webhook, () => {
    return HttpResponse.json({}, { status: 204 });
  }),

  // Listings with details endpoint for MarketplaceBrowser component
  http.get('http://localhost:3000/api/data/listings_with_details', ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    
    let listings = [
      {
        listing_id: 123,
        seller_id: TEST_DATA.userId,
        seller_name: TEST_DATA.userId,
        item_id: TEST_DATA.itemId,
        item_name: 'Diamond Sword',
        category: 'weapons',
        price: 5.0,
        price_diamonds: 5.0,
        trading_unit: 'per_item',
        qty: 3,
        stock_quantity: 3,
        server_name: TEST_DATA.serverId,
        shop_name: 'Test Shop',
        is_active: true,
        date_created: '2025-01-01T00:00:00Z'
      },
      {
        listing_id: 124,
        seller_id: 'alex',
        seller_name: 'alex',
        item_id: 'minecraft:oak_wood',
        item_name: 'Oak Wood',
        category: 'blocks',
        price: 0.5,
        price_diamonds: 0.5,
        trading_unit: 'per_stack',
        qty: 10,
        stock_quantity: 10,
        server_name: 'Safe Survival',
        shop_name: 'Wood Shop',
        is_active: true,
        date_created: '2025-01-01T01:00:00Z'
      }
    ];
    
    if (limit) {
      listings = listings.slice(0, parseInt(limit, 10));
    }
    
    return HttpResponse.json(listings);
  }),

  // Items endpoint for search/filter operations - handle any query parameters
  http.get('http://localhost:3000/api/data/items', ({ request }) => {
    const url = new URL(request.url);
    
    // Handle PostgREST select and distinct queries
    const select = url.searchParams.get('select');
    const distinct = url.searchParams.get('distinct');
    
    // Extract search/filter parameters (ignoring malformed duplicates)
    const nameFilter = url.searchParams.get('name');
    const categoryFilter = url.searchParams.get('category');
    const serverFilter = url.searchParams.get('server_name');
    
    // Handle multiple price_diamonds parameters correctly
    let minPrice, maxPrice;
    const priceParams = url.searchParams.getAll('price_diamonds');
    for (const priceParam of priceParams) {
      if (priceParam.startsWith('gte.')) {
        minPrice = priceParam.match(/gte\.(\d+\.?\d*)/)?.[1];
      }
      if (priceParam.startsWith('lte.')) {
        maxPrice = priceParam.match(/lte\.(\d+\.?\d*)/)?.[1];
      }
    }
    
    // Use realistic dataset - all 55 items from 7 shops
    let items = [...REALISTIC_MARKETPLACE_DATA];
    
    // Apply filters
    if (nameFilter && nameFilter.includes('ilike')) {
      const searchTerm = nameFilter.match(/ilike\.\*([^*]+)\*/)?.[1]?.toLowerCase();
      if (searchTerm) {
        items = items.filter(item => item.name.toLowerCase().includes(searchTerm));
      }
    }
    
    if (categoryFilter && categoryFilter.includes('eq.')) {
      const category = categoryFilter.replace('eq.', '');
      items = items.filter(item => item.category === category);
    }
    
    if (serverFilter && serverFilter.includes('eq.')) {
      const server = serverFilter.replace('eq.', '');
      items = items.filter(item => item.server_name === server);
    }
    
    if (minPrice) {
      items = items.filter(item => item.price_diamonds >= parseFloat(minPrice));
    }
    
    if (maxPrice) {
      items = items.filter(item => item.price_diamonds <= parseFloat(maxPrice));
    }
    
    // Handle PostgREST select and distinct queries
    if (select === 'server_name' && distinct === 'server_name') {
      // Return unique server names only
      const uniqueServers = Array.from(new Set(items.map(item => item.server_name)))
        .filter(Boolean)
        .map(server_name => ({ server_name }));
      return HttpResponse.json(uniqueServers);
    }
    
    return HttpResponse.json(items);
  })
];

// MSW server for universal fast testing
const fastServer = setupServer(...fastHandlers);

// Universal setup - use in any test file
export const setupFastTests = () => {
  beforeAll(async () => {
    fastServer.listen({ onUnhandledRequest: 'warn' });
    
    // Initialize mock Valkey service for fast tests
    const mockValkey = getMockValkeyService();
    await mockValkey.connect();
    
    // Set up environment variable to indicate test mode for Valkey mocking
    process.env.VITEST = 'true';
    process.env.NODE_ENV = 'test';
    
    // Use dynamic import to set the mock after environment is set
    try {
      const { setMockValkeyService } = await import('../../workspaces/shared/services/valkey-cache.js');
      setMockValkeyService(mockValkey);
      console.log('🧪 Mock Valkey service configured for tests');
    } catch (error) {
      console.log('⚠️ Could not set mock Valkey service, tests will use fallback behavior');
    }
  });

  afterEach(() => {
    fastServer.resetHandlers();
    // Reset Valkey cache between tests to prevent interference
    resetMockValkey();
  });

  afterAll(async () => {
    fastServer.close();
    // Cleanup mock Valkey service
    await getMockValkeyService().disconnect();
    
    try {
      const { setMockValkeyService } = await import('../../workspaces/shared/services/valkey-cache.js');
      setMockValkeyService(null);
    } catch (error) {
      // Ignore cleanup errors
    }
  });
};

// Additional performance utilities
export const measureSync = <T>(operation: () => T): { result: T; timeMs: number } => {
  const start = performance.now();
  const result = operation();
  const timeMs = performance.now() - start;
  return { result, timeMs };
};

// Batch operations for efficiency
export const batchValidate = (validators: Array<() => boolean>) => {
  return validators.every(validator => validator());
};

// Test data builders for complex scenarios
export class FastTestBuilder {
  static marketplaceScenario() {
    return {
      shopOwner: fastUser({ 
        id: '200', 
        username: 'diamond_merchant', 
        role: 'shop_owner', 
        shop_name: 'Diamond District' 
      }),
      items: [
        fastItem({ 
          id: '300',
          name: 'Diamond Sword', 
          minecraft_id: 'minecraft:diamond_sword',
          owner_id: 'diamond_merchant',
          price_diamonds: 3.0 
        }),
        fastItem({ 
          id: '301',
          name: 'Diamond Pickaxe', 
          minecraft_id: 'minecraft:diamond_pickaxe',
          owner_id: 'diamond_merchant',
          category: 'tools',
          price_diamonds: 4.5 
        }),
        fastItem({ 
          id: '302',
          name: 'Diamond Chestplate', 
          minecraft_id: 'minecraft:diamond_chestplate',
          owner_id: 'diamond_merchant',
          category: 'armor',
          price_diamonds: 10.0 
        })
      ],
      customers: [
        fastUser({ id: '201', username: 'mining_steve' }),
        fastUser({ id: '202', username: 'pvp_alex' })
      ]
    };
  }

  static reportingScenario() {
    return {
      reporter: fastUser({ id: '203', username: 'price_watcher' }),
      trustedReporter: fastUser({ id: '204', username: 'market_mod' }),
      item: fastItem(),
      priceReport: fastReport({ 
        report_type: 'price_change',
        reporter_id: 'price_watcher' 
      }),
      stockReport: fastReport({ 
        report_type: 'stock_update',
        reporter_id: 'market_mod' 
      })
    };
  }

  static discordScenario() {
    return {
      discordUser: {
        id: '123456789012345678',
        username: 'minecraft_trader',
        discriminator: '1234',
        email: 'trader@hermitcraft.com'
      },
      tokens: {
        access_token: 'discord_access_token',
        refresh_token: 'discord_refresh_token'
      },
      webhook: 'https://discord.com/api/webhooks/test/webhook'
    };
  }
}