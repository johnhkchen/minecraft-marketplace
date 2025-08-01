/**
 * Search Interface Performance Tests
 * Testing GAMEPLAN requirement: <500ms filtering response time
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock data generator for realistic Minecraft items
function generateMockItems(count: number) {
  const categories = ['tools', 'armor', 'blocks', 'food', 'misc'];
  const servers = ['SurvivalServer', 'Safe Survival', 'SkyblockRealm', 'FactionsWar'];
  const itemNames = [
    'Diamond Sword', 'Iron Pickaxe', 'Enchanted Book', 'Golden Apple',
    'Netherite Helmet', 'Shulker Box', 'Elytra', 'Totem of Undying',
    'Beacon', 'Dragon Egg', 'Cobblestone', 'Oak Wood', 'Redstone Dust',
    'Ender Pearl', 'Blaze Rod', 'Spider Eye', 'Slime Ball', 'Ghast Tear'
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    name: itemNames[i % itemNames.length] + (i > itemNames.length ? ` #${Math.floor(i / itemNames.length)}` : ''),
    category: categories[i % categories.length],
    server_name: servers[i % servers.length],
    is_available: Math.random() > 0.1, // 90% available
    stock_quantity: Math.floor(Math.random() * 100) + 1,
    prices: [{
      price_diamond_blocks: Math.random() * 10,
      trading_unit: 'per_item'
    }],
    updated_at: new Date(Date.now() - Math.random() * 86400000).toISOString()
  }));
}

// Search filter function (extracted from MarketplaceBrowser logic)
function filterItems(items: any[], filters: {
  searchTerm?: string;
  categoryFilter?: string;
  serverFilter?: string;
  maxPrice?: number;
  tradingUnitFilter?: string;
}) {
  return items.filter(item => {
    // Search term filter
    if (filters.searchTerm && !item.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (filters.categoryFilter && item.category !== filters.categoryFilter) {
      return false;
    }
    
    // Server filter
    if (filters.serverFilter && item.server_name !== filters.serverFilter) {
      return false;
    }
    
    // Price filter
    if (filters.maxPrice && item.prices?.[0]?.price_diamond_blocks > filters.maxPrice) {
      return false;
    }
    
    // Trading unit filter
    if (filters.tradingUnitFilter && item.prices?.[0]?.trading_unit !== filters.tradingUnitFilter) {
      return false;
    }
    
    // Only show available items
    return item.is_available;
  });
}

// Sort function
function sortItems(items: any[], sortBy: string, sortOrder: 'asc' | 'desc') {
  return items.sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'price':
        aValue = a.prices?.[0]?.price_diamond_blocks || 0;
        bValue = b.prices?.[0]?.price_diamond_blocks || 0;
        break;
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'updated':
        aValue = new Date(a.updated_at);
        bValue = new Date(b.updated_at);
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });
}

describe('Search Performance - GAMEPLAN <500ms Requirement', () => {
  let smallDataset: any[];
  let mediumDataset: any[];
  let largeDataset: any[];

  beforeEach(() => {
    // Generate test datasets of different sizes
    smallDataset = generateMockItems(100);    // Small shop
    mediumDataset = generateMockItems(1000);  // Medium server
    largeDataset = generateMockItems(10000);  // Large marketplace (GAMEPLAN target)
  });

  describe('Filtering Performance', () => {
    it('should filter 100 items in under 50ms', () => {
      const start = performance.now();
      
      // Use broader filters to ensure we get results
      const result = filterItems(smallDataset, {
        searchTerm: 'diamond',
        categoryFilter: 'tools',
        maxPrice: 15 // Increased to ensure some items match
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(50);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter 1,000 items in under 100ms', () => {
      const start = performance.now();
      
      const result = filterItems(mediumDataset, {
        searchTerm: 'sword',
        serverFilter: 'SurvivalServer'
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(100);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter 10,000 items in under 500ms (GAMEPLAN requirement)', () => {
      const start = performance.now();
      
      const result = filterItems(largeDataset, {
        searchTerm: 'enchanted',
        categoryFilter: 'misc',
        maxPrice: 10
      });
      
      const end = performance.now();
      const duration = end - start;
      
      // Critical GAMEPLAN requirement
      expect(duration).toBeLessThan(500);
      expect(result).toBeDefined();
    });
  });

  describe('Sorting Performance', () => {
    it('should sort filtered results quickly', () => {
      const filtered = filterItems(largeDataset, { categoryFilter: 'tools' });
      
      const start = performance.now();
      const sorted = sortItems([...filtered], 'price', 'asc');
      const end = performance.now();
      
      const duration = end - start;
      expect(duration).toBeLessThan(100);
      expect(sorted[0].prices[0].price_diamond_blocks).toBeLessThanOrEqual(
        sorted[sorted.length - 1].prices[0].price_diamond_blocks
      );
    });

    it('should handle multiple sort criteria efficiently', () => {
      const start = performance.now();
      
      // Test all sort options
      sortItems([...mediumDataset], 'price', 'asc');
      sortItems([...mediumDataset], 'name', 'desc');
      sortItems([...mediumDataset], 'updated', 'asc');
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Combined Operations - Real-world Usage', () => {
    it('should handle complete search workflow under 500ms', () => {
      const start = performance.now();
      
      // Simulate user typing "diamond" and applying filters
      const filtered = filterItems(largeDataset, {
        searchTerm: 'diamond',
        categoryFilter: 'tools',
        maxPrice: 8
      });
      
      // Sort by price
      const sorted = sortItems(filtered, 'price', 'asc');
      
      // Calculate statistics (like in MarketplaceBrowser)
      const stats = {
        totalItems: sorted.length,
        avgPrice: sorted.length > 0 
          ? sorted.reduce((sum, item) => sum + item.prices[0].price_diamond_blocks, 0) / sorted.length 
          : 0,
        categories: new Set(sorted.map(item => item.category)).size
      };
      
      const end = performance.now();
      const duration = end - start;
      
      // Complete workflow must be under 500ms for good UX
      expect(duration).toBeLessThan(500);
      expect(sorted).toBeDefined();
      expect(stats.totalItems).toBeGreaterThanOrEqual(0);
    });

    it('should handle rapid filter changes (typing simulation)', () => {
      const searchTerms = ['d', 'di', 'dia', 'diam', 'diamo', 'diamon', 'diamond'];
      
      const start = performance.now();
      
      // Simulate user typing progressively
      searchTerms.forEach(term => {
        filterItems(largeDataset, { searchTerm: term });
      });
      
      const end = performance.now();
      const duration = end - start;
      
      // Rapid successive filters should still be performant
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Memory Efficiency', () => {
    it('should not create excessive objects during filtering', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many filter operations
      for (let i = 0; i < 100; i++) {
        filterItems(mediumDataset, {
          searchTerm: `item${i}`,
          maxPrice: Math.random() * 10
        });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Edge Cases - Performance Robustness', () => {
    it('should handle empty search results efficiently', () => {
      const start = performance.now();
      
      const result = filterItems(largeDataset, {
        searchTerm: 'nonexistentitem12345'
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(100);
      expect(result).toHaveLength(0);
    });

    it('should handle very broad search terms efficiently', () => {
      const start = performance.now();
      
      // Single character search (matches many items)
      const result = filterItems(largeDataset, {
        searchTerm: 'e' // Will match many items
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(500);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle complex filter combinations', () => {
      const start = performance.now();
      
      const result = filterItems(largeDataset, {
        searchTerm: 'sword',
        categoryFilter: 'tools',
        serverFilter: 'SurvivalServer',
        maxPrice: 5,
        tradingUnitFilter: 'per_item'
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(500);
      expect(result).toBeDefined();
    });
  });
});

describe('Client-side Responsiveness - UX Requirements', () => {
  describe('Interactive response times', () => {
    it('should provide immediate feedback for search input', () => {
      const dataset = generateMockItems(5000);
      
      // Simulate debounced search input
      const searches = ['d', 'di', 'dia', 'diam'];
      const times: number[] = [];
      
      searches.forEach(term => {
        const start = performance.now();
        filterItems(dataset, { searchTerm: term });
        const end = performance.now();
        times.push(end - start);
      });
      
      // Each incremental search should be fast
      times.forEach(time => {
        expect(time).toBeLessThan(200);
      });
    });

    it('should handle filter toggles instantly', () => {
      const dataset = generateMockItems(3000);
      const categories = ['tools', 'armor', 'blocks', 'food', 'misc'];
      
      const start = performance.now();
      
      // Simulate clicking through category filters
      categories.forEach(category => {
        filterItems(dataset, { categoryFilter: category });
      });
      
      const end = performance.now();
      const duration = end - start;
      
      // Multiple filter changes should be instant
      expect(duration).toBeLessThan(250);
    });
  });

  describe('Scalability validation', () => {
    it('should maintain performance with realistic Minecraft inventory sizes', () => {
      // Test with sizes representing different server scales
      const testSizes = [500, 2000, 5000, 10000]; // Small to large server inventories
      
      testSizes.forEach(size => {
        const dataset = generateMockItems(size);
        
        const start = performance.now();
        const result = filterItems(dataset, {
          searchTerm: 'diamond',
          categoryFilter: 'tools'
        });
        const end = performance.now();
        
        const duration = end - start;
        
        // Should scale linearly and stay under 500ms threshold
        expect(duration).toBeLessThan(500);
        expect(result).toBeDefined();
      });
    });
  });
});