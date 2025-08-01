/**
 * TDD GREEN Phase: Minimal UserRepository Implementation
 * 
 * This implements the absolute minimum to make tests pass.
 * No validation or error handling yet - just basic CRUD operations.
 */

import type { User, UserRole } from '../types/service-interfaces.js';

export interface IUserRepository {
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByDiscordId(discordId: string): Promise<User | null>;
  update(id: string, updates: Partial<User>): Promise<User>;
  delete(id: string): Promise<boolean>;
  findByRole(role: UserRole): Promise<User[]>;
}

/**
 * GREEN Phase Implementation: Minimal in-memory storage
 */
export class UserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();
  private discordIdIndex: Map<string, string> = new Map(); // discordId -> userId
  private nextId = 1;

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    // REFACTOR Phase: Enhanced validation based on failing tests
    if (!userData.discordId || userData.discordId.trim() === '') {
      throw new Error('Discord ID is required');
    }
    
    if (!userData.username || userData.username.trim() === '') {
      throw new Error('Username is required');
    }

    // Business rule surfaced by failing test: prevent duplicate Discord IDs
    if (this.discordIdIndex.has(userData.discordId)) {
      throw new Error(`User with Discord ID ${userData.discordId} already exists`);
    }

    // Business rule surfaced by failing test: validate email format when provided
    if (userData.email && !this.isValidEmail(userData.email)) {
      throw new Error('Invalid email format');
    }

    // Business rule surfaced by failing test: enforce username length limits
    if (userData.username.length > 100) {
      throw new Error('Username too long');
    }
    
    const now = new Date();
    const id = `user_${this.nextId++}`;
    
    const user: User = {
      id,
      discordId: userData.discordId,
      username: userData.username,
      email: userData.email,
      avatarUrl: userData.avatarUrl,
      shopName: userData.shopName,
      role: userData.role,
      isActive: userData.isActive,
      createdAt: now,
      updatedAt: now
    };

    this.users.set(id, user);
    this.discordIdIndex.set(userData.discordId, id);
    
    return user;
  }

  /**
   * Email validation helper - surfaced by failing test
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByDiscordId(discordId: string): Promise<User | null> {
    const userId = this.discordIdIndex.get(discordId);
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      throw new Error(`User with id ${id} not found`);
    }

    const updatedUser: User = {
      ...existingUser,
      ...updates,
      id: existingUser.id, // Prevent ID changes
      createdAt: existingUser.createdAt, // Prevent createdAt changes
      updatedAt: new Date() // Always update timestamp
    };

    this.users.set(id, updatedUser);
    
    // Update discord index if discordId changed
    if (updates.discordId && updates.discordId !== existingUser.discordId) {
      this.discordIdIndex.delete(existingUser.discordId);
      this.discordIdIndex.set(updates.discordId, id);
    }

    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    this.users.delete(id);
    this.discordIdIndex.delete(user.discordId);
    return true;
  }

  async findByRole(role: UserRole): Promise<User[]> {
    const users: User[] = [];
    for (const user of this.users.values()) {
      if (user.role === role) {
        users.push(user);
      }
    }
    return users;
  }

  // Helper method for testing - clear all data
  async clear(): Promise<void> {
    this.users.clear();
    this.discordIdIndex.clear();
    this.nextId = 1;
  }
}