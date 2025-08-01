/**
 * TDD GREEN Phase: Minimal PriceRepository Implementation
 * 
 * Implements price management with diamond-based currency system.
 * Based on business rules from Epic 1 requirements and data model schema.
 */

import type { Price, TradingUnitType } from '../types/service-interfaces.js';

/**
 * Specific error types for price validation
 */
export class PriceValidationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'PriceValidationError';
  }
}

export interface IPriceRepository {
  create(price: Omit<Price, 'id' | 'createdAt'>): Promise<Price>;
  findCurrentByItemId(itemId: string): Promise<Price | null>;
  findHistoryByItemId(itemId: string): Promise<Price[]>;
  updateCurrentPrice(itemId: string, priceData: {
    priceDiamonds: number;
    tradingUnit: TradingUnitType;
    source: string;
    createdBy: string;
  }): Promise<Price>;
  findByTradingUnit(tradingUnit: TradingUnitType): Promise<Price[]>;
}

/**
 * GREEN Phase Implementation: Minimal in-memory storage
 */
export class PriceRepository implements IPriceRepository {
  private prices: Map<string, Price> = new Map();
  private nextId = 1;

  async create(priceData: Omit<Price, 'id' | 'createdAt'>): Promise<Price> {
    // Validation following business rules
    if (!priceData.itemId || priceData.itemId.trim() === '') {
      throw new PriceValidationError('Item ID is required', 'INVALID_ITEM_ID');
    }

    if (priceData.priceDiamonds < 0) {
      throw new PriceValidationError('Price cannot be negative', 'INVALID_PRICE');
    }

    if (!priceData.createdBy || priceData.createdBy.trim() === '') {
      throw new PriceValidationError('Created by user is required', 'INVALID_CREATED_BY');
    }

    // Use microsecond timestamp to ensure unique ordering
    const now = new Date(Date.now() + this.nextId);
    const id = `price_${this.nextId++}`;

    const price: Price = {
      id,
      itemId: priceData.itemId,
      priceDiamonds: priceData.priceDiamonds,
      tradingUnit: priceData.tradingUnit,
      isCurrent: priceData.isCurrent,
      source: priceData.source,
      createdBy: priceData.createdBy,
      createdAt: now
    };

    this.prices.set(id, price);
    return price;
  }

  async findCurrentByItemId(itemId: string): Promise<Price | null> {
    for (const price of this.prices.values()) {
      if (price.itemId === itemId && price.isCurrent) {
        return price;
      }
    }
    return null;
  }

  async findHistoryByItemId(itemId: string): Promise<Price[]> {
    const prices: Price[] = [];
    
    for (const price of this.prices.values()) {
      if (price.itemId === itemId) {
        prices.push(price);
      }
    }

    // Sort by creation date, most recent first
    return prices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateCurrentPrice(itemId: string, priceData: {
    priceDiamonds: number;
    tradingUnit: TradingUnitType;
    source: string;
    createdBy: string;
  }): Promise<Price> {
    // Validate input parameters
    if (!itemId || itemId.trim() === '') {
      throw new PriceValidationError('Item ID is required', 'INVALID_ITEM_ID');
    }

    // Find current price for this item
    const currentPrice = await this.findCurrentByItemId(itemId);
    
    if (!currentPrice) {
      throw new PriceValidationError(`No current price found for item ${itemId}`, 'PRICE_NOT_FOUND');
    }

    // Mark old price as non-current
    currentPrice.isCurrent = false;
    this.prices.set(currentPrice.id, currentPrice);

    // Create new current price
    const newPrice = await this.create({
      itemId,
      priceDiamonds: priceData.priceDiamonds,
      tradingUnit: priceData.tradingUnit,
      isCurrent: true,
      source: priceData.source,
      createdBy: priceData.createdBy
    });

    return newPrice;
  }

  async findByTradingUnit(tradingUnit: TradingUnitType): Promise<Price[]> {
    const prices: Price[] = [];
    
    for (const price of this.prices.values()) {
      if (price.tradingUnit === tradingUnit) {
        prices.push(price);
      }
    }

    return prices;
  }

  // Helper method for testing - clear all data
  async clear(): Promise<void> {
    this.prices.clear();
    this.nextId = 1;
  }
}