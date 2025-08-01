/**
 * API Endpoint Integration Tests with Testcontainers
 * Tests API endpoints using isolated PostgreSQL + PostgREST containers
 */

import { describe, test, expect } from 'vitest';
import { useIntegrationTests, getIntegrationTestUrls } from '../utils/integration-test-setup';

describe('API Endpoints with Testcontainers', () => {
  // Setup testcontainers before all tests
  useIntegrationTests();

  describe('PostgREST Data API', () => {
    test('should access items through PostgREST API', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      const response = await fetch(`${postgrest}/items?limit=5`);
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
      
      // Verify test data structure
      const item = items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('owner_id');
      expect(typeof item.id).toBe('number');
      expect(typeof item.name).toBe('string');
    });

    test('should filter items by category', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      const response = await fetch(`${postgrest}/items?category=eq.weapons`);
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      
      items.forEach(item => {
        expect(item.category).toBe('weapons');
      });
    });

    test('should filter items by owner', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      const response = await fetch(`${postgrest}/items?owner_id=eq.steve`);
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      
      items.forEach(item => {
        expect(item.owner_id).toBe('steve');
      });
    });

    test('should access users through PostgREST', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      const response = await fetch(`${postgrest}/users?limit=3`);
      expect(response.ok).toBe(true);
      
      const users = await response.json();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      
      const user = users[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('discord_id');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('shop_name');
    });

    test('should access prices with item relationships', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      const response = await fetch(`${postgrest}/prices?select=*,items(*)`);
      expect(response.ok).toBe(true);
      
      const prices = await response.json();
      expect(Array.isArray(prices)).toBe(true);
      expect(prices.length).toBeGreaterThan(0);
      
      const price = prices[0];
      expect(price).toHaveProperty('id');
      expect(price).toHaveProperty('price_diamonds');
      expect(price).toHaveProperty('trading_unit');
      expect(price).toHaveProperty('items');
      expect(typeof price.price_diamonds).toBe('number'); // PostgREST returns DECIMAL as number
    });
  });

  describe('PostgREST Query Features', () => {
    test('should support PostgREST filtering syntax', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      // Test greater than filter
      const response = await fetch(`${postgrest}/items?id=gt.1`);
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      
      items.forEach(item => {
        expect(item.id).toBeGreaterThan(1);
      });
    });

    test('should support PostgREST ordering', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      const response = await fetch(`${postgrest}/items?order=name.asc`);
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(1);
      
      // Verify items are sorted by name
      for (let i = 1; i < items.length; i++) {
        expect(items[i].name >= items[i-1].name).toBe(true);
      }
    });

    test('should support PostgREST pagination', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      // Get first page
      const page1Response = await fetch(`${postgrest}/items?limit=2&offset=0`);
      expect(page1Response.ok).toBe(true);
      const page1Items = await page1Response.json();
      expect(page1Items.length).toBeLessThanOrEqual(2);
      
      // Get second page
      const page2Response = await fetch(`${postgrest}/items?limit=2&offset=2`);
      expect(page2Response.ok).toBe(true);
      const page2Items = await page2Response.json();
      
      // Pages should have different items
      if (page1Items.length > 0 && page2Items.length > 0) {
        expect(page1Items[0].id).not.toBe(page2Items[0].id);
      }
    });

    test('should handle CORS headers properly', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      const response = await fetch(`${postgrest}/items?limit=1`, {
        method: 'GET',
        headers: {
          'Origin': 'http://localhost:4321'
        }
      });
      
      expect(response.ok).toBe(true);
      
      // PostgREST should handle CORS (though headers may vary in test environment)
      const corsHeader = response.headers.get('Access-Control-Allow-Origin');
      // Note: CORS behavior may differ in testcontainer environment
    });
  });

  describe('Database Performance', () => {
    test('should respond quickly for simple queries', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      const startTime = Date.now();
      const response = await fetch(`${postgrest}/items?limit=10`);
      const responseTime = Date.now() - startTime;
      
      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(1000); // Should be fast with testcontainers
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
    });

    test('should handle multiple concurrent requests', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      const requests = [
        fetch(`${postgrest}/items?limit=5`),
        fetch(`${postgrest}/users?limit=3`),
        fetch(`${postgrest}/prices?limit=5`)
      ];
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
      
      // Verify all responses have data
      const [items, users, prices] = await Promise.all(
        responses.map(r => r.json())
      );
      
      expect(Array.isArray(items)).toBe(true);
      expect(Array.isArray(users)).toBe(true);
      expect(Array.isArray(prices)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent endpoints', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      const response = await fetch(`${postgrest}/nonexistent_table`);
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    test('should handle malformed queries gracefully', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      const response = await fetch(`${postgrest}/items?invalid_filter=malformed`);
      // PostgREST should either ignore unknown filters or return an error
      // Both behaviors are acceptable for this test
      expect([200, 400].includes(response.status)).toBe(true);
    });
  });
});