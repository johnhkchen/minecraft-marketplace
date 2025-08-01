/**
 * PostgREST Mock Handlers using MSW
 * 
 * Provides fast, isolated API mocking for unit tests without infrastructure dependency.
 * Follows PostgREST REST API patterns for realistic testing.
 */

import { http, HttpResponse } from 'msw';

// TEMPORAL CONFIG - Update for your project's endpoints
const BASE_URL = 'http://localhost:3000';
const TEMPORAL_ENDPOINTS = {
  items: `${BASE_URL}/api/data/public_items`,
  users: `${BASE_URL}/api/data/public_users`,
  prices: `${BASE_URL}/api/data/public_prices`,
  health: `${BASE_URL}/api/health`
};

// EVERGREEN - Mock data factories following PostgREST response format
const mockItem = (overrides = {}) => ({
  id: 'item_123',
  owner_id: 'user_123',
  name: 'Diamond Sword',
  category: 'weapons',
  stock_quantity: 5,
  is_available: true,
  created_at: '2025-01-01T00:00:00Z',
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

// EVERGREEN - PostgREST-style handlers
export const postgrestHandlers = [
  // GET /api/data/public_items - List items with query support
  http.get(TEMPORAL_ENDPOINTS.items, ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const name = url.searchParams.get('name');
    
    let items = [
      mockItem(),
      mockItem({ id: 'item_456', name: 'Iron Sword', category: 'weapons' }),
      mockItem({ id: 'item_789', name: 'Diamond Pickaxe', category: 'tools' })
    ];
    
    // Filter by name if provided (PostgREST eq filter)
    if (name && name.startsWith('eq.')) {
      const searchName = name.replace('eq.', '');
      items = items.filter(item => item.name === searchName);
    }
    
    // Limit results if provided
    if (limit) {
      items = items.slice(0, parseInt(limit, 10));
    }
    
    return HttpResponse.json(items);
  }),

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

  // Health check endpoint
  http.get(TEMPORAL_ENDPOINTS.health, () => {
    return HttpResponse.json({ status: 'healthy', timestamp: new Date().toISOString() });
  })
];

// EVERGREEN - Error response helpers
export const postgrestErrorHandlers = [
  // Simulate PostgREST 404 for non-existent items
  http.get('/api/data/public_items', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('name') === 'eq.NonExistent') {
      return HttpResponse.json([], { status: 200 }); // PostgREST returns empty array, not 404
    }
  }),

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

export { mockItem, mockUser };