/**
 * Database Operations Integration Tests with Testcontainers
 * Tests database operations using isolated PostgreSQL container
 */

import { describe, test, expect } from 'vitest';
import { useIntegrationTests, getIntegrationTestUrls } from '../utils/integration-test-setup';

describe('Database Operations with Testcontainers', () => {
  // Setup testcontainers before all tests
  useIntegrationTests();

  describe('CRUD Operations via PostgREST', () => {
    test('should create new items via POST', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      const newItem = {
        owner_id: 'test_user',
        name: 'Test Sword',
        minecraft_id: 'minecraft:test_sword',
        category: 'weapons',
        stock_quantity: 1,
        is_available: true
      };
      
      const response = await fetch(`${postgrest}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(newItem)
      });
      
      expect(response.ok).toBe(true);
      const createdItems = await response.json();
      expect(Array.isArray(createdItems)).toBe(true);
      expect(createdItems.length).toBe(1);
      
      const createdItem = createdItems[0];
      expect(createdItem.name).toBe(newItem.name);
      expect(createdItem.owner_id).toBe(newItem.owner_id);
      expect(createdItem.category).toBe(newItem.category);
      expect(typeof createdItem.id).toBe('number');
    });

    test('should update existing items via PATCH', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      // First, get an existing item
      const getResponse = await fetch(`${postgrest}/items?limit=1`);
      expect(getResponse.ok).toBe(true);
      const items = await getResponse.json();
      expect(items.length).toBeGreaterThan(0);
      
      const item = items[0];
      const newStockQuantity = item.stock_quantity + 10;
      
      // Update the item
      const updateResponse = await fetch(`${postgrest}/items?id=eq.${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          stock_quantity: newStockQuantity
        })
      });
      
      expect(updateResponse.ok).toBe(true);
      const updatedItems = await updateResponse.json();
      expect(updatedItems.length).toBe(1);
      expect(updatedItems[0].stock_quantity).toBe(newStockQuantity);
    });

    test('should create prices with item relationships', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      // Get an item to create a price for
      const itemsResponse = await fetch(`${postgrest}/items?limit=1`);
      const items = await itemsResponse.json();
      expect(items.length).toBeGreaterThan(0);
      const item = items[0];
      
      const newPrice = {
        item_id: item.id,
        price_diamonds: 3.75,
        trading_unit: 'per_item',
        is_current: true
      };
      
      const response = await fetch(`${postgrest}/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(newPrice)
      });
      
      expect(response.ok).toBe(true);
      const createdPrices = await response.json();
      expect(createdPrices.length).toBe(1);
      
      const createdPrice = createdPrices[0];
      expect(createdPrice.item_id).toBe(item.id);
      expect(parseFloat(createdPrice.price_diamonds)).toBeCloseTo(3.75);
      expect(createdPrice.trading_unit).toBe('per_item');
    });
  });

  describe('Database Constraints and Validation', () => {
    test('should enforce foreign key constraints', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      // Try to create a price for non-existent item
      const invalidPrice = {
        item_id: 99999, // Non-existent item
        price_diamonds: 1.0,
        trading_unit: 'per_item'  
      };
      
      const response = await fetch(`${postgrest}/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidPrice)
      });
      
      // Should fail due to foreign key constraint
      expect(response.ok).toBe(false);
      expect([409, 400].includes(response.status)).toBe(true);
    });

    test('should handle unique constraint violations', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      // Try to create a user with duplicate discord_id
      const duplicateUser = {
        discord_id: '123456789012345678', // Already exists in test data
        username: 'duplicate_test',
        shop_name: 'Duplicate Shop'
      };
      
      const response = await fetch(`${postgrest}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(duplicateUser)
      });
      
      // Should fail due to unique constraint on discord_id
      expect(response.ok).toBe(false);
      expect([409, 400].includes(response.status)).toBe(true);
    });
  });

  describe('Complex Queries and Joins', () => {
    test('should join items with their prices', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      const response = await fetch(`${postgrest}/items?select=*,prices(*)`);
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      
      // Find an item that has prices
      const itemWithPrices = items.find(item => item.prices && item.prices.length > 0);
      expect(itemWithPrices).toBeDefined();
      
      if (itemWithPrices) {
        expect(Array.isArray(itemWithPrices.prices)).toBe(true);
        const price = itemWithPrices.prices[0];
        expect(price).toHaveProperty('price_diamonds');
        expect(price).toHaveProperty('trading_unit');
        expect(price.item_id).toBe(itemWithPrices.id);
      }
    });

    test('should filter joined data', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      // Get items with prices where price > 2.0 diamonds
      const response = await fetch(`${postgrest}/items?select=*,prices!inner(*)&prices.price_diamonds=gt.2.0`);
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      
      items.forEach(item => {
        expect(Array.isArray(item.prices)).toBe(true);
        item.prices.forEach((price: any) => {
          expect(parseFloat(price.price_diamonds)).toBeGreaterThan(2.0);
        });
      });
    });

    test('should aggregate data', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      // Count items by category
      const response = await fetch(`${postgrest}/items?select=category&limit=1000`);
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      
      // Manually aggregate (PostgREST aggregation syntax varies)
      const categoryCount = items.reduce((acc: any, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {});
      
      expect(Object.keys(categoryCount).length).toBeGreaterThan(0);
      expect(categoryCount.weapons).toBeGreaterThan(0);
    });
  });

  describe('Database Performance with Real Data', () => {
    test('should handle bulk inserts efficiently', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      // Create multiple items in one request
      const bulkItems = Array.from({ length: 5 }, (_, i) => ({
        owner_id: 'bulk_test_user',
        name: `Bulk Test Item ${i + 1}`,
        minecraft_id: `minecraft:bulk_test_${i + 1}`,
        category: 'test',
        stock_quantity: i + 1
      }));
      
      const startTime = Date.now();
      const response = await fetch(`${postgrest}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(bulkItems)
      });
      const responseTime = Date.now() - startTime;
      
      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(2000); // Should be reasonably fast
      
      const createdItems = await response.json();
      expect(createdItems.length).toBe(5);
      
      createdItems.forEach((item, index) => {
        expect(item.name).toBe(`Bulk Test Item ${index + 1}`);
        expect(item.owner_id).toBe('bulk_test_user');
      });
    });

    test('should handle concurrent database operations', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      // Run multiple operations concurrently
      const operations = [
        fetch(`${postgrest}/items?limit=5`),
        fetch(`${postgrest}/users?limit=3`),
        fetch(`${postgrest}/prices?limit=5`),
        fetch(`${postgrest}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            owner_id: 'concurrent_test',
            name: 'Concurrent Test Item',
            category: 'test'
          })
        })
      ];
      
      const responses = await Promise.all(operations);
      
      // All operations should succeed
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
      
      // Verify the created item
      const createResponse = responses[3];
      const created = await createResponse.json();
      expect(Array.isArray(created)).toBe(true);
      expect(created[0].name).toBe('Concurrent Test Item');
    });
  });

  describe('Data Consistency', () => {
    test('should maintain referential integrity on deletes', async () => {
      const { postgrest } = getIntegrationTestUrls();
      
      // Create a test item with a price
      const itemResponse = await fetch(`${postgrest}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          owner_id: 'delete_test',
          name: 'Item to Delete',
          category: 'test'
        })
      });
      
      expect(itemResponse.ok).toBe(true);
      const items = await itemResponse.json();
      const testItem = items[0];
      
      // Create a price for this item
      const priceResponse = await fetch(`${postgrest}/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_id: testItem.id,
          price_diamonds: 1.0,
          trading_unit: 'per_item'
        })
      });
      
      expect(priceResponse.ok).toBe(true);
      
      // Try to delete the item (should fail due to foreign key constraint)
      const deleteResponse = await fetch(`${postgrest}/items?id=eq.${testItem.id}`, {
        method: 'DELETE'
      });
      
      // Should fail due to referential integrity
      expect(deleteResponse.ok).toBe(false);
      expect([409, 400].includes(deleteResponse.status)).toBe(true);
    });
  });
});