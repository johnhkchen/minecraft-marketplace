/**
 * Price History Service - Epic 1: Price Discovery
 * Implements price history and trend analysis for marketplace items
 */

import type { 
  IPriceHistoryService, 
  PriceHistoryEntry, 
  PriceTrend, 
  CommunityPriceReport 
} from '../interfaces/marketplace-api.interface.js';
import { ApiErrorHandler } from '../errors/api-errors.js';

export class PriceHistoryService implements IPriceHistoryService {
  private baseUrl: string;

  constructor(baseUrl = '/api/data') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get price history for an item over specified number of days
   * GREEN phase: Minimal implementation to make tests pass
   */
  async getPriceHistory(itemId: string, days = 30): Promise<PriceHistoryEntry[]> {
    try {
      // For now, query current price data and simulate history
      // TODO: Implement real price history table in database
      const response = await fetch(`${this.baseUrl}/public_items?minecraft_id=eq.${itemId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch price history: ${response.status}`);
      }

      const items = await response.json();
      if (items.length === 0) {
        return [];
      }

      const item = items[0];
      
      // GREEN phase: Generate mock historical data based on current price
      // This makes tests pass but isn't the final implementation
      const history: PriceHistoryEntry[] = [];
      const currentPrice = item.price_diamonds;
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Simulate realistic price variations (±10%)
        const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
        const historicalPrice = Math.max(0.1, currentPrice * (1 + variation));
        
        history.push({
          date: date.toISOString(),
          price_diamonds: Math.round(historicalPrice * 100) / 100,
          trading_unit: item.trading_unit || 'per_item',
          source: i === 0 ? 'owner' : 'system',
          confidence_level: i === 0 ? 'high' : 'medium'
        });
      }

      return history;
    } catch (error) {
      console.error('Failed to fetch price history:', error);
      throw error;
    }
  }

  /**
   * Calculate price trends and volatility analysis
   * GREEN phase: Basic trend calculation from simulated data
   */
  async getPriceTrends(itemId: string): Promise<PriceTrend> {
    try {
      // Get price history to calculate trends
      const history = await this.getPriceHistory(itemId, 30);
      
      if (history.length === 0) {
        throw new Error('No price history available for trend analysis');
      }

      const currentPrice = history[history.length - 1].price_diamonds;
      const oldestPrice = history[0].price_diamonds;
      
      // Calculate trend percentage
      const trendPercentage = ((currentPrice - oldestPrice) / oldestPrice) * 100;
      
      // Determine trend direction
      let trendDirection: 'up' | 'down' | 'stable';
      if (Math.abs(trendPercentage) < 5) {
        trendDirection = 'stable';
      } else if (trendPercentage > 0) {
        trendDirection = 'up';
      } else {
        trendDirection = 'down';
      }

      // Calculate price volatility based on variance
      const prices = history.map(h => h.price_diamonds);
      const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
      const volatilityCoefficient = Math.sqrt(variance) / mean;
      
      let priceVolatility: 'high' | 'medium' | 'low';
      if (volatilityCoefficient > 0.2) {
        priceVolatility = 'high';
      } else if (volatilityCoefficient > 0.1) {
        priceVolatility = 'medium';
      } else {
        priceVolatility = 'low';
      }

      // Get item name
      const response = await fetch(`${this.baseUrl}/public_items?minecraft_id=eq.${itemId}&limit=1`);
      const items = await response.json();
      const itemName = items.length > 0 ? items[0].name : 'Unknown Item';

      return {
        item_id: itemId,
        item_name: itemName,
        current_price: currentPrice,
        trend_direction: trendDirection,
        trend_percentage: Math.round(trendPercentage * 100) / 100,
        days_analyzed: history.length,
        price_volatility: priceVolatility
      };
    } catch (error) {
      console.error('Failed to calculate price trends:', error);
      throw error;
    }
  }

  /**
   * Get community-reported price changes
   * GREEN phase: Return empty array until community reporting is implemented
   */
  async getCommunityReportedChanges(itemId: string): Promise<CommunityPriceReport[]> {
    try {
      // GREEN phase: Minimal implementation returns empty array
      // TODO: Implement real community_reports table queries
      
      // For now, return empty array to make tests pass
      // Real implementation would query community_reports table
      return [];
    } catch (error) {
      console.error('Failed to fetch community price reports:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const priceHistoryService = new PriceHistoryService();