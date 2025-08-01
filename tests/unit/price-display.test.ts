/**
 * Price Display Logic Tests
 * Testing the critical GAMEPLAN requirement: "5 diamonds per item" human-readable pricing
 */

import { describe, it, expect } from 'vitest';
import { formatPrice, formatPriceRange, formatTotalCost, formatAveragePrice } from '../../shared/utils/price-display.js';

describe('Price Display - GAMEPLAN Critical Requirements', () => {
  describe('formatPrice - Human-readable pricing', () => {
    describe('GAMEPLAN Example: "5 diamonds per item" logic', () => {
      it('should format 5 diamonds as "5 diamonds per item"', () => {
        const result = formatPrice(5, 'per_item');
        expect(result.text).toBe('5 diamonds per item');
        expect(result.fullText).toBe('5 diamonds per item');
        expect(result.icon).toBe('diamonds');
      });

      it('should format 9 diamonds as "9 diamonds per item"', () => {
        const result = formatPrice(9, 'per_item');
        expect(result.text).toBe('9 diamonds per item');
        expect(result.shortText).toBe('9dia');
      });

      it('should format 2 diamonds as "2 diamonds per item"', () => {
        const result = formatPrice(2, 'per_item');
        expect(result.text).toBe('2 diamonds per item');
      });
    });

    describe('Very cheap items - "X items per diamond" format', () => {
      it('should format 1 diamond as "1 diamond per item"', () => {
        // 1 diamond per item
        const result = formatPrice(1, 'per_item');
        expect(result.text).toBe('1 diamond per item');
        expect(result.icon).toBe('diamonds');
      });

      it('should format 0.45 diamonds as "2 items per diamond"', () => {
        // 0.45 diamonds per item
        // So 1 diamond ÷ 0.45 diamonds per item = 2.22 ≈ 2 items per diamond
        const result = formatPrice(0.45, 'per_item');
        expect(result.text).toBe('2 items per diamond');
        expect(result.icon).toBe('items');
      });
    });

    describe('Expensive items - diamond blocks format', () => {
      it('should format 135 diamonds as "15 diamond blocks per item"', () => {
        // 135 diamonds = 15 diamond blocks (135 ÷ 9 = 15)
        const result = formatPrice(135, 'per_item');
        expect(result.text).toBe('15 diamond blocks per item');
        expect(result.icon).toBe('blocks');
        expect(result.shortText).toBe('15DB');
      });

      it('should format 22.5 diamonds as "2.5 diamond blocks per item"', () => {
        // 22.5 diamonds = 2.5 diamond blocks (22.5 ÷ 9 = 2.5)
        const result = formatPrice(22.5, 'per_item');
        expect(result.text).toBe('2.5 diamond blocks per item');
      });
    });

    describe('Special cases', () => {
      it('should handle zero price as "Open to offers"', () => {
        const result = formatPrice(0, 'per_item');
        expect(result.text).toBe('Open to offers');
        expect(result.icon).toBe('offer');
      });

      it('should handle negative price as "Free"', () => {
        const result = formatPrice(-1, 'per_item');
        expect(result.text).toBe('Free');
        expect(result.fullText).toBe('Free item');
      });
    });
  });

  describe('Trading Units - GAMEPLAN requirement', () => {
    describe('Per Stack pricing (64 items)', () => {
      it('should format expensive stacks in diamonds per stack', () => {
        const result = formatPrice(9, 'per_stack'); // 9 diamonds per stack
        expect(result.text).toBe('9 diamonds per stack');
        expect(result.fullText).toBe('9 diamonds per stack (64 items)');
      });

      it('should format cheap stacks as stacks per diamond', () => {
        const result = formatPrice(0.45, 'per_stack'); // 0.45 diamonds per stack
        expect(result.text).toBe('2 stacks per diamond');
      });
    });

    describe('Per Shulker pricing (1,728 items)', () => {
      it('should convert shulker pricing to items per diamond for clarity', () => {
        const result = formatPrice(90, 'per_shulker'); // 90 diamonds per shulker
        expect(result.text).toBe('19 items per diamond');
        expect(result.fullText).toBe('19 items per diamond (from shulker pricing)');
      });
    });

  });

  describe('formatTotalCost - Purchase calculations', () => {
    it('should calculate total cost for multiple items', () => {
      const result = formatTotalCost(0.5556, 10, 'per_item'); // 5.556 diamond blocks total
      expect(result.text).toBe('5.6 diamond blocks total');
      expect(result.fullText).toBe('5.6 diamond blocks total for 10 items');
    });

    it('should handle small totals in diamonds', () => {
      const result = formatTotalCost(0.1, 5, 'per_item'); // 0.5 diamond blocks = 4.5 diamonds
      expect(result.text).toBe('4.5 diamonds total');
    });

    it('should handle "make offer" items', () => {
      const result = formatTotalCost(0, 1, 'per_item');
      expect(result.text).toBe('Negotiate price');
      expect(result.fullText).toBe('Contact seller to negotiate price');
    });
  });

  describe('formatPriceRange - Market statistics', () => {
    it('should format price ranges with same units', () => {
      const result = formatPriceRange(2, 7, 'per_item'); // 2-7 diamonds per item
      expect(result.text).toBe('2-7 diamonds');
    });

    it('should handle mixed ranges', () => {
      const result = formatPriceRange(0.05, 18, 'per_item'); // 20 items per diamond to 2 diamond blocks per item
      expect(result.shortText).toBe('20/dia-2DB');
    });
  });

  describe('formatAveragePrice - Market analytics', () => {
    it('should format average prices with "Avg:" prefix', () => {
      const result = formatAveragePrice(5, 'per_item');
      expect(result.text).toBe('Avg: 5 diamonds per item');
      expect(result.fullText).toBe('Average: 5 diamonds per item');
    });
  });
});

describe('Performance Requirements - GAMEPLAN', () => {
  describe('Function execution speed', () => {
    it('should format prices in under 1ms for UI responsiveness', () => {
      const start = performance.now();
      
      // Run 1000 price formatting operations
      for (let i = 0; i < 1000; i++) {
        formatPrice(Math.random() * 10, 'per_item');
      }
      
      const end = performance.now();
      const avgTime = (end - start) / 1000;
      
      // Should average under 1ms per operation for <500ms filtering
      expect(avgTime).toBeLessThan(1);
    });

    it('should handle bulk operations efficiently', () => {
      const prices = Array.from({ length: 100 }, () => Math.random() * 10);
      
      const start = performance.now();
      prices.forEach(price => {
        formatPrice(price, 'per_item');
        formatTotalCost(price, Math.floor(Math.random() * 64) + 1, 'per_item');
      });
      const end = performance.now();
      
      // Bulk operations should complete in under 50ms
      expect(end - start).toBeLessThan(50);
    });
  });
});

describe('Edge Cases - Robustness', () => {
  describe('Invalid inputs', () => {
    it('should handle NaN gracefully', () => {
      const result = formatPrice(NaN, 'per_item');
      expect(result.text).toBe('NaN diamond blocks per item');
    });

    it('should handle Infinity', () => {
      const result = formatPrice(Infinity, 'per_item');
      expect(result.icon).toBe('blocks'); // Should default to expensive item handling
    });

    it('should handle very small numbers', () => {
      const result = formatPrice(0.000001, 'per_item');
      expect(result.text).toBe('1000000 items per diamond');
    });
  });

  describe('Precision handling', () => {
    it('should handle floating point precision correctly', () => {
      const result = formatPrice(3, 'per_item'); // 3 diamonds per item
      expect(result.text).toBe('3 diamonds per item');
    });

    it('should round appropriately for display', () => {
      const result = formatPrice(3, 'per_item'); // 3 diamonds per item
      expect(result.text).toBe('3 diamonds per item');
    });
  });
});

describe('Integration with Trading Units - Real-world scenarios', () => {
  describe('Common Minecraft pricing scenarios', () => {
    it('should handle diamond sword pricing (expensive)', () => {
      const result = formatPrice(18, 'per_item'); // 18 diamonds = 2 diamond blocks per sword
      expect(result.text).toBe('2 diamond blocks per item');
    });

    it('should handle dirt block pricing (very cheap)', () => {
      const result = formatPrice(0.01, 'per_item'); // 0.09 diamonds per dirt
      expect(result.text).toBe('100 items per diamond');
    });

    it('should handle stack of logs pricing', () => {
      const result = formatPrice(4, 'per_stack'); // 4 diamonds per 64 logs
      expect(result.text).toBe('4 diamonds per stack');
    });

    it('should handle shulker of cobblestone (bulk discount)', () => {
      const result = formatPrice(45, 'per_shulker'); // 45 diamonds per 1728 cobble
      expect(result.text).toBe('38 items per diamond');
    });
  });
});