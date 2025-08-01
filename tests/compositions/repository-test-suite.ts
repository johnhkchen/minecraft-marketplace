/**
 * Repository Test Composition Pattern
 * 
 * Provides standardized test suites for repository implementations
 * following DRY and SOLID principles with English-language-like descriptions.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../matchers/business-matchers.js';

export interface ValidationTestCase<T> {
  name: string;
  data: Partial<T>;
  expectedError: {
    type: string;
    code: string;
    message: string;
  };
}

export interface RepositoryTestConfig<TRepository, TEntity> {
  repositoryName: string;
  repositoryFactory: () => TRepository;
  validData: Partial<TEntity>;
  invalidDataCases: ValidationTestCase<TEntity>[];
  customTests?: (repository: TRepository) => void;
}

/**
 * Creates a standardized test suite for any repository implementation
 * This eliminates duplication and ensures consistent testing patterns across all repositories
 */
export function createRepositoryTestSuite<TRepository, TEntity>(
  config: RepositoryTestConfig<TRepository, TEntity>
) {
  return describe(`${config.repositoryName} - Standard Repository Behavior`, () => {
    let repository: TRepository;

    beforeEach(async () => {
      repository = config.repositoryFactory();
      // Clear any existing data for test isolation
      if ('clear' in repository && typeof (repository as any).clear === 'function') {
        await (repository as any).clear();
      }
    });

    afterEach(async () => {
      // Cleanup after each test
      if ('clear' in repository && typeof (repository as any).clear === 'function') {
        await (repository as any).clear();
      }
    });

    describe('Entity Creation', () => {
      it('should create entity with valid data and auto-generated fields', async () => {
        const created = await (repository as any).create(config.validData);
        
        // Standard repository expectations
        expect(created.id).toBeDefined();
        expect(typeof created.id).toBe('string');
        expect(created.createdAt).toBeInstanceOf(Date);
        expect(created.updatedAt).toBeInstanceOf(Date);
        
        // Verify provided data was stored
        Object.keys(config.validData).forEach(key => {
          if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
            expect(created[key]).toEqual((config.validData as any)[key]);
          }
        });
      });

      // Generate validation tests from configuration
      config.invalidDataCases.forEach(({ name, data, expectedError }) => {
        it(`should reject entity with ${name}`, async () => {
          await expect((repository as any).create(data))
            .rejects
            .toBeValidationError(expectedError.code, expectedError.message);
        });
      });
    });

    describe('Entity Retrieval', () => {
      it('should find entity by ID after creation', async () => {
        const created = await (repository as any).create(config.validData);
        const found = await (repository as any).findById(created.id);
        
        expect(found).toBeDefined();
        expect(found.id).toBe(created.id);
        expect(found.createdAt).toEqual(created.createdAt);
      });

      it('should return null for non-existent ID', async () => {
        const found = await (repository as any).findById('non_existent_id');
        expect(found).toBeNull();
      });
    });

    describe('Entity Updates', () => {
      it('should update entity fields while preserving ID and creation timestamp', async () => {
        const created = await (repository as any).create(config.validData);
        const originalCreatedAt = created.createdAt;
        const originalUpdatedAt = created.updatedAt;
        
        // Wait a small amount to ensure updatedAt changes
        await new Promise(resolve => setTimeout(resolve, 5));
        
        const updates = { description: 'Updated description' };
        const updated = await (repository as any).update(created.id, updates);
        
        expect(updated.id).toBe(created.id);
        expect(updated.createdAt).toEqual(originalCreatedAt);
        expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        expect(updated.description).toBe(updates.description);
      });

      it('should throw error when updating non-existent entity', async () => {
        await expect((repository as any).update('non_existent_id', { description: 'test' }))
          .rejects
          .toThrow('not found');
      });

      it('should prevent changing immutable fields', async () => {
        const created = await (repository as any).create(config.validData);
        
        // Attempt to change ID (should be ignored or rejected)
        const updated = await (repository as any).update(created.id, { 
          id: 'different_id',
          createdAt: new Date()
        });
        
        expect(updated.id).toBe(created.id);
        expect(updated.createdAt).toEqual(created.createdAt);
      });
    });

    describe('Entity Deletion', () => {
      it('should delete entity successfully', async () => {
        const created = await (repository as any).create(config.validData);
        const deleted = await (repository as any).delete(created.id);
        
        expect(deleted).toBe(true);
        
        // Verify entity is no longer findable
        const found = await (repository as any).findById(created.id);
        expect(found).toBeNull();
      });

      it('should return false when deleting non-existent entity', async () => {
        const deleted = await (repository as any).delete('non_existent_id');
        expect(deleted).toBe(false);
      });
    });

    // Run custom tests if provided
    if (config.customTests) {
      describe('Custom Business Logic', () => {
        config.customTests(repository);
      });
    }
  });
}

/**
 * Creates test configuration for Item repositories
 */
export function createItemRepositoryConfig(
  repositoryName: string,
  repositoryFactory: () => any,
  invalidDataCases: ValidationTestCase<any>[]
) {
  return {
    repositoryName,
    repositoryFactory,
    validData: {
      ownerId: 'user_123',
      name: 'Test Item',
      category: 'materials',
      minecraftId: 'test_item',
      stockQuantity: 1,
      isAvailable: true
    },
    invalidDataCases,
    customTests: (repository: any) => {
      describe('Item-Specific Business Logic', () => {
        it('should find items by owner', async () => {
          const ownerId = 'owner_123';
          const validData = {
            ownerId: 'user_123',
            name: 'Test Item',
            category: 'materials',
            minecraftId: 'test_item',
            stockQuantity: 1,
            isAvailable: true
          };
          const item1 = await repository.create({ ...validData, ownerId, name: 'Item 1' });
          const item2 = await repository.create({ ...validData, ownerId, name: 'Item 2' });
          const item3 = await repository.create({ ...validData, ownerId: 'different_owner', name: 'Item 3' });
          
          const ownerItems = await repository.findByOwnerId(ownerId);
          
          expect(ownerItems).toHaveLength(2);
          expect(ownerItems.map((item: any) => item.name).sort()).toEqual(['Item 1', 'Item 2']);
        });

        it('should find available items only', async () => {
          const validData = {
            ownerId: 'user_123',
            name: 'Test Item',
            category: 'materials',
            minecraftId: 'test_item',
            stockQuantity: 1,
            isAvailable: true
          };
          await repository.create({ ...validData, name: 'Available Item', isAvailable: true, stockQuantity: 5 });
          await repository.create({ ...validData, name: 'Unavailable Item', isAvailable: false, stockQuantity: 5 });
          await repository.create({ ...validData, name: 'Out of Stock Item', isAvailable: true, stockQuantity: 0 });
          
          const availableItems = await repository.findAvailable();
          
          expect(availableItems).toHaveLength(1);
          expect(availableItems[0].name).toBe('Available Item');
          expect(availableItems[0]).toBeAvailableItem();
        });

        it('should search items by name and description', async () => {
          const validData = {
            ownerId: 'user_123',
            name: 'Test Item',
            category: 'materials',
            minecraftId: 'test_item',
            stockQuantity: 1,
            isAvailable: true
          };
          await repository.create({ 
            ...validData, 
            name: 'Diamond Sword', 
            description: 'Sharp weapon' 
          });
          await repository.create({ 
            ...validData, 
            name: 'Iron Tool', 
            description: 'Contains diamond dust' 
          });
          await repository.create({ 
            ...validData, 
            name: 'Stone Block', 
            description: 'Basic building material' 
          });
          
          const searchResults = await repository.search('diamond');
          
          expect(searchResults).toHaveSearchResults(2);
          expect(searchResults).toContainMinecraftItem('Diamond Sword');
          expect(searchResults).toContainMinecraftItem('Iron Tool');
        });

        it('should filter items by category', async () => {
          const validData = {
            ownerId: 'user_123',
            name: 'Test Item',
            category: 'materials',
            minecraftId: 'test_item',
            stockQuantity: 1,
            isAvailable: true
          };
          await repository.create({ ...validData, name: 'Diamond Sword', category: 'weapons' });
          await repository.create({ ...validData, name: 'Iron Pickaxe', category: 'tools' });
          await repository.create({ ...validData, name: 'Stone Block', category: 'blocks' });
          
          const weaponItems = await repository.findAvailable({ category: 'weapons' });
          
          expect(weaponItems).toHaveLength(1);
          expect(weaponItems[0].name).toBe('Diamond Sword');
          expect(weaponItems[0].category).toBe('weapons');
        });
      });
    }
  };
}

/**
 * Creates test configuration for User repositories
 */
export function createUserRepositoryConfig(
  repositoryName: string,
  repositoryFactory: () => any,
  invalidDataCases: ValidationTestCase<any>[]
) {
  return {
    repositoryName,
    repositoryFactory,
    validData: {
      discordId: '123456789012345678',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
      isActive: true
    },
    invalidDataCases,
    customTests: (repository: any) => {
      describe('User-Specific Business Logic', () => {
        it('should find user by Discord ID', async () => {
          const discordId = '987654321098765432';
          const created = await repository.create({ 
            ...repository.validData, 
            discordId, 
            username: 'discord_user' 
          });
          
          const found = await repository.findByDiscordId(discordId);
          
          expect(found).toBeDefined();
          expect(found.discordId).toBe(discordId);
          expect(found.username).toBe('discord_user');
          expect(found).toBeValidUser();
        });

        it('should find users by role', async () => {
          await repository.create({ ...repository.validData, username: 'user1', role: 'user' });
          await repository.create({ ...repository.validData, discordId: '111', username: 'owner1', role: 'shop_owner' });
          await repository.create({ ...repository.validData, discordId: '222', username: 'owner2', role: 'shop_owner' });
          await repository.create({ ...repository.validData, discordId: '333', username: 'mod1', role: 'moderator' });
          
          const shopOwners = await repository.findByRole('shop_owner');
          
          expect(shopOwners).toHaveLength(2);
          expect(shopOwners.map((user: any) => user.username).sort()).toEqual(['owner1', 'owner2']);
          shopOwners.forEach((user: any) => {
            expect(user).toBeValidUser();
            expect(user.role).toBe('shop_owner');
          });
        });

        it('should find active users only', async () => {
          await repository.create({ ...repository.validData, username: 'active_user', isActive: true });
          await repository.create({ ...repository.validData, discordId: '111', username: 'inactive_user', isActive: false });
          
          const activeUsers = await repository.findActive();
          
          expect(activeUsers).toHaveLength(1);
          expect(activeUsers[0].username).toBe('active_user');
          expect(activeUsers[0].isActive).toBe(true);
        });
      });
    }
  };
}

/**
 * Creates test configuration for Price repositories
 */
export function createPriceRepositoryConfig(
  repositoryName: string,
  repositoryFactory: () => any,
  invalidDataCases: ValidationTestCase<any>[]
) {
  return {
    repositoryName,
    repositoryFactory,
    validData: {
      itemId: 'item_123',
      priceDiamonds: 5.5,
      tradingUnit: 'per_item',
      isCurrent: true,
      source: 'owner',
      createdBy: 'user_123'
    },
    invalidDataCases,
    customTests: (repository: any) => {
      describe('Price-Specific Business Logic', () => {
        it('should find prices by item ID', async () => {
          const itemId = 'item_456';
          const price1 = await repository.create({ ...repository.validData, itemId, priceDiamonds: 5.0 });
          const price2 = await repository.create({ ...repository.validData, itemId, priceDiamonds: 6.0, isCurrent: false });
          
          const itemPrices = await repository.findByItemId(itemId);
          
          expect(itemPrices).toHaveLength(2);
          itemPrices.forEach((price: any) => {
            expect(price).toBeValidPrice();
            expect(price.itemId).toBe(itemId);
          });
        });

        it('should find current prices only', async () => {
          const itemId = 'item_789';
          await repository.create({ ...repository.validData, itemId, priceDiamonds: 5.0, isCurrent: true });
          await repository.create({ ...repository.validData, itemId, priceDiamonds: 4.0, isCurrent: false });
          
          const currentPrices = await repository.findCurrentPrices();
          
          expect(currentPrices).toHaveLength(1);
          expect(currentPrices[0].priceDiamonds).toBe(5.0);
          expect(currentPrices[0].isCurrent).toBe(true);
        });

        it('should update price history when setting new current price', async () => {
          const itemId = 'item_update';
          const oldPrice = await repository.create({ 
            ...repository.validData, 
            itemId, 
            priceDiamonds: 10.0, 
            isCurrent: true 
          });
          
          // Create new current price - should mark old one as not current
          const newPrice = await repository.create({ 
            ...repository.validData, 
            itemId, 
            priceDiamonds: 12.0, 
            isCurrent: true 
          });
          
          const allPrices = await repository.findByItemId(itemId);
          const currentPrices = allPrices.filter((p: any) => p.isCurrent);
          
          expect(allPrices).toHaveLength(2);
          expect(currentPrices).toHaveLength(1);
          expect(currentPrices[0].priceDiamonds).toBe(12.0);
        });
      });
    }
  };
}