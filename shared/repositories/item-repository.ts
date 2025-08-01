/**
 * TDD GREEN Phase: Minimal ItemRepository Implementation
 * 
 * Implements the absolute minimum to make tests pass.
 * Based on business rules surfaced by failing tests.
 */

import type { Item, ItemCategory, TradingUnitType } from '../types/service-interfaces.js';

/**
 * Micro TDD: Add specific error types for better error handling
 */
export class ItemValidationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'ItemValidationError';
  }
}

export interface IItemRepository {
  create(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item>;
  findById(id: string): Promise<Item | null>;
  findAll(): Promise<Item[]>;
  findByOwnerId(ownerId: string): Promise<Item[]>;
  findByMinecraftId(minecraftId: string): Promise<Item[]>;
  update(id: string, updates: Partial<Item>): Promise<Item>;
  delete(id: string): Promise<boolean>;
  findAvailable(filters?: { category?: ItemCategory; serverName?: string }): Promise<Item[]>;
  search(query: string): Promise<Item[]>;
}

/**
 * GREEN Phase Implementation: Minimal in-memory storage
 */
export class ItemRepository implements IItemRepository {
  private items: Map<string, Item> = new Map();
  private nextId = 1;

  async create(itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
    // Micro TDD: Use specific error type instead of generic Error
    if (!itemData.ownerId || itemData.ownerId.trim() === '') {
      throw new ItemValidationError('Owner ID is required', 'INVALID_OWNER_ID');
    }

    // Micro TDD GREEN: Add item name validation
    if (!itemData.name || itemData.name.trim() === '') {
      throw new ItemValidationError('Item name is required', 'INVALID_ITEM_NAME');
    }

    if (itemData.stockQuantity < 0) {
      throw new ItemValidationError('Stock quantity cannot be negative', 'INVALID_STOCK_QUANTITY');
    }

    // Basic Minecraft ID format validation (lowercase with underscores)
    if (!/^[a-z_]+$/.test(itemData.minecraftId)) {
      throw new ItemValidationError('Invalid Minecraft ID format', 'INVALID_MINECRAFT_ID');
    }

    const now = new Date();
    const id = `item_${this.nextId++}`;

    const item: Item = {
      id,
      ownerId: itemData.ownerId,
      name: itemData.name,
      description: itemData.description,
      processedDescription: itemData.processedDescription,
      category: itemData.category,
      minecraftId: itemData.minecraftId,
      enchantments: itemData.enchantments,
      itemAttributes: itemData.itemAttributes,
      stockQuantity: itemData.stockQuantity,
      isAvailable: itemData.isAvailable,
      serverName: itemData.serverName,
      shopLocation: itemData.shopLocation,
      createdAt: now,
      updatedAt: now
    };

    this.items.set(id, item);
    return item;
  }

  async findById(id: string): Promise<Item | null> {
    return this.items.get(id) || null;
  }

  async findAll(): Promise<Item[]> {
    return Array.from(this.items.values());
  }

  async findByOwnerId(ownerId: string): Promise<Item[]> {
    const items: Item[] = [];
    for (const item of this.items.values()) {
      if (item.ownerId === ownerId) {
        items.push(item);
      }
    }
    return items;
  }

  async findByMinecraftId(minecraftId: string): Promise<Item[]> {
    const items: Item[] = [];
    for (const item of this.items.values()) {
      if (item.minecraftId === minecraftId) {
        items.push(item);
      }
    }
    return items;
  }

  async update(id: string, updates: Partial<Item>): Promise<Item> {
    const existingItem = this.items.get(id);
    if (!existingItem) {
      throw new Error(`Item with id ${id} not found`);
    }

    // Business rule: prevent changing ownership
    if (updates.ownerId && updates.ownerId !== existingItem.ownerId) {
      throw new Error('Cannot change item ownership');
    }

    // Business rule: validate stock quantity
    if (updates.stockQuantity !== undefined && updates.stockQuantity < 0) {
      throw new ItemValidationError('Stock quantity cannot be negative', 'INVALID_STOCK_QUANTITY');
    }

    // Business rule: validate item name
    if (updates.name !== undefined && (!updates.name || updates.name.trim() === '')) {
      throw new ItemValidationError('Item name is required', 'INVALID_ITEM_NAME');
    }

    const updatedItem: Item = {
      ...existingItem,
      ...updates,
      id: existingItem.id, // Prevent ID changes
      ownerId: existingItem.ownerId, // Prevent ownership changes
      createdAt: existingItem.createdAt, // Prevent createdAt changes
      updatedAt: new Date(Date.now() + 1) // Always update timestamp with slight offset
    };

    this.items.set(id, updatedItem);
    return updatedItem;
  }

  async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  async findAvailable(filters?: { category?: ItemCategory; serverName?: string }): Promise<Item[]> {
    const items: Item[] = [];
    
    for (const item of this.items.values()) {
      // Only available items with stock > 0
      if (!item.isAvailable || item.stockQuantity <= 0) {
        continue;
      }

      // Apply category filter if provided
      if (filters?.category && item.category !== filters.category) {
        continue;
      }

      // Apply server filter if provided
      if (filters?.serverName && item.serverName !== filters.serverName) {
        continue;
      }

      items.push(item);
    }

    return items;
  }

  async search(query: string): Promise<Item[]> {
    // Micro TDD Step 10: Input sanitization for search queries
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return []; // Return empty array for empty or whitespace-only queries
    }

    // Micro TDD Step 12: Minimum length requirement for performance
    if (trimmedQuery.length < 2) {
      return []; // Require at least 2 characters to prevent overly broad searches
    }

    const items: Item[] = [];
    const searchTerm = trimmedQuery.toLowerCase();

    for (const item of this.items.values()) {
      // Micro TDD: Enhanced search includes both name and description
      const nameMatch = item.name.toLowerCase().includes(searchTerm);
      const descriptionMatch = item.description?.toLowerCase().includes(searchTerm) || false;
      
      if (nameMatch || descriptionMatch) {
        items.push(item);
      }
    }

    return items;
  }

  // Helper method for testing - clear all data
  async clear(): Promise<void> {
    this.items.clear();
    this.nextId = 1;
  }
}