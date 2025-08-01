/**
 * Marketplace API Service Interface
 * REFACTOR: Extract interfaces for better dependency injection and testing
 */

import type { ListingWithDetails, SearchFilters } from '../../types/marketplace.js';

export interface IMarketplaceApiService {
  // Core data fetching
  fetchListings(filters?: SearchFilters): Promise<ListingWithDetails[]>;
  searchItems(query: string): Promise<ListingWithDetails[]>;
  
  // Category and basic filtering
  filterByCategory(category: string): Promise<ListingWithDetails[]>;
  
  // Server and location filtering (Epic 1)
  filterByServer(serverName: string): Promise<ListingWithDetails[]>;
  filterByLocation(location: string): Promise<ListingWithDetails[]>;
  filterByServerAndLocation(serverName: string, location: string): Promise<ListingWithDetails[]>;
  
  // Metadata and enumeration
  getAvailableServers(): Promise<string[]>;
  getServerLocations(serverName: string): Promise<{shop_location: string, item_count: number}[]>;
  
  // Advanced location features
  findNearbyItems(location: string, radius: number): Promise<ListingWithDetails[]>;
  findItemsByCoordinates(x: number, y: number, z: number, radius: number): Promise<ListingWithDetails[]>;
  filterByDimension(dimension: string): Promise<ListingWithDetails[]>;
}

export interface IPriceHistoryService {
  // Price history and trends (Epic 1)
  getPriceHistory(itemId: string, days?: number): Promise<PriceHistoryEntry[]>;
  getPriceTrends(itemId: string): Promise<PriceTrend>;
  getCommunityReportedChanges(itemId: string): Promise<CommunityPriceReport[]>;
}

export interface ICacheService {
  // Caching operations
  getOrFetch<T>(cacheKey: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T>;
  clear(cacheKey: string): void;
  clearAll(): void;
  getStats(): { size: number, keys: string[] };
  cleanup(): void;
}

// Domain types for price history
export interface PriceHistoryEntry {
  date: string;
  price_diamonds: number;
  trading_unit: string;
  source: 'owner' | 'community' | 'system';
  confidence_level?: 'high' | 'medium' | 'low';
}

export interface PriceTrend {
  item_id: string;
  item_name: string;
  current_price: number;
  trend_direction: 'up' | 'down' | 'stable';
  trend_percentage: number;
  days_analyzed: number;
  price_volatility: 'high' | 'medium' | 'low';
}

export interface CommunityPriceReport {
  id: string;
  item_id: string;
  reported_price: number;
  previous_price: number;
  reporter_id: string;
  report_date: string;
  confidence_score: number;
  evidence_count: number;
  verified: boolean;
}