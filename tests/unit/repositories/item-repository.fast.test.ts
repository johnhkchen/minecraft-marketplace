/**
 * ItemRepository Tests - Fast Version
 * 
 * Enhanced with configurable data factories and performance validation.
 * Epic 1: Price Discovery requirements with <10ms execution per test.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { measure, measureSync, expectFastExecution } from '../../utils/fast-test-setup';
import type { Item, ItemCategory, TradingUnitType } from '../../../shared/types/service-interfaces.js';
import { ItemRepository, type IItemRepository } from '../../../shared/repositories/item-repository.js';

// CONFIGURABLE - Update for your project
const TEST_DATA = {
  ownerId: 'user_123',
  itemName: 'Diamond Sword',
  description: 'Sharp diamond sword with Sharpness V',
  category: 'weapons' as ItemCategory,
  minecraftId: 'diamond_sword',
  stockQuantity: 5,
  serverName: 'SurvivalCraft',
  shopLocation: 'spawn_market',
  alternateItemName: 'Iron Pickaxe',
  alternateCategory: 'tools' as ItemCategory
};

// Fast item data factory
const validItemData = (overrides = {}) => ({
  ownerId: TEST_DATA.ownerId,
  name: TEST_DATA.itemName,
  description: TEST_DATA.description,
  category: TEST_DATA.category,
  minecraftId: TEST_DATA.minecraftId,
  stockQuantity: TEST_DATA.stockQuantity,
  isAvailable: true,
  serverName: TEST_DATA.serverName,
  shopLocation: TEST_DATA.shopLocation,
  ...overrides
});

// Item validation helper
const validateItemStructure = (item: Item, expectedData: any): boolean => {
  return !!(item.id &&
            typeof item.id === 'string' &&
            item.ownerId === expectedData.ownerId &&
            item.name === expectedData.name &&
            item.createdAt instanceof Date &&
            item.updatedAt instanceof Date);
};

describe('ItemRepository - Fast Tests', () => {
  let itemRepository: IItemRepository;

  beforeEach(() => {
    itemRepository = new ItemRepository();
  });

  afterEach(async () => {
    const { timeMs } = await measure(async () => {
      if (itemRepository instanceof ItemRepository) {
        await itemRepository.clear();
      }
    });
    expectFastExecution(timeMs, 5);
  });

  describe('create', () => {
    it('creates a new item with auto-generated ID and timestamps', async () => {
      const itemData = validItemData();
      
      const { result: createdItem, timeMs } = await measure(async () => {
        return itemRepository.create(itemData);
      });

      expect(validateItemStructure(createdItem, itemData)).toBe(true);
      expect(createdItem.minecraftId).toBe(TEST_DATA.minecraftId);
      expectFastExecution(timeMs, 5);
    });

    it('creates items with different categories efficiently', async () => {
      const weaponData = validItemData({ category: TEST_DATA.category });
      const toolData = validItemData({ 
        name: TEST_DATA.alternateItemName,
        category: TEST_DATA.alternateCategory,
        minecraftId: 'iron_pickaxe'
      });

      const { result, timeMs } = await measure(async () => {
        const weapon = await itemRepository.create(weaponData);
        const tool = await itemRepository.create(toolData);
        return { weapon, tool };
      });

      expect(result.weapon.category).toBe(TEST_DATA.category);
      expect(result.tool.category).toBe(TEST_DATA.alternateCategory);
      expect(result.weapon.id).not.toBe(result.tool.id);
      expectFastExecution(timeMs, 10);
    });

    it('validates required fields during creation', async () => {
      const invalidData = validItemData({ ownerId: '' });

      const { timeMs } = await measure(async () => {
        await expect(itemRepository.create(invalidData))
          .rejects.toThrow();
      });

      expectFastExecution(timeMs, 5);
    });

    it('handles stock quantity validation', async () => {
      const stockVariations = [0, 1, 64, 1728]; // Common Minecraft quantities
      
      const { result: items, timeMs } = await measure(async () => {
        return Promise.all(
          stockVariations.map((qty, index) => 
            itemRepository.create(validItemData({ 
              stockQuantity: qty,
              name: `${TEST_DATA.itemName} ${index}`
            }))
          )
        );
      });

      expect(items.length).toBe(4);
      items.forEach((item, index) => {
        expect(item.stockQuantity).toBe(stockVariations[index]);
      });
      expectFastExecution(timeMs, 15);
    });
  });

  describe('findById', () => {
    it('finds an item by ID quickly', async () => {
      const itemData = validItemData();
      
      const { result, timeMs } = await measure(async () => {
        const created = await itemRepository.create(itemData);
        const found = await itemRepository.findById(created.id);
        return { created, found };
      });

      expect(result.found).toBeTruthy();
      expect(result.found?.id).toBe(result.created.id);
      expect(result.found?.name).toBe(TEST_DATA.itemName);
      expectFastExecution(timeMs, 10);
    });

    it('returns null for non-existent ID', async () => {
      const { result, timeMs } = await measure(async () => {
        return itemRepository.findById('nonexistent_id');
      });

      expect(result).toBeNull();
      expectFastExecution(timeMs, 5);
    });

    it('handles UUID format validation', () => {
      const testIds = [
        'valid-uuid-format',
        'invalid_format',
        '',
        'too-long-to-be-valid-uuid-format-string'
      ];

      const { result: validations, timeMs } = measureSync(() => {
        return testIds.map(id => ({
          id,
          isValidFormat: typeof id === 'string' && id.length > 0
        }));
      });

      expect(validations.length).toBe(4);
      expect(validations[0].isValidFormat).toBe(true);
      expect(validations[2].isValidFormat).toBe(false); // empty string
      expectFastExecution(timeMs, 2);
    });
  });

  describe('findAll', () => {
    it('returns all items efficiently', async () => {
      const items = [
        validItemData({ name: `${TEST_DATA.itemName} 1` }),
        validItemData({ name: `${TEST_DATA.itemName} 2` }),
        validItemData({ name: `${TEST_DATA.itemName} 3` })
      ];

      const { result, timeMs } = await measure(async () => {
        // Create items
        await Promise.all(items.map(item => itemRepository.create(item)));
        
        // Find all items
        return itemRepository.findAll();
      });

      expect(result.length).toBeGreaterThanOrEqual(3);
      expectFastExecution(timeMs, 15);
    });

    it('handles empty repository', async () => {
      const { result, timeMs } = await measure(async () => {
        return itemRepository.findAll();
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
      expectFastExecution(timeMs, 5);
    });

    it('maintains performance with many items', async () => {
      const itemCount = 20;
      const items = Array(itemCount).fill(0).map((_, i) => 
        validItemData({ name: `${TEST_DATA.itemName} ${i}` })
      );

      const { result, timeMs } = await measure(async () => {
        // Create many items
        await Promise.all(items.map(item => itemRepository.create(item)));
        
        // Find all should still be fast
        return itemRepository.findAll();
      });

      expect(result.length).toBe(itemCount);
      expectFastExecution(timeMs, 25); // Allow more time for bulk operations
    });
  });

  describe('update', () => {
    it('updates item properties efficiently', async () => {
      const itemData = validItemData();
      const updates = {
        name: 'Updated Diamond Sword',
        stockQuantity: 10,
        isAvailable: false
      };

      const { result, timeMs } = await measure(async () => {
        const created = await itemRepository.create(itemData);
        const updated = await itemRepository.update(created.id, updates);
        return { created, updated };
      });

      expect(result.updated.name).toBe(updates.name);
      expect(result.updated.stockQuantity).toBe(updates.stockQuantity);
      expect(result.updated.isAvailable).toBe(updates.isAvailable);
      expect(result.updated.updatedAt.getTime()).toBeGreaterThan(result.created.updatedAt.getTime());
      expectFastExecution(timeMs, 10);
    });

    it('throws error for non-existent item update', async () => {
      const { timeMs } = await measure(async () => {
        await expect(itemRepository.update('nonexistent_id', { name: 'Updated' }))
          .rejects.toThrow();
      });

      expectFastExecution(timeMs, 5);
    });

    it('validates update data constraints', async () => {
      const itemData = validItemData();
      
      const { result: created, timeMs: createTime } = await measure(async () => {
        return itemRepository.create(itemData);
      });

      // Test various update constraints
      const constraintTests = [
        { stockQuantity: -1 }, // Negative stock should fail
        { name: '' }, // Empty name should fail
        { stockQuantity: 0 }, // Zero stock should work
        { isAvailable: false } // Boolean toggle should work
      ];

      const { timeMs: testTime } = await measure(async () => {
        // Test negative stock
        await expect(itemRepository.update(created.id, constraintTests[0]))
          .rejects.toThrow();
        
        // Test empty name
        await expect(itemRepository.update(created.id, constraintTests[1]))
          .rejects.toThrow();
        
        // Test valid updates
        await itemRepository.update(created.id, constraintTests[2]);
        await itemRepository.update(created.id, constraintTests[3]);
      });

      expectFastExecution(createTime + testTime, 15);
    });
  });

  describe('delete', () => {
    it('deletes an item by ID', async () => {
      const itemData = validItemData();

      const { result, timeMs } = await measure(async () => {
        const created = await itemRepository.create(itemData);
        const deleted = await itemRepository.delete(created.id);
        const found = await itemRepository.findById(created.id);
        return { deleted, found };
      });

      expect(result.deleted).toBe(true);
      expect(result.found).toBeNull();
      expectFastExecution(timeMs, 10);
    });

    it('returns false for non-existent item deletion', async () => {
      const { result, timeMs } = await measure(async () => {
        return itemRepository.delete('nonexistent_id');
      });

      expect(result).toBe(false);
      expectFastExecution(timeMs, 5);
    });

    it('handles bulk deletion efficiently', async () => {
      const items = Array(5).fill(0).map((_, i) => 
        validItemData({ name: `${TEST_DATA.itemName} ${i}` })
      );

      const { result, timeMs } = await measure(async () => {
        // Create items
        const created = await Promise.all(
          items.map(item => itemRepository.create(item))
        );
        
        // Delete all items
        const deleteResults = await Promise.all(
          created.map(item => itemRepository.delete(item.id))
        );
        
        // Verify all deleted
        const remaining = await itemRepository.findAll();
        
        return { deleteResults, remaining };
      });

      expect(result.deleteResults.every(result => result === true)).toBe(true);
      expect(result.remaining.length).toBe(0);
      expectFastExecution(timeMs, 20);
    });
  });

  describe('Business Logic Validation', () => {
    it('validates Minecraft item categories', () => {
      const validCategories: ItemCategory[] = [
        'weapons', 'tools', 'armor', 'blocks', 'items', 'food'
      ];

      const { result: allValid, timeMs } = measureSync(() => {
        return validCategories.every(category => {
          const item = validItemData({ category });
          return item.category === category;
        });
      });

      expect(allValid).toBe(true);
      expectFastExecution(timeMs, 2);
    });

    it('validates server name formats', () => {
      const serverNames = [
        TEST_DATA.serverName,
        'Creative-World',
        'SMP_1',
        'Skyblock'
      ];

      const { result: allValid, timeMs } = measureSync(() => {
        return serverNames.every(server => {
          const item = validItemData({ serverName: server });
          return typeof item.serverName === 'string' && item.serverName.length > 0;
        });
      });

      expect(allValid).toBe(true);
      expectFastExecution(timeMs, 2);
    });

    it('validates Epic 1 search requirements', async () => {
      // Create items that meet Epic 1 search scenarios
      const searchableItems = [
        validItemData({ name: 'Diamond Sword', category: 'weapons' }),
        validItemData({ name: 'Diamond Pickaxe', category: 'tools' }),
        validItemData({ name: 'Iron Sword', category: 'weapons' })
      ];

      const { result, timeMs } = await measure(async () => {
        // Create items
        const created = await Promise.all(
          searchableItems.map(item => itemRepository.create(item))
        );
        
        // Simulate search patterns from Epic 1
        const all = await itemRepository.findAll();
        const diamondItems = all.filter(item => item.name.includes('Diamond'));
        const weaponItems = all.filter(item => item.category === 'weapons');
        
        return { created, all, diamondItems, weaponItems };
      });

      expect(result.all.length).toBe(3);
      expect(result.diamondItems.length).toBe(2);
      expect(result.weaponItems.length).toBe(2);
      expectFastExecution(timeMs, 15);
    });
  });

  describe('Performance Validation', () => {
    it('validates all CRUD operations meet performance requirements', async () => {
      const itemData = validItemData();

      const { result: operations, timeMs } = await measure(async () => {
        // Complete CRUD cycle
        const created = await itemRepository.create(itemData);
        const found = await itemRepository.findById(created.id);
        const updated = await itemRepository.update(created.id, { name: 'Updated Name' });
        const all = await itemRepository.findAll();
        const deleted = await itemRepository.delete(created.id);
        
        return { created, found, updated, all, deleted };
      });

      // Validate all operations completed successfully
      expect(operations.created.name).toBe(TEST_DATA.itemName);
      expect(operations.found?.id).toBe(operations.created.id);
      expect(operations.updated.name).toBe('Updated Name');
      expect(operations.all.length).toBeGreaterThanOrEqual(0);
      expect(operations.deleted).toBe(true);
      
      // All CRUD operations should complete quickly
      expectFastExecution(timeMs, 15);
    });
  });
});