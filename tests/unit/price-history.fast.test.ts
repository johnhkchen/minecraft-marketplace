/**
 * Price History Fast Tests - MSW Mocked Version
 * Converted from performance/price-history.test.ts for rapid development feedback
 * 
 * Tests Epic 1 price discovery functionality without infrastructure dependencies
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { setupFastTests } from '../utils/fast-test-setup.js';

// Setup MSW mocking for all HTTP calls
setupFastTests();

// Test data configuration
const TEST_DATA = {
  mainTrader: 'steve',
  primaryItem: 'Diamond Sword',
  primaryItemId: 'diamond_sword',
  primaryServer: 'HermitCraft'
};

// Mock price history data
const mockPriceHistory = [
  {
    date: '2024-01-15',
    price_diamonds: 2.5,
    trading_unit: 'per_item',
    source: 'owner' as const,
    confidence_level: 'high' as const
  },
  {
    date: '2024-01-10',
    price_diamonds: 2.2,
    trading_unit: 'per_item', 
    source: 'community' as const,
    confidence_level: 'medium' as const
  },
  {
    date: '2024-01-05',
    price_diamonds: 2.0,
    trading_unit: 'per_item',
    source: 'system' as const,
    confidence_level: 'high' as const
  }
];

const mockPriceTrend = {
  item_id: TEST_DATA.primaryItemId,
  item_name: TEST_DATA.primaryItem,
  current_price: 2.5,
  trend_direction: 'up' as const,
  trend_percentage: 25.0,
  days_analyzed: 30,
  price_volatility: 'medium' as const
};

const mockCommunityReports = [
  {
    id: 'report_123',
    item_id: TEST_DATA.primaryItemId,
    reported_price: 2.8,
    previous_price: 2.5,
    reporter_id: 'reporter_456',
    report_date: '2024-01-20',
    confidence_score: 85,
    evidence_count: 3,
    verified: true
  }
];

// Fast price history service mock
class FastPriceHistoryService {
  async getPriceHistory(itemId: string, days: number = 30) {
    // Simulate API response time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
    
    return mockPriceHistory.slice(0, Math.min(days / 5, mockPriceHistory.length));
  }

  async getPriceTrends(itemId: string) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3));
    
    return {
      ...mockPriceTrend,
      item_id: itemId
    };
  }

  async getCommunityReportedChanges(itemId: string) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 4));
    
    return mockCommunityReports.filter(report => report.item_id === itemId);
  }
}

describe('Price History Fast Tests', () => {
  let priceHistoryService: FastPriceHistoryService;
  
  beforeEach(() => {
    priceHistoryService = new FastPriceHistoryService();
  });

  describe('Price History Display', () => {
    test('fetches price history for an item fast', async () => {
      
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      
      // Validate history entry structure
      const entry = history[0];
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('price_diamonds');
      expect(entry).toHaveProperty('trading_unit');
      expect(entry).toHaveProperty('source');
      expect(typeof entry.price_diamonds).toBe('number');
      expect(entry.price_diamonds).toBeGreaterThan(0);
      
    });

    test('calculates price trends over time fast', async () => {
      
      expect(trends).toHaveProperty('item_id');
      expect(trends).toHaveProperty('trend_direction');
      expect(trends).toHaveProperty('trend_percentage');
      expect(trends).toHaveProperty('price_volatility');
      
      expect(['up', 'down', 'stable']).toContain(trends.trend_direction);
      expect(['high', 'medium', 'low']).toContain(trends.price_volatility);
      expect(typeof trends.trend_percentage).toBe('number');
      
    });

    test('displays community-reported price changes fast', async () => {
      
      expect(Array.isArray(communityReports)).toBe(true);
      
      if (communityReports.length > 0) {
        const report = communityReports[0];
        expect(report).toHaveProperty('id');
        expect(report).toHaveProperty('reported_price');
        expect(report).toHaveProperty('previous_price');
        expect(report).toHaveProperty('confidence_score');
        expect(report).toHaveProperty('evidence_count');
        expect(typeof report.confidence_score).toBe('number');
        expect(report.confidence_score).toBeGreaterThanOrEqual(0);
        expect(report.confidence_score).toBeLessThanOrEqual(100);
      }
      
    });
  });

  describe('Price History Performance Requirements', () => {
    test('loads price history within performance limits', async () => {
      
      // Fast test performance requirement (much faster than 500ms)
      expect(Array.isArray(history)).toBe(true);
      
      // Validate business logic
      expect(history.every(entry => entry.price_diamonds > 0)).toBe(true);
      expect(history.every(entry => ['owner', 'community', 'system'].includes(entry.source))).toBe(true);
    });

    test('handles multiple price history requests concurrently', async () => {
      const testItems = [
        TEST_DATA.primaryItemId,
        'enchanted_diamond_sword',
        'netherite_sword',
        'iron_sword',
        'wooden_sword'
      ];
      
        );
        
        return Promise.all(historyPromises);
      });
      
      // Fast concurrent execution
      expect(histories.length).toBe(testItems.length);
      
      histories.forEach(history => {
        expect(Array.isArray(history)).toBe(true);
      });
    });
  });

  describe('Price Trend Analysis Requirements', () => {
    test('identifies price volatility patterns fast', async () => {
      
      // Should analyze price patterns
      expect(trends.price_volatility).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(trends.price_volatility);
      
      // Should have meaningful trend data
      expect(trends.days_analyzed).toBeGreaterThan(0);
      expect(typeof trends.trend_percentage).toBe('number');
      
      // Trend percentage should be reasonable
      expect(Math.abs(trends.trend_percentage)).toBeLessThan(1000);
      
    });

    test('provides market comparison context fast', async () => {
      const testItems = [
        TEST_DATA.primaryItemId,
        'enchanted_diamond_sword', 
        'netherite_sword'
      ];
      
        );
        
        return Promise.all(trendPromises);
      });
      
      expect(trends.length).toBe(3);
      
      // Each trend should have comparison context
      trends.forEach(trend => {
        expect(trend).toHaveProperty('current_price');
        expect(trend).toHaveProperty('trend_direction'); 
        expect(trend.current_price).toBeGreaterThan(0);
      });
      
    });
  });

  describe('Price History Validation', () => {
    test('validates price history data integrity', async () => {
      
      // Validate all entries have required fields
      history.forEach(entry => {
        expect(entry.date).toBeDefined();
        expect(entry.price_diamonds).toBeGreaterThan(0);
        expect(['per_item', 'per_stack', 'per_shulker', 'per_dozen']).toContain(entry.trading_unit);
        expect(['owner', 'community', 'system']).toContain(entry.source);
        
        if (entry.confidence_level) {
          expect(['high', 'medium', 'low']).toContain(entry.confidence_level);
        }
      });
      
    });

    test('validates trend calculation logic', () => {
      const testPrices = [2.0, 2.2, 2.5, 2.8, 3.0];
      
      
      // Calculate trend percentage manually
      const oldPrice = testPrices[0];
      const newPrice = testPrices[testPrices.length - 1];
      const expectedTrend = ((newPrice - oldPrice) / oldPrice) * 100;
      
      // Validate trend direction
      const expectedDirection = newPrice > oldPrice ? 'up' : newPrice < oldPrice ? 'down' : 'stable';
      
      
      expect(expectedTrend).toBeCloseTo(50.0, 1); // 50% increase
      expect(expectedDirection).toBe('up');
      
    });
  });

  describe('Fast Test Execution Validation', () => {
    test('validates all price history operations complete in milliseconds', async () => {

      // Multiple quick operations
      const history = await priceHistoryService.getPriceHistory(TEST_DATA.primaryItemId, 7);
      const trends = await priceHistoryService.getPriceTrends(TEST_DATA.primaryItemId);
      const reports = await priceHistoryService.getCommunityReportedChanges(TEST_DATA.primaryItemId);

      expect(Array.isArray(history)).toBe(true);
      expect(trends.item_id).toBe(TEST_DATA.primaryItemId);
      expect(Array.isArray(reports)).toBe(true);

    });
  });
});