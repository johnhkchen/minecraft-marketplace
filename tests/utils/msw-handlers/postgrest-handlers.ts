/**
 * PostgREST API MSW Handlers
 * 
 * Mocks PostgREST API responses for fast testing without infrastructure
 * Based on PostgREST v12.2.0 API patterns and marketplace schema
 */

import { http, HttpResponse } from 'msw';

// Test data factories for consistent, realistic responses
const createTestItem = (overrides = {}) => ({
  id: '1',
  owner_id: 'steve',
  name: 'Diamond Sword',
  category: 'weapons',
  minecraft_id: 'diamond_sword',
  description: 'Sharp diamond sword for combat',
  stock_quantity: 5,
  is_available: true,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  ...overrides
});

const createTestPrice = (overrides = {}) => ({
  id: '1',
  item_id: '1',
  price_diamonds: 25,
  trading_unit: 'per_item',
  is_current: true,
  created_at: '2024-01-15T10:00:00Z',
  ...overrides
});

const createTestUser = (overrides = {}) => ({
  id: 'steve',
  discord_id: '123456789',
  username: 'steve',
  shop_name: 'Steve\'s Diamond Shop',
  role: 'seller',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
});

// Mock data collections
const mockItems = [
  createTestItem(),
  createTestItem({ 
    id: '2', 
    name: 'Diamond Pickaxe', 
    minecraft_id: 'diamond_pickaxe',
    category: 'tools',
    price_diamonds: 30 
  }),
  createTestItem({ 
    id: '3', 
    name: 'Golden Apple', 
    minecraft_id: 'golden_apple',
    category: 'food',
    price_diamonds: 15,
    stock_quantity: 10 
  })
];

const mockPrices = [
  createTestPrice(),
  createTestPrice({ id: '2', item_id: '2', price_diamonds: 30 }),
  createTestPrice({ id: '3', item_id: '3', price_diamonds: 15 })
];

const mockUsers = [
  createTestUser(),
  createTestUser({ 
    id: 'alex', 
    username: 'alex', 
    shop_name: 'Alex\'s Redstone Emporium',
    discord_id: '987654321' 
  })
];

// PostgREST API handlers
export const postgrestHandlers = [
  // Items API
  http.get('http://localhost:3000/api/data/public_items', ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');

    let filteredItems = [...mockItems];

    // Apply category filter
    if (category && category !== 'eq.') {
      const categoryValue = category.replace('eq.', '');
      filteredItems = filteredItems.filter(item => item.category === categoryValue);
    }

    // Apply search filter (PostgREST ilike pattern)
    if (search) {
      const searchValue = search.toLowerCase().replace('ilike.%', '').replace('%', '');
      filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(searchValue) ||
        item.description.toLowerCase().includes(searchValue)
      );
    }

    // Apply pagination
    const limitNum = parseInt(limit || '10');
    const offsetNum = parseInt(offset || '0');
    const paginatedItems = filteredItems.slice(offsetNum, offsetNum + limitNum);

    // PostgREST headers
    const headers = {
      'Content-Range': `0-${paginatedItems.length - 1}/${filteredItems.length}`,
      'Content-Type': 'application/json'
    };

    return HttpResponse.json(paginatedItems, { headers });
  }),

  http.get('http://localhost:3000/api/data/items', ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (id && id.startsWith('eq.')) {
      const itemId = id.replace('eq.', '');
      const item = mockItems.find(i => i.id === itemId);
      return item ? HttpResponse.json([item]) : HttpResponse.json([]);
    }
    
    return HttpResponse.json(mockItems);
  }),

  http.post('http://localhost:3000/api/data/items', async ({ request }) => {
    const newItem = await request.json() as any;
    const item = createTestItem({
      id: String(mockItems.length + 1),
      ...newItem,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    mockItems.push(item);
    
    return HttpResponse.json(item, { 
      status: 201,
      headers: { 
        'Location': `/items?id=eq.${item.id}`,
        'Content-Type': 'application/json'
      }
    });
  }),

  http.patch('http://localhost:3000/api/data/items', async ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const updates = await request.json() as any;
    
    if (id && id.startsWith('eq.')) {
      const itemId = id.replace('eq.', '');
      const itemIndex = mockItems.findIndex(i => i.id === itemId);
      
      if (itemIndex !== -1) {
        mockItems[itemIndex] = {
          ...mockItems[itemIndex],
          ...updates,
          updated_at: new Date().toISOString()
        };
        
        return HttpResponse.json(mockItems[itemIndex]);
      }
    }
    
    return HttpResponse.json({ error: 'Item not found' }, { status: 404 });
  }),

  // Prices API
  http.get('http://localhost:3000/api/data/prices', ({ request }) => {
    const url = new URL(request.url);
    const itemId = url.searchParams.get('item_id');
    const isCurrent = url.searchParams.get('is_current');
    
    let filteredPrices = [...mockPrices];
    
    if (itemId && itemId.startsWith('eq.')) {
      const id = itemId.replace('eq.', '');
      filteredPrices = filteredPrices.filter(p => p.item_id === id);
    }
    
    if (isCurrent && isCurrent.startsWith('eq.')) {
      const current = isCurrent.replace('eq.', '') === 'true';
      filteredPrices = filteredPrices.filter(p => p.is_current === current);
    }
    
    return HttpResponse.json(filteredPrices);
  }),

  http.post('http://localhost:3000/api/data/prices', async ({ request }) => {
    const newPrice = await request.json() as any;
    const price = createTestPrice({
      id: String(mockPrices.length + 1),
      ...newPrice,
      created_at: new Date().toISOString()
    });
    
    mockPrices.push(price);
    
    return HttpResponse.json(price, { 
      status: 201,
      headers: { 
        'Content-Type': 'application/json'
      }
    });
  }),

  // Users API
  http.get('http://localhost:3000/api/data/users', ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (id && id.startsWith('eq.')) {
      const userId = id.replace('eq.', '');
      const user = mockUsers.find(u => u.id === userId);
      return user ? HttpResponse.json([user]) : HttpResponse.json([]);
    }
    
    return HttpResponse.json(mockUsers);
  }),

  // Schema introspection (PostgREST feature)
  http.get('http://localhost:3000/api/data/', () => {
    return HttpResponse.json({
      paths: {
        '/items': { 
          get: { summary: 'Items table' },
          post: { summary: 'Create item' }
        },
        '/prices': { 
          get: { summary: 'Prices table' },
          post: { summary: 'Create price' }
        },
        '/users': { 
          get: { summary: 'Users table' }
        }
      }
    });
  }),

  // Alternative endpoints (nginx proxy routes)
  http.get('http://localhost:2888/api/data/*', ({ request }) => {
    // Forward to main handler by rewriting URL
    const originalUrl = new URL(request.url);
    const newUrl = originalUrl.pathname.replace('/api/data', '');
    const forwardedRequest = new Request(`http://localhost:3000/api/data${newUrl}${originalUrl.search}`, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    
    // Find matching handler and execute
    const matchingHandler = postgrestHandlers.find(handler => 
      handler.info.path === `http://localhost:3000/api/data${newUrl}`
    );
    
    if (matchingHandler) {
      return matchingHandler.resolver({ request: forwardedRequest } as any);
    }
    
    return HttpResponse.json({ error: 'Not found' }, { status: 404 });
  }),

  // Health check endpoint
  http.get('http://localhost:3000/health', () => {
    return HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  }),

  // Error simulation handlers for testing error handling
  http.get('http://localhost:3000/api/data/error-test', () => {
    return HttpResponse.json({ error: 'Simulated error' }, { status: 500 });
  }),

  http.get('http://localhost:3000/api/data/timeout-test', () => {
    return new Promise(() => {}); // Never resolves (timeout simulation)
  }),

  // Catch-all handler for unmocked endpoints (return 404)
  http.get('http://localhost:3000/api/*', ({ request }) => {
    const url = new URL(request.url);
    console.log(`[MSW] Unhandled request: ${url.pathname}`);
    return HttpResponse.json({ error: 'Not found' }, { status: 404 });
  }),

  http.post('http://localhost:3000/api/*', ({ request }) => {
    const url = new URL(request.url);
    console.log(`[MSW] Unhandled POST request: ${url.pathname}`);
    return HttpResponse.json({ error: 'Not found' }, { status: 404 });
  })
];

// Factory functions for test-specific data
export const createMockItem = createTestItem;
export const createMockPrice = createTestPrice;
export const createMockUser = createTestUser;

// Data reset utilities for test isolation
export const resetMockData = () => {
  mockItems.length = 0;
  mockItems.push(
    createTestItem(),
    createTestItem({ 
      id: '2', 
      name: 'Diamond Pickaxe', 
      minecraft_id: 'diamond_pickaxe',
      category: 'tools',
      price_diamonds: 30 
    }),
    createTestItem({ 
      id: '3', 
      name: 'Golden Apple', 
      minecraft_id: 'golden_apple',
      category: 'food',
      price_diamonds: 15,
      stock_quantity: 10 
    })
  );
  
  mockPrices.length = 0;
  mockPrices.push(
    createTestPrice(),
    createTestPrice({ id: '2', item_id: '2', price_diamonds: 30 }),
    createTestPrice({ id: '3', item_id: '3', price_diamonds: 15 })
  );
  
  mockUsers.length = 0;
  mockUsers.push(
    createTestUser(),
    createTestUser({ 
      id: 'alex', 
      username: 'alex', 
      shop_name: 'Alex\'s Redstone Emporium',
      discord_id: '987654321' 
    })
  );
};