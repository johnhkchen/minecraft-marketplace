/**
 * PostgREST Data Mapper
 * REFACTOR: Extract complex data transformation logic for better maintainability
 */

import type { ListingWithDetails } from '../../types/marketplace.js';

/**
 * Maps PostgREST public_items response to domain objects
 */
export class PostgRESTDataMapper {
  
  /**
   * Transform single PostgREST item to ListingWithDetails
   */
  static mapToListingWithDetails(item: any): ListingWithDetails {
    return {
      listing_id: this.parseId(item.id),
      seller_id: this.mapSellerId(item.owner_id),
      item_id: this.mapItemId(item.minecraft_id),
      date_created: this.mapTimestamp(item.created_at),
      qty: this.mapQuantity(item.stock_quantity),
      price: this.mapPrice(item.price_diamonds),
      description: this.mapDescription(item.description),
      is_active: this.mapActiveStatus(item.is_available),
      inventory_unit: this.mapTradingUnit(item.trading_unit),
      listing_type: this.mapListingType(item.listing_type),
      item_name: this.mapItemName(item.name),
      seller_name: this.mapSellerName(item.owner_username),
      stall_id: this.mapStallId(item.shop_location),
      item_category: this.mapItemCategory(item.category),
      server_name: this.mapServerName(item.server_name)
    };
  }

  /**
   * Transform array of PostgREST items
   */
  static mapToListingArray(items: any[]): ListingWithDetails[] {
    if (!Array.isArray(items)) {
      throw new Error('Invalid data: expected array of items');
    }
    
    return items.map(item => this.mapToListingWithDetails(item));
  }

  /**
   * Add distance information for proximity search results
   */
  static addDistanceData(
    listings: ListingWithDetails[], 
    distanceCalculator: (item: ListingWithDetails, index: number) => number
  ): (ListingWithDetails & { distance: number })[] {
    return listings
      .map((item, index) => ({
        ...item,
        distance: distanceCalculator(item, index)
      }))
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Add coordinate information for coordinate-based search
   */
  static addCoordinateData(
    listings: ListingWithDetails[],
    coordinateGenerator: (item: ListingWithDetails, index: number) => { x: number, y: number, z: number }
  ): (ListingWithDetails & { coordinates: { x: number, y: number, z: number } })[] {
    return listings.map((item, index) => ({
      ...item,
      coordinates: coordinateGenerator(item, index)
    }));
  }

  // Private mapping methods for clean separation of concerns

  private static parseId(id: any): number {
    if (typeof id === 'number') return id;
    if (typeof id === 'string') {
      const parsed = parseInt(id, 10);
      if (isNaN(parsed)) {
        throw new Error(`Invalid ID format: ${id}`);
      }
      return parsed;
    }
    throw new Error(`Invalid ID type: ${typeof id}`);
  }

  private static mapSellerId(ownerId: any): string {
    return ownerId?.toString() || 'unknown';
  }

  private static mapItemId(minecraftId: any): string {
    if (!minecraftId) {
      throw new Error('Missing minecraft_id in item data');
    }
    return minecraftId.toString();
  }

  private static mapTimestamp(timestamp: any): string {
    if (!timestamp) {
      return new Date().toISOString();
    }
    
    // Ensure we have a valid ISO string
    try {
      return new Date(timestamp).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  private static mapQuantity(quantity: any): number {
    const qty = Number(quantity);
    return isNaN(qty) || qty < 0 ? 0 : qty;
  }

  private static mapPrice(price: any): number {
    const priceNum = Number(price);
    return isNaN(priceNum) || priceNum < 0 ? 0 : priceNum;
  }

  private static mapDescription(description: any): string | undefined {
    return description?.toString().trim() || undefined;
  }

  private static mapActiveStatus(isAvailable: any): boolean {
    return Boolean(isAvailable);
  }

  private static mapTradingUnit(tradingUnit: any): string {
    const unitMap: Record<string, string> = {
      'per_item': 'per item',
      'per_stack': 'per stack', 
      'per_shulker': 'per shulker',
      'per_dozen': 'per dozen'
    };

    return unitMap[tradingUnit] || 'per item';
  }

  private static mapListingType(listingType: any): 'buy' | 'sell' {
    return listingType === 'buy' ? 'buy' : 'sell';
  }

  private static mapItemName(name: any): string {
    if (!name) {
      throw new Error('Missing item name in data');
    }
    return name.toString().trim();
  }

  private static mapSellerName(ownerUsername: any): string {
    return ownerUsername?.toString().trim() || 'Unknown Seller';
  }

  private static mapStallId(shopLocation: any): string | undefined {
    return shopLocation?.toString().trim() || undefined;
  }

  private static mapItemCategory(category: any): string {
    return category?.toString().trim() || 'items';
  }

  private static mapServerName(serverName: any): string {
    return serverName?.toString().trim() || 'Unknown Server';
  }
}

/**
 * Domain-specific mappers for different search contexts
 */
export class LocationSearchMapper {
  
  /**
   * Calculate mock distance for proximity search
   * TODO: Replace with real coordinate-based distance calculation
   */
  static calculateMockDistance(item: ListingWithDetails, index: number): number {
    return index * 0.5; // Simple mock implementation
  }

  /**
   * Generate mock coordinates for coordinate search
   * TODO: Replace with real coordinate lookup from database
   */
  static generateMockCoordinates(
    baseX: number, 
    baseY: number, 
    baseZ: number
  ): (item: ListingWithDetails, index: number) => { x: number, y: number, z: number } {
    return (item: ListingWithDetails, index: number) => ({
      x: baseX + (index * 10),
      y: baseY + (index * 5),
      z: baseZ + (index * 10)
    });
  }
}

/**
 * Data validation utilities
 */
export class DataValidator {
  
  /**
   * Validate PostgREST item has required fields
   */
  static validatePostgrestItem(item: any): void {
    const requiredFields = ['id', 'name', 'minecraft_id'];
    
    for (const field of requiredFields) {
      if (!item[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  /**
   * Validate array of PostgREST items
   */
  static validatePostgrestArray(items: any[]): void {
    if (!Array.isArray(items)) {
      throw new Error('Expected array of items');
    }
    
    items.forEach((item, index) => {
      try {
        this.validatePostgrestItem(item);
      } catch (error) {
        throw new Error(`Invalid item at index ${index}: ${error.message}`);
      }
    });
  }
}