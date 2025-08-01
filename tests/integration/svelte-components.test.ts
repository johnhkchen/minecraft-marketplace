/**
 * Svelte Components Integration Tests
 * Tests components that interact with the nginx-proxied APIs
 */

import { describe, test, expect } from 'vitest';
import { postgrestRequest } from '../setup.js';

describe('Svelte Components Integration via nginx', () => {
  describe('MarketplaceBrowser Component Data', () => {
    test('should receive correctly structured data from PostgREST', async () => {
      // Test the data structure that MarketplaceBrowser expects
      const response = await postgrestRequest('/public_items?limit=5');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      
      if (items.length > 0) {
        const item = items[0];
        
        // Verify the structure matches what Svelte components expect
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('price_diamonds');
        expect(item).toHaveProperty('trading_unit');
        expect(item).toHaveProperty('owner_username');
        expect(item).toHaveProperty('owner_shop_name');
        expect(item).toHaveProperty('stock_quantity');
        
        // Verify data types
        expect(typeof item.id).toBe('string');
        expect(typeof item.name).toBe('string');
        expect(typeof item.price_diamonds).toBe('number');
        expect(typeof item.stock_quantity).toBe('number');
      }
    });

    test('should support filtering that components use', async () => {
      // Test category filtering that dropdown component would use
      const categories = ['tools', 'armor', 'blocks', 'food', 'misc'];
      
      for (const category of categories) {
        const response = await postgrestRequest(`/public_items?category=eq.${category}&limit=3`);
        expect(response.ok).toBe(true);
        
        const items = await response.json();
        expect(Array.isArray(items)).toBe(true);
        
        // All items should match the requested category
        items.forEach((item: any) => {
          expect(item.category).toBe(category);
        });
      }
    });

    test('should support search functionality components use', async () => {
      // Test name search that search component would use
      const searchTerms = ['diamond', 'sword', 'block'];
      
      for (const term of searchTerms) {
        const response = await postgrestRequest(`/public_items?name=ilike.*${term}*&limit=5`);
        expect(response.ok).toBe(true);
        
        const items = await response.json();
        expect(Array.isArray(items)).toBe(true);
        
        // All items should contain the search term
        items.forEach((item: any) => {
          expect(item.name.toLowerCase()).toContain(term.toLowerCase());
        });
      }
    });
  });

  describe('PriceDisplay Component Data', () => {
    test('should receive price data that formatPrice can handle', async () => {
      const response = await postgrestRequest('/public_items?limit=10');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      
      items.forEach((item: any) => {
        // Price should be a valid number
        expect(typeof item.price_diamonds).toBe('number');
        expect(item.price_diamonds).toBeGreaterThanOrEqual(0);
        
        // Trading unit should be valid
        expect(['per_item', 'per_stack', 'per_shulker']).toContain(item.trading_unit);
      });
    });

    test('should handle price ranges that components display', async () => {
      // Test different price ranges to ensure components can handle variety
      const response = await postgrestRequest('/public_items?limit=20');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      
      let hasLowPrices = false;
      let hasHighPrices = false;
      
      items.forEach((item: any) => {
        if (item.price_diamonds < 10) {
          hasLowPrices = true;
        }
        if (item.price_diamonds > 50) {
          hasHighPrices = true;
        }
      });
      
      // Should have variety in pricing for component testing
      // (This validates our test data has good coverage)
      expect(hasLowPrices || hasHighPrices).toBe(true);
    });
  });

  describe('Market Statistics Components', () => {
    test('should provide data for market overview components', async () => {
      // Test total items count
      const itemsResponse = await postgrestRequest('/public_items');
      expect(itemsResponse.ok).toBe(true);
      
      const items = await itemsResponse.json();
      expect(items.length).toBeGreaterThan(0);
      
      // Test category distribution
      const categories = new Set(items.map((item: any) => item.category));
      expect(categories.size).toBeGreaterThan(1); // Should have multiple categories
      
      // Test shop distribution
      const shops = new Set(items.map((item: any) => item.owner_shop_name));
      expect(shops.size).toBeGreaterThan(1); // Should have multiple shops
    });

    test('should support sorting that components use', async () => {
      // Test price sorting (ascending)
      const ascResponse = await postgrestRequest('/public_items?order=price_diamonds.asc&limit=5');
      expect(ascResponse.ok).toBe(true);
      
      const ascItems = await ascResponse.json();
      if (ascItems.length > 1) {
        for (let i = 1; i < ascItems.length; i++) {
          expect(ascItems[i].price_diamonds).toBeGreaterThanOrEqual(ascItems[i-1].price_diamonds);
        }
      }
      
      // Test price sorting (descending)
      const descResponse = await postgrestRequest('/public_items?order=price_diamonds.desc&limit=5');
      expect(descResponse.ok).toBe(true);
      
      const descItems = await descResponse.json();
      if (descItems.length > 1) {
        for (let i = 1; i < descItems.length; i++) {
          expect(descItems[i].price_diamonds).toBeLessThanOrEqual(descItems[i-1].price_diamonds);
        }
      }
    });
  });

  describe('Component Performance Requirements', () => {
    test('should respond quickly for real-time filtering', async () => {
      const startTime = Date.now();
      
      const response = await postgrestRequest('/public_items?category=eq.tools&limit=10');
      expect(response.ok).toBe(true);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Should respond in under 500ms for good UX (GAMEPLAN requirement)
      expect(responseTime).toBeLessThan(500);
    });

    test('should handle concurrent requests that components might make', async () => {
      // Simulate multiple components making requests simultaneously
      const requests = [
        postgrestRequest('/public_items?category=eq.tools&limit=5'),
        postgrestRequest('/public_items?category=eq.blocks&limit=5'),
        postgrestRequest('/public_items?category=eq.food&limit=5')
      ];
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
    });
  });
});