/**
 * Fast UserRepository Tests - DI Pattern
 * 
 * Testing user management functionality with dependency injection:
 * - Discord OAuth integration with steve/alex/notch usernames
 * - Role-based access control for marketplace
 * - Performance validation (<10ms per test)
 * - Zero external dependencies
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { User, UserRole } from '../../../workspaces/shared/types/service-interfaces.js';
import { UserRepository, type IUserRepository } from '../../../workspaces/shared/repositories/user-repository.js';
import { ServiceContainer } from '../../../workspaces/shared/di/container.js';
import { measure, expectFastExecution } from '../../utils/fast-test-setup.js';

// Minecraft domain test data
const TEST_DATA = {
  mainTrader: 'steve',
  altTrader: 'alex',
  adminUser: 'notch',
  discordIds: {
    steve: 'discord_steve_123',
    alex: 'discord_alex_456',
    notch: 'discord_notch_admin'
  },
  emails: {
    steve: 'steve@hermitcraft.com',
    alex: 'alex@smp-live.com',
    notch: 'notch@mojang.com'
  },
  shops: {
    steve: 'Steve\'s Diamond Emporium',
    alex: 'Alex\'s Iron Works',
    notch: 'Notch\'s Admin Shop'
  }
};

describe('UserRepository - DI Fast', () => {
  let container: ServiceContainer;
  let userRepository: IUserRepository;

  beforeEach(async () => {
    container = new ServiceContainer();
    container.register('userRepository', () => new UserRepository());
    userRepository = container.get<IUserRepository>('userRepository');
    
    // Clear in-memory data between tests  
    if (userRepository instanceof UserRepository) {
      await userRepository.clear();
    }
  });

  describe('create', () => {
    it('should create steve user with auto-generated ID and timestamps', async () => {
      const { result: createdUser, timeMs } = await measure(async () => {
        return userRepository.create({
          discordId: TEST_DATA.discordIds.steve,
          username: TEST_DATA.mainTrader,
          email: TEST_DATA.emails.steve,
          avatarUrl: 'https://crafatar.com/avatars/steve',
          shopName: TEST_DATA.shops.steve,
          role: 'user' as UserRole,
          isActive: true
        });
      });

      expectFastExecution(timeMs, 10);
      expect(createdUser.id).toBeDefined();
      expect(typeof createdUser.id).toBe('string');
      expect(createdUser.discordId).toBe(TEST_DATA.discordIds.steve);
      expect(createdUser.username).toBe(TEST_DATA.mainTrader);
      expect(createdUser.email).toBe(TEST_DATA.emails.steve);
      expect(createdUser.shopName).toBe(TEST_DATA.shops.steve);
      expect(createdUser.createdAt).toBeInstanceOf(Date);
      expect(createdUser.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle alex user with missing optional fields', async () => {
      const { result: createdUser, timeMs } = await measure(async () => {
        return userRepository.create({
          discordId: TEST_DATA.discordIds.alex,
          username: TEST_DATA.altTrader,
          role: 'user' as UserRole,
          isActive: true
        });
      });

      expectFastExecution(timeMs, 5);
      expect(createdUser.id).toBeDefined();
      expect(createdUser.discordId).toBe(TEST_DATA.discordIds.alex);
      expect(createdUser.username).toBe(TEST_DATA.altTrader);
      expect(createdUser.email).toBeUndefined();
      expect(createdUser.avatarUrl).toBeUndefined();
      expect(createdUser.shopName).toBeUndefined();
    });

    it('should reject empty Discord ID with fast validation', async () => {
      const { timeMs } = await measure(async () => {
        await expect(userRepository.create({
          discordId: '', // Empty Discord ID should fail
          username: TEST_DATA.mainTrader,
          role: 'user' as UserRole,
          isActive: true
        })).rejects.toThrow('Discord ID is required');
      });

      expectFastExecution(timeMs, 5);
    });

    it('should reject empty username with performance tracking', async () => {
      const { timeMs } = await measure(async () => {
        await expect(userRepository.create({
          discordId: TEST_DATA.discordIds.steve,
          username: '', // Empty username should fail
          role: 'user' as UserRole,
          isActive: true
        })).rejects.toThrow('Username is required');
      });

      expectFastExecution(timeMs, 5);
    });

    it('should reject duplicate Discord IDs between steve and alex', async () => {
      // Create steve first
      await userRepository.create({
        discordId: TEST_DATA.discordIds.steve,
        username: TEST_DATA.mainTrader,
        role: 'user' as UserRole,
        isActive: true
      });

      // Attempt to create alex with same Discord ID
      const { timeMs } = await measure(async () => {
        await expect(userRepository.create({
          discordId: TEST_DATA.discordIds.steve, // Duplicate Discord ID
          username: TEST_DATA.altTrader,
          role: 'user' as UserRole,
          isActive: true
        })).rejects.toThrow(`User with Discord ID ${TEST_DATA.discordIds.steve} already exists`);
      });

      expectFastExecution(timeMs, 10);
    });

    it('should validate email format for notch admin', async () => {
      const { timeMs } = await measure(async () => {
        await expect(userRepository.create({
          discordId: TEST_DATA.discordIds.notch,
          username: TEST_DATA.adminUser,
          email: 'not-an-email', // Invalid email format
          role: 'admin' as UserRole,
          isActive: true
        })).rejects.toThrow('Invalid email format');
      });

      expectFastExecution(timeMs, 5);
    });

    it('should enforce username length limits with fast execution', async () => {
      const { timeMs } = await measure(async () => {
        await expect(userRepository.create({
          discordId: TEST_DATA.discordIds.steve,
          username: 'a'.repeat(101), // Too long username
          role: 'user' as UserRole,
          isActive: true
        })).rejects.toThrow('Username too long');
      });

      expectFastExecution(timeMs, 5);
    });
  });

  describe('findById', () => {
    it('should return steve user when ID exists', async () => {
      const createdUser = await userRepository.create({
        discordId: TEST_DATA.discordIds.steve,
        username: TEST_DATA.mainTrader,
        role: 'user' as UserRole,
        isActive: true
      });

      const { result, timeMs } = await measure(async () => {
        return userRepository.findById(createdUser.id);
      });

      expectFastExecution(timeMs, 5);
      expect(result).toBeDefined();
      expect(result?.username).toBe(TEST_DATA.mainTrader);
      expect(result?.discordId).toBe(TEST_DATA.discordIds.steve);
    });

    it('should return null when ID does not exist', async () => {
      const { result, timeMs } = await measure(async () => {
        return userRepository.findById('minecraft:nonexistent_user');
      });

      expectFastExecution(timeMs, 5);
      expect(result).toBeNull();
    });
  });

  describe('findByDiscordId', () => {
    it('should find alex user by Discord ID', async () => {
      await userRepository.create({
        discordId: TEST_DATA.discordIds.alex,
        username: TEST_DATA.altTrader,
        shopName: TEST_DATA.shops.alex,
        role: 'shop_owner' as UserRole,
        isActive: true
      });

      const { result, timeMs } = await measure(async () => {
        return userRepository.findByDiscordId(TEST_DATA.discordIds.alex);
      });

      expectFastExecution(timeMs, 5);
      expect(result).toBeDefined();
      expect(result?.username).toBe(TEST_DATA.altTrader);
      expect(result?.shopName).toBe(TEST_DATA.shops.alex);
      expect(result?.role).toBe('shop_owner');
    });

    it('should return null for nonexistent Discord ID', async () => {
      const { result, timeMs } = await measure(async () => {
        return userRepository.findByDiscordId('discord_nonexistent_123');
      });

      expectFastExecution(timeMs, 5);
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update steve to shop owner with new shop name', async () => {
      const createdUser = await userRepository.create({
        discordId: TEST_DATA.discordIds.steve,
        username: TEST_DATA.mainTrader,
        role: 'user' as UserRole,
        isActive: true
      });
      
      const { result, timeMs } = await measure(async () => {
        return userRepository.update(createdUser.id, { 
          role: 'shop_owner' as UserRole,
          shopName: TEST_DATA.shops.steve
        });
      });
      
      expectFastExecution(timeMs, 10);
      expect(result.role).toBe('shop_owner');
      expect(result.shopName).toBe(TEST_DATA.shops.steve);
      expect(result.username).toBe(TEST_DATA.mainTrader);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.id).toBe(createdUser.id);
    });

    it('should update alex email and avatar with fast execution', async () => {
      const createdUser = await userRepository.create({
        discordId: TEST_DATA.discordIds.alex,
        username: TEST_DATA.altTrader,
        role: 'user' as UserRole,
        isActive: true
      });
      
      const { result, timeMs } = await measure(async () => {
        return userRepository.update(createdUser.id, {
          email: TEST_DATA.emails.alex,
          avatarUrl: 'https://crafatar.com/avatars/alex'
        });
      });
      
      expectFastExecution(timeMs, 10);
      expect(result.email).toBe(TEST_DATA.emails.alex);
      expect(result.avatarUrl).toBe('https://crafatar.com/avatars/alex');
      expect(result.username).toBe(TEST_DATA.altTrader);
    });
  });

  describe('delete', () => {
    it('should delete steve user and return true', async () => {
      const createdUser = await userRepository.create({
        discordId: TEST_DATA.discordIds.steve,
        username: TEST_DATA.mainTrader,
        shopName: TEST_DATA.shops.steve,
        role: 'shop_owner' as UserRole,
        isActive: true
      });
      
      const { result, timeMs } = await measure(async () => {
        return userRepository.delete(createdUser.id);
      });

      expectFastExecution(timeMs, 10);
      expect(result).toBe(true);
      
      // Verify steve is actually deleted
      const deletedUser = await userRepository.findById(createdUser.id);
      expect(deletedUser).toBeNull();
    });

    it('should return false when user does not exist', async () => {
      const { result, timeMs } = await measure(async () => {
        return userRepository.delete('minecraft:nonexistent_id');
      });

      expectFastExecution(timeMs, 5);
      expect(result).toBe(false);
    });
  });

  describe('findByRole', () => {
    it('should return all shop owners (steve, alex, notch)', async () => {
      // Create multiple shop owners
      await userRepository.create({
        discordId: TEST_DATA.discordIds.steve,
        username: TEST_DATA.mainTrader,
        shopName: TEST_DATA.shops.steve,
        role: 'shop_owner' as UserRole,
        isActive: true
      });

      await userRepository.create({
        discordId: TEST_DATA.discordIds.alex,
        username: TEST_DATA.altTrader,
        shopName: TEST_DATA.shops.alex,
        role: 'shop_owner' as UserRole,
        isActive: true
      });

      await userRepository.create({
        discordId: TEST_DATA.discordIds.notch,
        username: TEST_DATA.adminUser,
        role: 'admin' as UserRole, // Different role
        isActive: true
      });

      const { result, timeMs } = await measure(async () => {
        return userRepository.findByRole('shop_owner' as UserRole);
      });

      expectFastExecution(timeMs, 10);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      
      const usernames = result.map(u => u.username).sort();
      expect(usernames).toEqual([TEST_DATA.altTrader, TEST_DATA.mainTrader]);
      
      const shopNames = result.map(u => u.shopName).sort();
      expect(shopNames).toEqual([TEST_DATA.shops.alex, TEST_DATA.shops.steve]);
    });

    it('should return empty array for role with no users', async () => {
      const { result, timeMs } = await measure(async () => {
        return userRepository.findByRole('moderator' as UserRole);
      });

      expectFastExecution(timeMs, 5);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('minecraft marketplace business rules', () => {
    it('should support all user roles in minecraft context', async () => {
      const roles: UserRole[] = ['user', 'shop_owner', 'moderator', 'admin'];
      const users = [
        { username: TEST_DATA.mainTrader, discordId: TEST_DATA.discordIds.steve },
        { username: TEST_DATA.altTrader, discordId: TEST_DATA.discordIds.alex },
        { username: 'herobrine', discordId: 'discord_herobrine_mod' },
        { username: TEST_DATA.adminUser, discordId: TEST_DATA.discordIds.notch }
      ];

      const { timeMs } = await measure(async () => {
        for (let i = 0; i < roles.length; i++) {
          const user = await userRepository.create({
            discordId: users[i].discordId,
            username: users[i].username,
            role: roles[i],
            isActive: true
          });
          expect(user.role).toBe(roles[i]);
          expect(user.username).toBe(users[i].username);
        }
      });

      expectFastExecution(timeMs, 15);
    });

    it('should handle minecraft-style avatars and shops', async () => {
      const { result: user, timeMs } = await measure(async () => {
        return userRepository.create({
          discordId: TEST_DATA.discordIds.steve,
          username: TEST_DATA.mainTrader,
          email: TEST_DATA.emails.steve,
          avatarUrl: 'https://crafatar.com/avatars/steve',
          shopName: TEST_DATA.shops.steve,
          role: 'shop_owner' as UserRole,
          isActive: true
        });
      });

      expectFastExecution(timeMs, 10);
      expect(user.username).toBe(TEST_DATA.mainTrader);
      expect(user.avatarUrl).toBe('https://crafatar.com/avatars/steve');
      expect(user.shopName).toBe(TEST_DATA.shops.steve);
      expect(user.email).toBe(TEST_DATA.emails.steve);
    });
  });
});