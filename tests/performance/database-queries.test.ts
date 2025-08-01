// Performance tests for database queries and operations
// Following 000_consolidated_specification.md testing requirements

import { describe, test, expect, beforeEach } from 'vitest';
import { PostgresDB } from '../../workspaces/frontend/src/lib/postgres-db.js';
import { createTestUser, cleanupTestDatabase, testClient } from '../setup/test-db-setup.js';
import type { ItemCategory, CurrencyUnit } from '../../workspaces/frontend/src/types/index.js';

describe('Database Performance Tests', () => {
  let db: PostgresDB;

  beforeEach(async () => {
    await cleanupTestDatabase();
    db = new PostgresDB();
  });

  describe('Query Performance Benchmarks', () => {
    test('item search should complete under 100ms with large dataset', async () => {
      // Create test users with unique identifiers
      const testId = Date.now();
      const users = await Promise.all([
        db.createUser({
          username: `perf_user_1_${testId}`,
          email: `perf1_${testId}@test.com`,
          password_hash: '$2b$10$test.hash',
          role: 'shop_owner'
        }),
        db.createUser({
          username: `perf_user_2_${testId}`,
          email: `perf2_${testId}@test.com`,
          password_hash: '$2b$10$test.hash',
          role: 'shop_owner'
        }),
        db.createUser({
          username: `perf_user_3_${testId}`,
          email: `perf3_${testId}@test.com`,
          password_hash: '$2b$10$test.hash',
          role: 'shop_owner'
        })
      ]);

      // Seed large dataset (100 items for performance testing)
      const categories: ItemCategory[] = ['blocks', 'items', 'tools', 'armor', 'food', 'redstone', 'decorative', 'other'];
      const itemPromises = [];

      for (let i = 0; i < 100; i++) {
        const user = users[i % users.length];
        const category = categories[i % categories.length];
        
        itemPromises.push(
          db.createItem({
            name: `Test Item ${i} Diamond Pickaxe Tool`,
            description: `Description for item ${i} with diamond and enchanted properties`,
            category,
            stock_quantity: Math.floor(Math.random() * 20) + 1,
            user_id: user.id,
            price: {
              amount: Math.random() * 10 + 1,
              currency_unit: 'diamonds' as CurrencyUnit,
              diamond_equivalent: Math.random() * 10 + 1
            }
          })
        );
      }

      await Promise.all(itemPromises);

      // Benchmark search performance
      const startTime = performance.now();
      const results = await db.searchItems('diamond');
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      console.log(`Search query took ${duration}ms`);
      
      expect(duration).toBeLessThan(100); // Should complete under 100ms
      expect(results.length).toBeGreaterThan(0);
      expect(Array.isArray(results)).toBe(true);
    });

    test('item listing with filters should complete under 50ms', async () => {
      const user = await createTestUser('shop_owner');
      
      // Create 50 items for filtering performance test
      const itemPromises = [];
      for (let i = 0; i < 50; i++) {
        itemPromises.push(
          db.createItem({
            name: `Filter Test Item ${i}`,
            category: i % 2 === 0 ? 'tools' : 'blocks',
            stock_quantity: i % 3 === 0 ? 0 : 10, // Some out of stock
            user_id: user.id,
            price: {
              amount: i + 1,
              currency_unit: 'diamonds' as CurrencyUnit,
              diamond_equivalent: i + 1
            }
          })
        );
      }

      await Promise.all(itemPromises);

      // Benchmark filtered query performance
      const startTime = performance.now();
      const results = await db.getItems({
        category: 'tools',
        available_only: true,
        limit: 20
      });
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      console.log(`Filtered query took ${duration}ms`);
      
      expect(duration).toBeLessThan(50); // Should complete under 50ms
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(item => item.category === 'tools')).toBe(true);
    });

    test('user creation should complete under 20ms', async () => {
      const userData = {
        username: `perf_user_${Date.now()}`,
        email: `perf${Date.now()}@test.com`,
        password_hash: '$2b$10$test.hash.for.performance'
      };

      const startTime = performance.now();
      const user = await db.createUser(userData);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      console.log(`User creation took ${duration}ms`);
      
      expect(duration).toBeLessThan(20); // Should complete under 20ms
      expect(user.username).toBe(userData.username);
    });

    test('market data retrieval should complete under 30ms', async () => {
      const user = await createTestUser('shop_owner');
      const item = await db.createItem({
        name: 'Market Performance Test Item',
        category: 'items',
        stock_quantity: 10,
        user_id: user.id,
        price: {
          amount: 5.0,
          currency_unit: 'diamonds' as CurrencyUnit,
          diamond_equivalent: 5.0
        }
      });

      const startTime = performance.now();
      const marketData = await db.getMarketData(item.id);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      console.log(`Market data query took ${duration}ms`);
      
      expect(duration).toBeLessThan(30); // Should complete under 30ms
      expect(marketData).toBeTruthy();
    });
  });

  describe('Concurrent Operations Performance', () => {
    test('should handle concurrent user creation efficiently', async () => {
      const concurrentUsers = 20;
      const userPromises = [];

      const startTime = performance.now();
      
      for (let i = 0; i < concurrentUsers; i++) {
        userPromises.push(
          db.createUser({
            username: `concurrent_user_${i}_${Date.now()}`,
            email: `concurrent${i}_${Date.now()}@test.com`,
            password_hash: '$2b$10$test.hash'
          })
        );
      }

      const users = await Promise.all(userPromises);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const avgDuration = duration / concurrentUsers;
      
      console.log(`${concurrentUsers} concurrent user creations took ${duration}ms (avg: ${avgDuration}ms)`);
      
      expect(users.length).toBe(concurrentUsers);
      expect(avgDuration).toBeLessThan(10); // Average should be under 10ms per user
    });

    test('should handle concurrent item creation efficiently', async () => {
      const user = await createTestUser('shop_owner');
      const concurrentItems = 15;
      const itemPromises = [];

      const startTime = performance.now();
      
      for (let i = 0; i < concurrentItems; i++) {
        itemPromises.push(
          db.createItem({
            name: `Concurrent Item ${i}`,
            category: 'items',
            stock_quantity: 1,
            user_id: user.id,
            price: {
              amount: i + 1,
              currency_unit: 'diamonds' as CurrencyUnit,
              diamond_equivalent: i + 1
            }
          })
        );
      }

      const items = await Promise.all(itemPromises);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const avgDuration = duration / concurrentItems;
      
      console.log(`${concurrentItems} concurrent item creations took ${duration}ms (avg: ${avgDuration}ms)`);
      
      expect(items.length).toBe(concurrentItems);
      expect(avgDuration).toBeLessThan(20); // Average should be under 20ms per item (includes transaction overhead)
    });

    test('should handle concurrent searches efficiently', async () => {
      const user = await createTestUser('shop_owner');
      
      // Create some searchable items
      await Promise.all([
        db.createItem({
          name: 'Diamond Sword',
          category: 'tools',
          stock_quantity: 1,
          user_id: user.id,
          price: { amount: 3, currency_unit: 'diamonds' as CurrencyUnit, diamond_equivalent: 3 }
        }),
        db.createItem({
          name: 'Iron Pickaxe',
          category: 'tools',
          stock_quantity: 1,
          user_id: user.id,
          price: { amount: 10, currency_unit: 'iron_ingots' as CurrencyUnit, diamond_equivalent: 1 }
        }),
        db.createItem({
          name: 'Diamond Block',
          category: 'blocks',
          stock_quantity: 1,
          user_id: user.id,
          price: { amount: 1, currency_unit: 'diamond_blocks' as CurrencyUnit, diamond_equivalent: 9 }
        })
      ]);

      const concurrentSearches = 10;
      const searchPromises = [];
      const searchTerms = ['diamond', 'iron', 'block', 'sword', 'pickaxe'];

      const startTime = performance.now();
      
      for (let i = 0; i < concurrentSearches; i++) {
        const searchTerm = searchTerms[i % searchTerms.length];
        searchPromises.push(db.searchItems(searchTerm));
      }

      const searchResults = await Promise.all(searchPromises);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const avgDuration = duration / concurrentSearches;
      
      console.log(`${concurrentSearches} concurrent searches took ${duration}ms (avg: ${avgDuration}ms)`);
      
      expect(searchResults.length).toBe(concurrentSearches);
      expect(avgDuration).toBeLessThan(15); // Average should be under 15ms per search
      expect(searchResults.every(result => Array.isArray(result))).toBe(true);
    });
  });

  describe('Index Performance Validation', () => {
    test('search queries should use full-text search index', async () => {
      const user = await createTestUser('shop_owner');
      
      // Create items with searchable content
      await Promise.all([
        db.createItem({
          name: 'Enchanted Diamond Sword of Fire',
          description: 'A magical sword with fire enchantment',
          category: 'tools',
          stock_quantity: 1,
          user_id: user.id,
          price: { amount: 10, currency_unit: 'diamonds' as CurrencyUnit, diamond_equivalent: 10 }
        }),
        db.createItem({
          name: 'Iron Pickaxe',
          description: 'Standard mining tool',
          category: 'tools',
          stock_quantity: 1,
          user_id: user.id,
          price: { amount: 15, currency_unit: 'iron_ingots' as CurrencyUnit, diamond_equivalent: 1.5 }
        })
      ]);

      // Test search performance with complex text search
      const startTime = performance.now();
      const results = await db.searchItems('enchanted fire');
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      console.log(`Full-text search took ${duration}ms`);
      
      expect(duration).toBeLessThan(25); // Should be fast with proper indexing
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Enchanted');
    });

    test('category filtering should use category index', async () => {
      const user = await createTestUser('shop_owner');
      
      // Create items in different categories
      const categories: ItemCategory[] = ['blocks', 'tools', 'armor', 'food'];
      const itemPromises = categories.map(category => 
        db.createItem({
          name: `${category} item`,
          category,
          stock_quantity: 1,
          user_id: user.id,
          price: { amount: 1, currency_unit: 'diamonds' as CurrencyUnit, diamond_equivalent: 1 }
        })
      );

      await Promise.all(itemPromises);

      // Test category filtering performance
      const startTime = performance.now();
      const results = await db.getItems({ category: 'tools' });
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      console.log(`Category filtering took ${duration}ms`);
      
      expect(duration).toBeLessThan(15); // Should be fast with category index
      expect(results.length).toBe(1);
      expect(results[0].category).toBe('tools');
    });
  });

  describe('Connection Pool Performance', () => {
    test('should handle multiple database connections efficiently', async () => {
      // Test connection pool by creating multiple database instances
      const dbInstances = Array.from({ length: 5 }, () => new PostgresDB());
      
      const startTime = performance.now();
      
      // Perform operations on different connections simultaneously
      const operations = dbInstances.map(async (dbInstance, index) => {
        const user = await dbInstance.createUser({
          username: `pool_user_${index}_${Date.now()}`,
          email: `pool${index}_${Date.now()}@test.com`,
          password_hash: '$2b$10$test.hash'
        });
        
        return dbInstance.createItem({
          name: `Pool Test Item ${index}`,
          category: 'items',
          stock_quantity: 1,
          user_id: user.id,
          price: { amount: 1, currency_unit: 'diamonds' as CurrencyUnit, diamond_equivalent: 1 }
        });
      });

      const results = await Promise.all(operations);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      console.log(`Connection pool operations took ${duration}ms`);
      
      expect(results.length).toBe(5);
      expect(duration).toBeLessThan(150); // Should handle pool efficiently (adjusted for multiple connection creation)
      
      // Clean up connections
      await Promise.all(dbInstances.map(db => db.close()));
    });
  });

  describe('Memory and Resource Usage', () => {
    test('should handle large result sets without memory issues', async () => {
      const user = await createTestUser('shop_owner');
      
      // Create items that will all match our search
      const itemCount = 50;
      const itemPromises = [];
      
      for (let i = 0; i < itemCount; i++) {
        itemPromises.push(
          db.createItem({
            name: `Memory Test Diamond Item ${i}`,
            description: 'Diamond item for memory testing',
            category: 'items',
            stock_quantity: 1,
            user_id: user.id,
            price: { amount: 1, currency_unit: 'diamonds' as CurrencyUnit, diamond_equivalent: 1 }
          })
        );
      }

      await Promise.all(itemPromises);

      // Search for all items (with limit to get all results)
      const startTime = performance.now();
      const results = await db.searchItems('diamond', itemCount); // Set limit to match item count
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      console.log(`Large result set query took ${duration}ms for ${results.length} items`);
      
      expect(duration).toBeLessThan(75); // Should handle large result sets efficiently
      expect(results.length).toBe(itemCount);
      expect(results.every(item => item.name.includes('Diamond'))).toBe(true);
    });
  });
});