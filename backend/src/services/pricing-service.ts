/**
 * Pricing Service Implementation
 * Foundation-first: Implements business logic for diamond block pricing system
 */

import { 
  PricingService, 
  Item, 
  Price, 
  TradingUnitType 
} from '@shared/types/service-interfaces';

export class MinecraftPricingService implements PricingService {
  // Trading unit conversion rates (items per unit)
  private static readonly TRADING_UNIT_SIZES = {
    per_item: 1,
    per_stack: 64,
    per_shulker: 1728, // 64 * 27 slots
    per_dozen: 12
  } as const;

  calculatePrice(item: Item, tradingUnit: TradingUnitType): Price {
    // This would typically involve complex business logic
    // For now, return a basic structure
    throw new Error('calculatePrice not implemented - use existing prices from database');
  }

  formatPriceDisplay(price: Price): string {
    const { priceDiamonds, tradingUnit } = price;
    
    // Use price directly (already in diamonds)
    const priceInDiamonds = priceDiamonds;
    
    // Handle different trading units with human-readable formatting
    switch (tradingUnit) {
      case 'per_item':
        if (priceDiamonds >= 1) {
          return priceDiamonds === 1 
            ? '1 diamond block per item'
            : `${priceDiamonds} diamond blocks per item`;
        } else {
          return priceInDiamonds === 1
            ? '1 diamond per item'
            : `${priceInDiamonds} diamonds per item`;
        }
        
      case 'per_stack':
        if (priceDiamonds >= 1) {
          return priceDiamonds === 1
            ? '1 diamond block per stack'
            : `${priceDiamonds} diamond blocks per stack`;
        } else {
          return priceInDiamonds === 1
            ? '1 diamond per stack'
            : `${priceInDiamonds} diamonds per stack`;
        }
        
      case 'per_shulker':
        return priceDiamonds === 1
          ? '1 diamond block per shulker box'
          : `${priceDiamonds} diamond blocks per shulker box`;
          
      case 'per_dozen':
        if (priceDiamonds >= 1) {
          return priceDiamonds === 1
            ? '1 diamond block per dozen'
            : `${priceDiamonds} diamond blocks per dozen`;
        } else {
          return priceInDiamonds === 1
            ? '1 diamond per dozen'
            : `${priceInDiamonds} diamonds per dozen`;
        }
        
      default:
        return `${priceDiamonds} diamonds`;
    }
  }

  convertTradingUnits(
    price: Price, 
    fromUnit: TradingUnitType, 
    toUnit: TradingUnitType
  ): Price {
    if (fromUnit === toUnit) {
      return price;
    }

    const fromSize = MinecraftPricingService.TRADING_UNIT_SIZES[fromUnit];
    const toSize = MinecraftPricingService.TRADING_UNIT_SIZES[toUnit];
    
    // Calculate price per individual item
    const pricePerItem = price.priceDiamonds / fromSize;
    
    // Calculate new price for target unit
    const newPrice = pricePerItem * toSize;
    
    return {
      ...price,
      priceDiamonds: Number(newPrice.toFixed(2)),
      tradingUnit: toUnit
    };
  }

  validatePriceChange(oldPrice: Price, newPrice: Price): boolean {
    // Business rules for price validation
    
    // Prices cannot be negative
    if (newPrice.priceDiamonds < 0) {
      return false;
    }
    
    // Extremely large price changes require review (>1000% increase)
    const priceRatio = newPrice.priceDiamonds / oldPrice.priceDiamonds;
    if (priceRatio > 10) {
      return false;
    }
    
    // Price changes must be reasonable (not micro-adjustments)
    const minChangeThreshold = 0.01; // 1 cent in diamond blocks
    const priceChange = Math.abs(newPrice.priceDiamonds - oldPrice.priceDiamonds);
    if (priceChange < minChangeThreshold && priceChange > 0) {
      return false;
    }
    
    return true;
  }

  /**
   * Calculate effective price per item for comparison across different trading units
   */
  getEffectivePricePerItem(price: Price): number {
    const unitSize = MinecraftPricingService.TRADING_UNIT_SIZES[price.tradingUnit];
    return price.priceDiamonds / unitSize;
  }

  /**
   * Get price breakdown showing diamonds and diamond blocks
   */
  getPriceBreakdown(price: Price): { diamondBlocks: number; diamonds: number; totalDiamonds: number } {
    const totalDiamonds = price.priceDiamonds * 9;
    const diamondBlocks = Math.floor(price.priceDiamonds);
    const remainingDiamonds = (totalDiamonds % 9);
    
    return {
      diamondBlocks,
      diamonds: remainingDiamonds,
      totalDiamonds
    };
  }

  /**
   * Format price with trading unit context for search results
   */
  formatCompactPrice(price: Price): string {
    const { priceDiamonds, tradingUnit } = price;
    
    if (priceDiamonds >= 1) {
      const suffix = tradingUnit.replace('per_', '');
      return `${priceDiamonds}💎/${suffix}`;
    } else {
      const diamonds = priceDiamonds * 9;
      const suffix = tradingUnit.replace('per_', '');
      return `${diamonds}◆/${suffix}`;
    }
  }
}