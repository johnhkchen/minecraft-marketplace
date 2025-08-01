/**
 * Minecraft Diamond Economy Price Display Utility
 * Cherry-picked and adapted from reference implementation
 * 
 * Converts diamond block prices to human-readable formats following
 * the "5 diamonds per item" logic requirement from GAMEPLAN
 */

import { TradingUnitType } from '../types/service-interfaces.js';

export interface PriceDisplay {
  text: string;
  icon: string;
  shortText: string;
  fullText: string;
}

/**
 * Converts a price in diamonds to a human-readable format
 * based on Minecraft's diamond economy conventions and trading unit
 * 
 * Key Examples:
 * - 5 diamonds per item → "5 diamonds per item"
 * - 18 diamonds per stack → "2 diamond blocks per stack" (18/9=2)
 * - 1 diamond per item → "1 diamond per item"
 */
export function formatPrice(priceInDiamonds: number, tradingUnit: TradingUnitType = 'per_item'): PriceDisplay {
  const price = Number(priceInDiamonds);
  
  // Handle special cases
  if (price === 0) {
    return {
      text: "Open to offers",
      icon: "offer",
      shortText: "Make offer",
      fullText: "Open to offers"
    };
  }
  
  if (price < 0) {
    return {
      text: "Free",
      icon: "free", 
      shortText: "Free",
      fullText: `Free ${getUnitDisplay(tradingUnit)}`
    };
  }
  
  // Price is already in diamonds (base currency unit)
  const diamondsPerUnit = price;
  
  // For bulk units like shulkers, show per-diamond rates for clarity
  if (tradingUnit === 'per_shulker') {
    // 1 shulker = 27 stacks = 27 × 64 = 1,728 items
    const itemsPerShulker = 27 * 64;
    const itemsPerDiamond = Math.round(itemsPerShulker / diamondsPerUnit);
    
    return {
      text: `${itemsPerDiamond} items per diamond`,
      icon: "items",
      shortText: `${itemsPerDiamond}/dia`,
      fullText: `${itemsPerDiamond} items per diamond (from shulker pricing)`
    };
  }
  
  // For stacks, convert to simple per-diamond rates  
  if (tradingUnit === 'per_stack') {
    const diamondsPerStack = diamondsPerUnit;
    
    if (diamondsPerStack >= 1) {
      // Expensive items: show diamonds per stack
      const diamonds = Math.round(diamondsPerStack);
      return {
        text: `${diamonds} diamond${diamonds !== 1 ? 's' : ''} per stack`,
        icon: "diamonds",
        shortText: `${diamonds}dia/stack`,
        fullText: `${diamonds} diamond${diamonds !== 1 ? 's' : ''} per stack (64 items)`
      };
    } else {
      // Cheap items: show stacks per diamond
      const stacksPerDiamond = Math.round(1 / diamondsPerStack);
      return {
        text: `${stacksPerDiamond} stack${stacksPerDiamond !== 1 ? 's' : ''} per diamond`,
        icon: "stacks",
        shortText: `${stacksPerDiamond}stacks/dia`,
        fullText: `${stacksPerDiamond} stack${stacksPerDiamond !== 1 ? 's' : ''} per diamond`
      };
    }
  }
  
  
  // For individual items - the key GAMEPLAN requirement: "5 diamonds per item" logic
  if (tradingUnit === 'per_item') {
    // Very cheap items: check if we should show "X items per diamond" or just "X diamonds per item"
    if (diamondsPerUnit < 1) {
      // If less than 0.5 diamonds per item, show as "X items per diamond"
      if (diamondsPerUnit < 0.5) {
        const itemsPerDiamond = Math.round(1 / diamondsPerUnit);
        return {
          text: `${itemsPerDiamond} items per diamond`,
          icon: "items",
          shortText: `${itemsPerDiamond}/dia`,
          fullText: `${itemsPerDiamond} items per diamond`
        };
      } else {
        // Otherwise show as "X diamonds per item" (like "1 diamond per item")
        const diamonds = Math.round(diamondsPerUnit);
        return {
          text: `${diamonds} diamond${diamonds !== 1 ? 's' : ''} per item`,
          icon: "diamonds",
          shortText: `${diamonds}dia`,
          fullText: `${diamonds} diamond${diamonds !== 1 ? 's' : ''} per item`
        };
      }
    }
    
    // Moderate pricing: Show as "5 diamonds per item" (the GAMEPLAN example)
    if (diamondsPerUnit < 10) {
      const diamonds = Math.round(diamondsPerUnit);
      return {
        text: `${diamonds} diamond${diamonds !== 1 ? 's' : ''} per item`,
        icon: "diamonds",
        shortText: `${diamonds}dia`,
        fullText: `${diamonds} diamond${diamonds !== 1 ? 's' : ''} per item`
      };
    }
    
    // Expensive items: Show in diamond blocks (convert diamonds to diamond blocks)
    const blocks = Math.round((price / 9) * 10) / 10; // Convert to diamond blocks and round to 1 decimal
    return {
      text: `${blocks} diamond block${blocks !== 1 ? 's' : ''} per item`,
      icon: "blocks",
      shortText: `${blocks}DB`,
      fullText: `${blocks} diamond block${blocks !== 1 ? 's' : ''} per item`
    };
  }
  
  // Fallback for unknown trading units
  const diamonds = Math.round(diamondsPerUnit);
  return {
    text: `${diamonds} diamond${diamonds !== 1 ? 's' : ''} ${getUnitDisplay(tradingUnit)}`,
    icon: "diamonds",
    shortText: `${diamonds}dia`,
    fullText: `${diamonds} diamond${diamonds !== 1 ? 's' : ''} ${getUnitDisplay(tradingUnit)}`
  };
}

/**
 * Format a price range for display in market stats
 */
export function formatPriceRange(minPrice: number, maxPrice: number, tradingUnit: TradingUnitType = 'per_item'): PriceDisplay {
  const minFormatted = formatPrice(minPrice, tradingUnit);
  const maxFormatted = formatPrice(maxPrice, tradingUnit);
  
  // If both are in the same category, show a combined range
  if (minFormatted.icon === maxFormatted.icon && minPrice > 0 && maxPrice > 0) {
    const minNum = extractNumericValue(minFormatted.text);
    const maxNum = extractNumericValue(maxFormatted.text);
    
    if (minNum !== null && maxNum !== null) {
      const unit = extractUnit(maxFormatted.text);
      return {
        text: `${minNum}-${maxNum} ${unit}`,
        icon: "range",
        shortText: `${minNum}-${maxNum}`,
        fullText: `${minNum} to ${maxNum} ${unit}`
      };
    }
  }
  
  // Different categories, show separately
  return {
    text: `${minFormatted.shortText} - ${maxFormatted.shortText}`,
    icon: "range",
    shortText: `${minFormatted.shortText}-${maxFormatted.shortText}`,
    fullText: `${minFormatted.fullText} to ${maxFormatted.fullText}`
  };
}

/**
 * Calculate total cost with smart formatting
 */
export function formatTotalCost(unitPrice: number, quantity: number, tradingUnit: TradingUnitType = 'per_item'): PriceDisplay {
  // Handle special cases
  if (unitPrice === 0) {
    return {
      text: "Negotiate price",
      icon: "offer",
      shortText: "Negotiate",
      fullText: "Contact seller to negotiate price"
    };
  }
  
  const totalPriceInBlocks = unitPrice * quantity;
  
  // For totals, always show the actual total cost
  if (totalPriceInBlocks < 1) {
    const totalDiamonds = Math.round(totalPriceInBlocks * 9 * 10) / 10; // Round to 1 decimal
    return {
      text: `${totalDiamonds} diamonds total`,
      icon: "diamonds",
      shortText: `${totalDiamonds}dia`,
      fullText: `${totalDiamonds} diamonds total for ${quantity} ${getUnitDisplay(tradingUnit, quantity)}`
    };
  }
  
  // Show total in diamond blocks
  const blocks = Math.round(totalPriceInBlocks * 10) / 10;
  return {
    text: `${blocks} diamond blocks total`,
    icon: "blocks", 
    shortText: `${blocks}DB`,
    fullText: `${blocks} diamond blocks total for ${quantity} ${getUnitDisplay(tradingUnit, quantity)}`
  };
}

/**
 * Format average price for market statistics
 */
export function formatAveragePrice(averagePrice: number, tradingUnit: TradingUnitType = 'per_item'): PriceDisplay {
  const display = formatPrice(averagePrice, tradingUnit);
  return {
    text: `Avg: ${display.text}`,
    icon: display.icon,
    shortText: `Avg: ${display.shortText}`,
    fullText: `Average: ${display.fullText}`
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getUnitDisplay(tradingUnit: TradingUnitType, quantity: number = 1): string {
  switch (tradingUnit) {
    case 'per_item':
      return quantity === 1 ? 'item' : 'items';
    case 'per_stack':
      return quantity === 1 ? 'stack' : 'stacks';
    case 'per_shulker':
      return quantity === 1 ? 'shulker' : 'shulkers';
    default:
      return quantity === 1 ? 'unit' : 'units';
  }
}

function extractNumericValue(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

function extractUnit(text: string): string {
  if (text.includes('diamond blocks')) return 'diamond blocks';
  if (text.includes('diamonds')) return 'diamonds';
  if (text.includes('items per diamond')) return 'items per diamond';
  if (text.includes('per')) {
    const parts = text.split(' per ');
    return parts[1]?.trim() || 'unit';
  }
  return 'unit';
}