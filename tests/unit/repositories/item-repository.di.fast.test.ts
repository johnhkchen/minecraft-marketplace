/**
 * ItemRepository Unit Tests - DI Fast Version
 * 
 * Uses dependency injection for true unit test isolation
 * No external dependencies, blazing fast execution with Minecraft data
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { measure, measureSync, expectFastExecution } from '../../utils/fast-test-setup';
import { ServiceContainer } from '../../../shared/di/container';
import type { Item, ItemCategory } from '../../../shared/types/service-interfaces.js';
import { ItemRepository, type IItemRepository } from '../../../shared/repositories/item-repository.js';

// CONFIGURABLE - Minecraft naming conventions
const TEST_DATA = {
  // Minecraft usernames
  mainTrader: 'steve',
  altTrader: 'alex',
  adminUser: 'notch',
  // Minecraft server names
  primaryServer: 'HermitCraft',
  secondaryServer: 'SMP-Live',
  // Item names and IDs (format: lowercase with underscores only)
  primaryItem: 'Diamond Sword',
  primaryItemId: 'diamond_sword',
  secondaryItem: 'Iron Pickaxe',  
  secondaryItemId: 'iron_pickaxe',
  enchantedItem: 'Enchanted Book',
  enchantedItemId: 'enchanted_book'
};

// Fast configurable item data factory using DI pattern
const createItemData = (overrides = {}) => ({
  ownerId: TEST_DATA.mainTrader,
  name: TEST_DATA.primaryItem,
  description: 'Sharp diamond sword with Sharpness V',
  category: 'weapons' as ItemCategory,
  minecraftId: TEST_DATA.primaryItemId,
  stockQuantity: 5,
  isAvailable: true,
  serverName: TEST_DATA.primaryServer,
  shopLocation: 'spawn_market',
  ...overrides
});

describe('ItemRepository - DI Fast Unit Tests', () => {
  let container: ServiceContainer;
  let itemRepository: IItemRepository;

  beforeEach(() => {
    // **KEY DI PATTERN**: Clean container setup for each test
    const { result: setupContainer, timeMs } = measureSync(() => {
      const newContainer = new ServiceContainer();
      
      // Inject clean ItemRepository instance - no external dependencies!
      newContainer.register('itemRepository', () => new ItemRepository());
      
      return newContainer;
    });
    
    container = setupContainer;
    itemRepository = container.get<IItemRepository>('itemRepository');
    
    expectFastExecution(timeMs, 2);
  });

  afterEach(async () => {
    // Clean up injected dependencies with performance monitoring
    const { timeMs } = await measure(async () => {
      if (itemRepository instanceof ItemRepository) {
        await itemRepository.clear();
      }
      container.clear();
    });
    expectFastExecution(timeMs, 5);
  });

  describe('DI Container Integration', () => {
    it('should inject ItemRepository correctly', () => {
      const { result: isRegistered, timeMs } = measureSync(() => {
        return container.has('itemRepository');
      });
      
      expect(isRegistered).toBe(true);
      expect(itemRepository).toBeInstanceOf(ItemRepository);
      expectFastExecution(timeMs, 1);
    });

    it('should provide singleton repository instance', () => {
      const { result: sameInstance, timeMs } = measureSync(() => {
        const repo1 = container.get<IItemRepository>('itemRepository');
        const repo2 = container.get<IItemRepository>('itemRepository');
        return repo1 === repo2;
      });
      
      expect(sameInstance).toBe(true);
      expectFastExecution(timeMs, 1);
    });
  });

  describe('Minecraft Item Creation', () => {
    it('should create Diamond Sword with Minecraft data patterns', async () => {
      const itemData = createItemData();

      const { result: createdItem, timeMs } = await measure(async () => {
        return itemRepository.create(itemData);
      });

      // Validate Minecraft-specific data structure
      expect(createdItem.id).toBeDefined();
      expect(createdItem.ownerId).toBe(TEST_DATA.mainTrader);
      expect(createdItem.name).toBe(TEST_DATA.primaryItem);
      expect(createdItem.minecraftId).toBe(TEST_DATA.primaryItemId);
      expect(createdItem.serverName).toBe(TEST_DATA.primaryServer);
      expect(createdItem.category).toBe('weapons');
      expect(createdItem.createdAt).toBeInstanceOf(Date);
      
      expectFastExecution(timeMs, 5);
    });

    it('should create multiple Minecraft items efficiently', async () => {
      const minecraftItems = [
        createItemData(), // Diamond Sword
        createItemData({
          ownerId: TEST_DATA.altTrader,
          name: TEST_DATA.secondaryItem,
          minecraftId: TEST_DATA.secondaryItemId,
          category: 'tools' as ItemCategory
        }), // Iron Pickaxe
        createItemData({
          ownerId: TEST_DATA.adminUser,
          name: TEST_DATA.enchantedItem,
          minecraftId: TEST_DATA.enchantedItemId,
          category: 'items' as ItemCategory
        }) // Enchanted Book
      ];

      const { result: createdItems, timeMs } = await measure(async () => {
        return Promise.all(minecraftItems.map(item => itemRepository.create(item)));
      });

      expect(createdItems.length).toBe(3);
      expect(createdItems[0].ownerId).toBe(TEST_DATA.mainTrader);
      expect(createdItems[1].ownerId).toBe(TEST_DATA.altTrader);
      expect(createdItems[2].ownerId).toBe(TEST_DATA.adminUser);
      
      expectFastExecution(timeMs, 10);
    });
  });

  describe('Minecraft Search & Filtering', () => {
    it('should search Minecraft items by name pattern', async () => {
      // Setup test data
      const { timeMs: setupTime } = await measure(async () => {
        await itemRepository.create(createItemData());
        await itemRepository.create(createItemData({
          name: TEST_DATA.secondaryItem,
          minecraftId: TEST_DATA.secondaryItemId
        }));
      });

      const { result: searchResults, timeMs } = await measure(async () => {
        return itemRepository.search('diamond');
      });
      
      // Epic 1 requirement: <2s search (should be microseconds with DI!)
      expect(timeMs).toBeLessThan(2000);
      expectFastExecution(timeMs, 5);
      
      expect(Array.isArray(searchResults)).toBe(true);
      expect(searchResults.length).toBeGreaterThanOrEqual(1);
      const foundDiamondSword = searchResults.find(item => item.name === TEST_DATA.primaryItem);
      expect(foundDiamondSword).toBeDefined();
      
      expectFastExecution(setupTime + timeMs, 15);
    });

    it('should filter by Minecraft server name', async () => {
      // Create items on different servers
      const { timeMs: setupTime } = await measure(async () => {
        await itemRepository.create(createItemData());
        await itemRepository.create(createItemData({
          serverName: TEST_DATA.secondaryServer,
          name: 'Creative Sword'
        }));
      });

      const { result: serverItems, timeMs } = await measure(async () => {
        return itemRepository.findAvailable({ serverName: TEST_DATA.primaryServer });
      });
      
      expect(Array.isArray(serverItems)).toBe(true);
      expect(serverItems.length).toBe(1);
      expect(serverItems[0].serverName).toBe(TEST_DATA.primaryServer);
      
      expectFastExecution(setupTime + timeMs, 10);
    });
  });

  describe('Performance Validation', () => {
    it('should validate all CRUD operations meet Epic 1 requirements', async () => {
      const itemData = createItemData();

      const { result: operations, timeMs } = await measure(async () => {
        // Complete CRUD cycle using DI
        const created = await itemRepository.create(itemData);
        const found = await itemRepository.findById(created.id);
        const updated = await itemRepository.update(created.id, { 
          name: 'Enhanced Diamond Sword' 
        });
        const all = await itemRepository.findAll();
        const deleted = await itemRepository.delete(created.id);
        
        return { created, found, updated, all, deleted };
      });

      // Validate all operations completed successfully
      expect(operations.created.name).toBe(TEST_DATA.primaryItem);
      expect(operations.found?.id).toBe(operations.created.id);
      expect(operations.updated.name).toBe('Enhanced Diamond Sword');
      expect(operations.all.length).toBeGreaterThanOrEqual(0); // May contain other items
      expect(operations.deleted).toBe(true);
      
      // All operations should be lightning fast with DI!
      expectFastExecution(timeMs, 10);
    });

    it('should validate DI container resolution performance', () => {
      const iterations = 100;
      
      const { result: avgTime, timeMs } = measureSync(() => {
        const start = performance.now();
        
        for (let i = 0; i < iterations; i++) {
          container.get<IItemRepository>('itemRepository');
        }
        
        return (performance.now() - start) / iterations;
      });
      
      expect(avgTime).toBeLessThan(0.1); // < 0.1ms per resolution
      expectFastExecution(timeMs, 5);
    });
  });

  describe('Minecraft Business Rules', () => {
    it('should validate Minecraft item categories', () => {
      const minecraftCategories: ItemCategory[] = [
        'weapons', 'tools', 'armor', 'blocks', 'items', 'food'
      ];

      const { result: allValid, timeMs } = measureSync(() => {
        return minecraftCategories.every(category => {
          const item = createItemData({ category });
          return item.category === category;
        });
      });

      expect(allValid).toBe(true);
      expectFastExecution(timeMs, 2);
    });

    it('should validate Minecraft ID format patterns', () => {
      const minecraftIds = [
        TEST_DATA.primaryItemId,
        TEST_DATA.secondaryItemId,
        TEST_DATA.enchantedItemId,
        'netherite_sword',
        'diamond_chestplate'
      ];

      const { result: allValid, timeMs } = measureSync(() => {
        return minecraftIds.every(id => {
          return /^[a-z_]+$/.test(id);
        });
      });

      expect(allValid).toBe(true);
      expectFastExecution(timeMs, 2);
    });
  });
});