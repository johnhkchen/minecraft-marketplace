// Minecraft Diamond Economy Price Display Utility
// Converts diamond block prices to more intuitive formats

export interface PriceDisplay {
  text: string;
  icon: string;
  shortText: string;
  fullText: string;
}

/**
 * Converts a price in diamond blocks to a human-readable format
 * based on Minecraft's diamond economy conventions and inventory unit
 */
export function formatPrice(priceInDiamondBlocks: number, inventoryUnit?: string): PriceDisplay {
  const price = Number(priceInDiamondBlocks);
  const unit = inventoryUnit || 'per item';
  
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
      fullText: `Free ${unit.replace('per ', '')}`
    };
  }
  
  // Convert to simple trading ratios that 2nd graders can understand
  const diamondsPerUnit = price * 9; // Convert DB to diamonds
  
  // For bulk units like shulkers, always convert to fundamental per-diamond rates
  if (unit === 'per shulker') {
    // 1 shulker = 27 stacks = 27 × 64 = 1,728 items
    const itemsPerShulker = 27 * 64;
    const itemsPerDiamond = Math.round(itemsPerShulker / diamondsPerUnit);
    
    return {
      text: `${itemsPerDiamond} items per diamond`,
      icon: "items",
      shortText: `${itemsPerDiamond}/dia`,
      fullText: `${itemsPerDiamond} items per diamond`
    };
  }
  
  // For stacks, convert to simple per-diamond rates  
  if (unit === 'per stack') {
    // Instead of complex math, extract the simple ratio from common descriptions
    // Most descriptions follow "1 dia per X" format
    const diamondsPerStack = diamondsPerUnit;
    
    if (diamondsPerStack >= 1) {
      // Expensive items: show diamonds per stack
      const diamonds = Math.round(diamondsPerStack);
      return {
        text: `${diamonds} diamond${diamonds !== 1 ? 's' : ''} per stack`,
        icon: "diamonds",
        shortText: `${diamonds}dia/stack`,
        fullText: `${diamonds} diamond${diamonds !== 1 ? 's' : ''} per stack`
      };
    } else {
      // Cheap items: show how many items you get per diamond
      const itemsPerDiamond = Math.round(64 / diamondsPerStack);
      return {
        text: `${itemsPerDiamond} per diamond`,
        icon: "diamonds",
        shortText: `${itemsPerDiamond}/dia`,
        fullText: `${itemsPerDiamond} items per diamond`
      };
    }
  }
  
  // For dozens, convert to per-diamond rates
  if (unit === 'per dozen') {
    const itemsPerDozen = 12;
    const itemsPerDiamond = Math.round(itemsPerDozen / diamondsPerUnit);
    
    if (itemsPerDiamond >= 1) {
      return {
        text: `${itemsPerDiamond} items per diamond`,
        icon: "diamonds",
        shortText: `${itemsPerDiamond}/dia`,
        fullText: `${itemsPerDiamond} items per diamond`
      };
    }
  }
  
  // For individual items - very cheap: show as "X items per diamond"
  if (diamondsPerUnit < 1) {
    const itemsPerDiamond = Math.round(1 / diamondsPerUnit);
    return {
      text: `${itemsPerDiamond} items per diamond`,
      icon: "items",
      shortText: `${itemsPerDiamond}/dia`,
      fullText: `${itemsPerDiamond} items per diamond`
    };
  }
  
  // Moderate pricing: Show as simple diamond ratios
  if (diamondsPerUnit < 10) {
    const diamonds = Math.round(diamondsPerUnit);
    return {
      text: `${diamonds} diamond${diamonds !== 1 ? 's' : ''} ${unit}`,
      icon: "diamonds",
      shortText: `${diamonds}dia`,
      fullText: `${diamonds} diamond${diamonds !== 1 ? 's' : ''} ${unit}`
    };
  }
  
  // Expensive items: Show in diamond blocks with simple ratios
  const blocks = Math.round(price);
  return {
    text: `${blocks} diamond block${blocks !== 1 ? 's' : ''} ${unit}`,
    icon: "blocks",
    shortText: `${blocks}DB`,
    fullText: `${blocks} diamond block${blocks !== 1 ? 's' : ''} ${unit}`
  };
}

/**
 * Format a price range for display in stats
 */
export function formatPriceRange(minPrice: number, maxPrice: number): PriceDisplay {
  const minFormatted = formatPrice(minPrice);
  const maxFormatted = formatPrice(maxPrice);
  
  // If both are in the same category, show a combined range
  if (minFormatted.icon === maxFormatted.icon) {
    // Extract numeric parts for range display
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
export function formatTotalCost(unitPrice: number, quantity: number, inventoryUnit?: string): PriceDisplay {
  // Handle bidding items
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
    const totalDiamonds = (totalPriceInBlocks * 9).toFixed(1);
    return {
      text: `${totalDiamonds} diamonds total`,
      icon: "diamonds",
      shortText: `${totalDiamonds}dia`,
      fullText: `${totalDiamonds} diamonds total for ${quantity} ${(inventoryUnit || 'items').replace('per ', '')}`
    };
  }
  
  // Show total in diamond blocks
  const blocks = totalPriceInBlocks % 1 === 0 ? totalPriceInBlocks.toString() : totalPriceInBlocks.toFixed(1);
  return {
    text: `${blocks} diamond blocks total`,
    icon: "blocks", 
    shortText: `${blocks}DB`,
    fullText: `${blocks} diamond blocks total for ${quantity} ${(inventoryUnit || 'items').replace('per ', '')}`
  };
}

// Helper functions
function extractNumericValue(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

function extractUnit(text: string): string {
  if (text.includes('diamond blocks')) return 'diamond blocks each';
  if (text.includes('diamonds each')) return 'diamonds each';
  if (text.includes('each')) return 'each';
  if (text.includes('per')) return text.split(' per ')[1]?.trim() || 'each';
  return 'each';
}

/**
 * Format average price for stats display
 */
export function formatAveragePrice(averagePrice: number): PriceDisplay {
  const display = formatPrice(averagePrice);
  return {
    text: `Avg: ${display.text}`,
    icon: display.icon,
    shortText: `Avg: ${display.shortText}`,
    fullText: `Average: ${display.fullText}`
  };
}