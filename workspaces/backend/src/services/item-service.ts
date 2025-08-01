/**
 * Item Service Implementation
 * Foundation-first: Orchestrates repositories and business logic
 */

import { 
  ItemService, 
  Item, 
  CreateItemRequest, 
  SearchItemsRequest,
  ItemRepository,
  PriceRepository,
  Price,
  TradingUnitType
} from '@shared/types/service-interfaces';
import { v4 as uuidv4 } from 'uuid';

export class MinecraftItemService implements ItemService {
  constructor(
    private itemRepository: ItemRepository,
    private priceRepository: PriceRepository
  ) {}

  async createItem(itemData: CreateItemRequest, userId: string): Promise<Item> {
    // Create the item entity
    const item: Item = {
      id: uuidv4(),
      ownerId: userId,
      name: itemData.name,
      description: itemData.description,
      category: itemData.category,
      minecraftId: itemData.minecraftId,
      stockQuantity: itemData.stockQuantity,
      isAvailable: true,
      serverName: itemData.serverName,
      shopLocation: itemData.shopLocation,
      enchantments: {},
      itemAttributes: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save the item
    const savedItem = await this.itemRepository.save(item);

    // Create the initial price
    const price: Price = {
      id: uuidv4(),
      itemId: savedItem.id,
      priceDiamonds: itemData.price,
      tradingUnit: itemData.tradingUnit,
      isCurrent: true,
      source: 'owner',
      createdBy: userId,
      createdAt: new Date()
    };

    await this.priceRepository.save(price);

    return savedItem;
  }

  async updateItem(itemId: string, updates: Partial<Item>, userId: string): Promise<Item> {
    // Verify ownership or admin rights
    const existingItem = await this.itemRepository.findById(itemId);
    if (!existingItem) {
      throw new Error(`Item with id ${itemId} not found`);
    }

    if (existingItem.ownerId !== userId) {
      throw new Error('Unauthorized: You can only update your own items');
    }

    return await this.itemRepository.update(itemId, updates);
  }

  async deleteItem(itemId: string, userId: string): Promise<void> {
    // Verify ownership or admin rights
    const existingItem = await this.itemRepository.findById(itemId);
    if (!existingItem) {
      throw new Error(`Item with id ${itemId} not found`);
    }

    if (existingItem.ownerId !== userId) {
      throw new Error('Unauthorized: You can only delete your own items');
    }

    await this.itemRepository.delete(itemId);
  }

  async getItem(itemId: string): Promise<Item | null> {
    return await this.itemRepository.findById(itemId);
  }

  async searchItems(query: SearchItemsRequest): Promise<Item[]> {
    // If there's a text query, use search
    if (query.query) {
      return await this.itemRepository.searchItems(query.query);
    }

    // Otherwise use criteria-based filtering
    const criteria: Partial<Item> = {};
    
    if (query.category) {
      criteria.category = query.category;
    }

    if (query.serverName) {
      criteria.serverName = query.serverName;
    }

    if (query.availableOnly !== false) {
      criteria.isAvailable = true;
    }

    let items = await this.itemRepository.findAll(criteria);

    // Apply price filtering if specified
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      items = await this.filterByPrice(items, query.minPrice, query.maxPrice, query.tradingUnit);
    }

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    
    return items.slice(offset, offset + limit);
  }

  async getUserItems(userId: string): Promise<Item[]> {
    return await this.itemRepository.findByOwnerId(userId);
  }

  /**
   * Get items with their current prices (useful for listings)
   */
  async getItemsWithPrices(items: Item[]): Promise<Array<Item & { currentPrice?: Price }>> {
    const result = [];
    
    for (const item of items) {
      const prices = await this.priceRepository.findByItemId(item.id);
      const currentPrice = prices.find(p => p.isCurrent);
      
      result.push({
        ...item,
        currentPrice
      });
    }
    
    return result;
  }

  /**
   * Update item price
   */
  async updateItemPrice(
    itemId: string, 
    newPriceDiamonds: number, 
    tradingUnit: TradingUnitType, 
    userId: string
  ): Promise<Price> {
    // Verify ownership
    const item = await this.itemRepository.findById(itemId);
    if (!item) {
      throw new Error(`Item with id ${itemId} not found`);
    }

    if (item.ownerId !== userId) {
      throw new Error('Unauthorized: You can only update prices for your own items');
    }

    // Create new price
    const newPrice: Price = {
      id: uuidv4(),
      itemId,
      priceDiamonds: newPriceDiamonds,
      tradingUnit,
      isCurrent: true,
      source: 'owner',
      createdBy: userId,
      createdAt: new Date()
    };

    // Update current price (this will mark old prices as not current)
    await this.priceRepository.updateCurrentPrice(itemId, newPrice);

    return newPrice;
  }

  private async filterByPrice(
    items: Item[], 
    minPrice?: number, 
    maxPrice?: number, 
    tradingUnit?: TradingUnitType
  ): Promise<Item[]> {
    if (!minPrice && !maxPrice) {
      return items;
    }

    const filteredItems = [];
    
    for (const item of items) {
      const prices = await this.priceRepository.findByItemId(item.id);
      const currentPrice = prices.find(p => p.isCurrent);
      
      if (!currentPrice) continue;

      let priceToCompare = currentPrice.priceDiamonds;
      
      // Convert price to requested trading unit for comparison
      if (tradingUnit && currentPrice.tradingUnit !== tradingUnit) {
        // This would use the pricing service conversion
        // For now, we'll compare as-is
      }

      if (minPrice !== undefined && priceToCompare < minPrice) continue;
      if (maxPrice !== undefined && priceToCompare > maxPrice) continue;
      
      filteredItems.push(item);
    }
    
    return filteredItems;
  }
}