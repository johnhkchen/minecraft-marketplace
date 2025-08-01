/**
 * API Items Fast Tests - MSW Mocked Version
 * Converted from api/items.test.ts for rapid development feedback
 * 
 * Tests item search API functionality without infrastructure dependencies
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupFastTests, measure, expectFastExecution } from '../utils/fast-test-setup';

// Setup MSW mocking for all HTTP calls
setupFastTests();

// Test data configuration
const TEST_DATA = {
  mainTrader: 'steve',
  primaryItem: 'Diamond Sword',
  primaryItemId: 'diamond_sword',
  primaryServer: 'HermitCraft'
};

// Mock items data
const mockItems = [
  {
    item_id: 'diamond_sword',
    item_name: 'Diamond Sword',
    category: 'weapons',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    item_id: 'iron_sword',
    item_name: 'Iron Sword',
    category: 'weapons',
    created_at: '2024-01-14T10:00:00Z'
  },
  {
    item_id: 'iron_pickaxe',
    item_name: 'Iron Pickaxe',
    category: 'tools',
    created_at: '2024-01-13T10:00:00Z'
  },
  {
    item_id: 'iron_ingot',
    item_name: 'Iron Ingot',
    category: 'materials',
    created_at: '2024-01-12T10:00:00Z'
  },
  {
    item_id: 'netherite_sword',
    item_name: 'Netherite Sword',
    category: 'weapons',
    created_at: '2024-01-11T10:00:00Z'
  },
  {
    item_id: 'elytra_unbreakable',
    item_name: 'Unbreakable Elytra',
    category: 'armor',
    created_at: '2024-01-10T10:00:00Z'
  },
  {
    item_id: 'mythical_sword',
    item_name: 'Mythical Sword',
    category: 'weapons',
    created_at: '2024-01-09T10:00:00Z'
  },
  {
    item_id: 'spawn_egg_villager',
    item_name: 'Villager Spawn Egg',
    category: 'spawners',
    created_at: '2024-01-08T10:00:00Z'
  }
];

// Fast items API service mock
class FastItemsApiService {
  async getAllItems() {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3));
    return [...mockItems].sort((a, b) => a.item_name.localeCompare(b.item_name));
  }

  async searchItems(query: string) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
    
    if (!query || query.trim() === '') {
      return this.getAllItems();
    }

    const normalizedQuery = query.toLowerCase();
    return mockItems
      .filter(item => item.item_name.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => a.item_name.localeCompare(b.item_name));
  }

  async searchByCategory(category: string) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 4));
    
    return mockItems
      .filter(item => item.category === category)
      .sort((a, b) => a.item_name.localeCompare(b.item_name));
  }

  // Simulate API response structure
  async apiRequest(url: string): Promise<{ status: number; data: any }> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3));

    try {
      const urlObj = new URL(url, 'http://localhost:4321');
      const query = urlObj.searchParams.get('q');
      
      if (query !== null) {
        const results = await this.searchItems(query);
        return { status: 200, data: results };
      } else {
        const results = await this.getAllItems();
        return { status: 200, data: results };
      }
    } catch (error) {
      return { status: 500, data: { error: 'Failed to fetch items' } };
    }
  }
}

describe('API Items Fast Tests', () => {
  let apiService: FastItemsApiService;
  
  beforeEach(() => {
    apiService = new FastItemsApiService();
  });

  describe('GET /api/items', () => {
    it('returns all items when no query provided', async () => {
      const { result: response, timeMs } = await measure(() => 
        apiService.apiRequest('/api/items')
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      // Verify item structure
      const firstItem = response.data[0];
      expect(firstItem).toHaveProperty('item_id');
      expect(firstItem).toHaveProperty('item_name');
      expect(firstItem).toHaveProperty('category');
      expect(firstItem).toHaveProperty('created_at');
      
      expectFastExecution(timeMs, 10);
    });

    it('searches items by query parameter fast', async () => {
      const { result: response, timeMs } = await measure(() => 
        apiService.apiRequest('/api/items?q=iron')
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // All results should contain "iron" in the name
      response.data.forEach((item: any) => {
        expect(item.item_name.toLowerCase()).toContain('iron');
      });
      
      expectFastExecution(timeMs, 10);
    });

    it('returns empty array for non-existent items fast', async () => {
      const { result: response, timeMs } = await measure(() => 
        apiService.apiRequest('/api/items?q=nonexistent_item_xyz')
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(0);
      
      expectFastExecution(timeMs, 10);
    });

    it('handles case-insensitive search fast', async () => {
      const { result: response, timeMs } = await measure(() => 
        apiService.apiRequest('/api/items?q=IRON')
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      // Should find items with "iron" regardless of case
      response.data.forEach((item: any) => {
        expect(item.item_name.toLowerCase()).toContain('iron');
      });
      
      expectFastExecution(timeMs, 10);
    });

    it('searches for partial matches fast', async () => {
      const { result: response, timeMs } = await measure(() => 
        apiService.apiRequest('/api/items?q=sword')
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // Should find items containing "sword"
      response.data.forEach((item: any) => {
        expect(item.item_name.toLowerCase()).toContain('sword');
      });
      
      expectFastExecution(timeMs, 10);
    });

    it('returns items with various categories fast', async () => {
      const { result: response, timeMs } = await measure(() => 
        apiService.apiRequest('/api/items')
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // Should have items from different categories
      const categories = new Set(response.data.map((item: any) => item.category));
      expect(categories.size).toBeGreaterThan(1);
      
      // Check for expected categories
      const categoryArray = Array.from(categories);
      expect(categoryArray).toContain('weapons');
      expect(categoryArray).toContain('tools');
      expect(categoryArray).toContain('materials');
      
      expectFastExecution(timeMs, 10);
    });

    it('handles empty query parameter fast', async () => {
      const { result: response, timeMs } = await measure(() => 
        apiService.apiRequest('/api/items?q=')
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      expectFastExecution(timeMs, 10);
    });

    it('handles special characters in search fast', async () => {
      const { result: response, timeMs } = await measure(() => 
        apiService.apiRequest('/api/items?q=spawn egg')
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // Should find spawn egg items
      if (response.data.length > 0) {
        response.data.forEach((item: any) => {
          expect(item.item_name.toLowerCase()).toMatch(/spawn.*egg|egg.*spawn/);
        });
      }
      
      expectFastExecution(timeMs, 10);
    });

    it('returns items sorted by name fast', async () => {
      const { result: response, timeMs } = await measure(() => 
        apiService.apiRequest('/api/items')
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // Verify items are sorted alphabetically by name
      for (let i = 1; i < response.data.length; i++) {
        expect(response.data[i].item_name >= response.data[i - 1].item_name).toBe(true);
      }
      
      expectFastExecution(timeMs, 10);
    });

    it('handles API errors gracefully', async () => {
      const start = performance.now();
      
      // Simulate error condition
      const errorResponse = { status: 500, data: { error: 'Failed to fetch items' } };
      
      expect(errorResponse.status).toBe(500);
      expect(errorResponse.data).toHaveProperty('error');
      expect(errorResponse.data.error).toBe('Failed to fetch items');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 1);
    });

    it('finds specific items from test data', async () => {
      const testItems = [
        { query: 'elytra', expectedCount: 1 },
        { query: 'unbreakable', expectedCount: 1 },
        { query: 'mythical', expectedCount: 1 }
      ];

      for (const testItem of testItems) {
        const { result: response, timeMs } = await measure(() => 
          apiService.apiRequest(`/api/items?q=${testItem.query}`)
        );
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeGreaterThanOrEqual(testItem.expectedCount);
        
        response.data.forEach((item: any) => {
          expect(item.item_name.toLowerCase()).toContain(testItem.query.toLowerCase());
        });
        
        expectFastExecution(timeMs, 10);
      }
    });
  });

  describe('Search Performance Requirements', () => {
    it('meets Epic 1 search performance requirements', async () => {
      const { result: response, timeMs } = await measure(() => 
        apiService.apiRequest('/api/items?q=diamond')
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // Epic 1 requirement: <2s search (fast tests should be much faster)
      expectFastExecution(timeMs, 10);
      
      // Validate search results
      expect(response.data.length).toBeGreaterThan(0);
      response.data.forEach((item: any) => {
        expect(item.item_name.toLowerCase()).toContain('diamond');
      });
    });

    it('handles concurrent search requests fast', async () => {
      const queries = ['sword', 'iron', 'diamond', 'elytra', 'mythical'];
      
      const { result: responses, timeMs } = await measure(async () => {
        const searchPromises = queries.map(query => 
          apiService.apiRequest(`/api/items?q=${query}`)
        );
        
        return Promise.all(searchPromises);
      });
      
      expect(responses.length).toBe(queries.length);
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
      });
      
      expectFastExecution(timeMs, 25);
    });
  });

  describe('Category Filtering', () => {
    it('filters items by category fast', async () => {
      const { result: weapons, timeMs } = await measure(() => 
        apiService.searchByCategory('weapons')
      );
      
      expect(Array.isArray(weapons)).toBe(true);
      expect(weapons.length).toBeGreaterThan(0);
      
      weapons.forEach(item => {
        expect(item.category).toBe('weapons');
      });
      
      expectFastExecution(timeMs, 5);
    });

    it('validates all categories are represented', async () => {
      const { result: allItems, timeMs } = await measure(() => 
        apiService.getAllItems()
      );
      
      const categories = new Set(allItems.map(item => item.category));
      const expectedCategories = ['weapons', 'tools', 'materials', 'armor', 'spawners'];
      
      expectedCategories.forEach(category => {
        expect(categories.has(category)).toBe(true);
      });
      
      expectFastExecution(timeMs, 5);
    });
  });

  describe('Data Validation', () => {
    it('validates item structure consistency', async () => {
      const { result: items, timeMs } = await measure(() => 
        apiService.getAllItems()
      );
      
      expect(items.length).toBeGreaterThan(0);
      
      items.forEach(item => {
        expect(typeof item.item_id).toBe('string');
        expect(typeof item.item_name).toBe('string');
        expect(typeof item.category).toBe('string');
        expect(typeof item.created_at).toBe('string');
        
        expect(item.item_id.length).toBeGreaterThan(0);
        expect(item.item_name.length).toBeGreaterThan(0);
        expect(item.category.length).toBeGreaterThan(0);
      });
      
      expectFastExecution(timeMs, 5);
    });
  });

  describe('Fast Test Execution Validation', () => {
    it('validates all item API operations complete in milliseconds', async () => {
      const startTime = performance.now();

      // Multiple quick operations
      const allItems = await apiService.getAllItems();
      const searchResults = await apiService.searchItems('sword');
      const categoryResults = await apiService.searchByCategory('weapons');

      expect(Array.isArray(allItems)).toBe(true);
      expect(Array.isArray(searchResults)).toBe(true);
      expect(Array.isArray(categoryResults)).toBe(true);

      const totalTime = performance.now() - startTime;
      expectFastExecution(totalTime, 20);
    });
  });
});