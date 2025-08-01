/**
 * Enhanced Homepage Data Service
 * Loads marketplace data with location, verification, and HATEOAS links
 */

import { formatPrice } from '../../../shared/utils/price-display.js';
import { URLConstructionService } from './url-construction.js';

import { getValkeyService, ValkeyCacheService } from '../../../shared/services/valkey-cache.js';

/**
 * Enhanced Query Cache using Valkey (Redis-compatible)
 * Provides distributed caching for marketplace queries with TTL support
 */
export class ValkeyQueryCache {
  private valkey: ValkeyCacheService | null = null;
  private defaultTTL: number;

  constructor(defaultTTL: number = 30000) {
    this.defaultTTL = defaultTTL;
  }

  private getValkeyService(): ValkeyCacheService {
    if (!this.valkey) {
      this.valkey = getValkeyService();
    }
    return this.valkey;
  }

  async get(key: string): Promise<any | null> {
    try {
      const service = this.getValkeyService();
      return await service.get(key);
    } catch (error) {
      console.error('❌ ValkeyQueryCache GET error:', error);
      return null; // Graceful degradation
    }
  }

  async set(key: string, value: any, ttlMs?: number): Promise<void> {
    try {
      const service = this.getValkeyService();
      const ttl = ttlMs || this.defaultTTL;
      await service.set(key, value, ttl);
    } catch (error) {
      console.error('❌ ValkeyQueryCache SET error:', error);
      // Graceful degradation - don't throw
    }
  }

  async clear(): Promise<void> {
    try {
      const service = this.getValkeyService();
      await service.clear();
    } catch (error) {
      console.error('❌ ValkeyQueryCache CLEAR error:', error);
    }
  }

  /**
   * Generate cache key from filters and pagination
   */
  static generateKey(filters: FilterState, page: number, itemsPerPage: number): string {
    return ValkeyCacheService.generateKey('marketplace:query', {
      filters,
      page,
      itemsPerPage
    });
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      const service = this.getValkeyService();
      return await service.info();
    } catch (error) {
      console.error('❌ ValkeyQueryCache STATS error:', error);
      return { connected: false };
    }
  }
}

// Global Valkey cache instance for enhanced homepage data
const globalValkeyCache = new ValkeyQueryCache(30000); // 30 second TTL

// Legacy QueryCache interface for backward compatibility
export interface QueryCacheOptions {
  maxSize?: number;
  defaultTTL?: number;
}

export class QueryCache {
  private valkeyCache: ValkeyQueryCache;

  constructor(options: QueryCacheOptions = {}) {
    this.valkeyCache = new ValkeyQueryCache(options.defaultTTL || 30000);
  }

  async get(key: string): Promise<any | null> {
    return await this.valkeyCache.get(key);
  }

  async set(key: string, value: any, ttlMs?: number): Promise<void> {
    await this.valkeyCache.set(key, value, ttlMs);
  }

  async clear(): Promise<void> {
    await this.valkeyCache.clear();
  }

  size(): number {
    // Note: Valkey doesn't provide exact size info easily, return 0 as placeholder
    return 0;
  }

  static generateKey(filters: FilterState, page: number, itemsPerPage: number): string {
    return ValkeyQueryCache.generateKey(filters, page, itemsPerPage);
  }
}

export interface EnhancedMarketplaceItem {
  // Existing fields (already working)
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  priceDisplay: string;
  tradingUnit: string;
  shopName: string;
  serverName: string;
  stockQuantity: number;
  
  // New enhanced fields
  location?: {
    biome: 'jungle' | 'desert' | 'ocean' | 'mountains' | 'plains' | 'nether' | 'end';
    direction: 'north' | 'south' | 'east' | 'west' | 'spawn';
    warpCommand?: string;
    coordinates?: { x: number; z: number };
  };
  
  verification?: {
    lastVerified?: Date;
    verifiedBy?: string;
    confidenceLevel: 'low' | 'medium' | 'high';
  };
  
  // HATEOAS links
  _links: {
    self: { href: string };
    copyWarp?: { href: string; method: 'POST'; title: string };
    edit?: { href: string; method: 'PUT'; title: string; requiresAuth: boolean };
    updateStock?: { href: string; method: 'PATCH'; title: string; requiresAuth: boolean };
    reportPrice?: { href: string; method: 'POST'; title: string; requiresAuth: boolean };
    verify?: { href: string; method: 'PATCH'; title: string; requiresAuth: boolean; permission: string };
  };
}

export interface FilterState {
  search?: string;
  category?: string;
  biome?: 'any' | 'jungle' | 'desert' | 'ocean' | 'mountains' | 'plains' | 'nether' | 'end';
  direction?: 'any' | 'north' | 'south' | 'east' | 'west' | 'spawn';
  priceRange?: { min?: number; max?: number };
  verification?: 'any' | 'verified' | 'unverified';
  sortBy?: 'price_desc' | 'price_asc' | 'name_asc' | 'recent' | 'verified_first';
}

export interface UserContext {
  isAuthenticated: boolean;
  username?: string;
  permissions: Set<string>;
  ownedItemIds: Set<string>;
}

export interface EnhancedHomepageData {
  featuredItems: EnhancedMarketplaceItem[];
  allItems: EnhancedMarketplaceItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
  };
  marketStats: {
    totalItems: number;
    activeShops: number;
    recentTrades: number;
  };
  categories: Array<{
    name: string;
    count: number;
    topItems: EnhancedMarketplaceItem[];
  }>;
  recentActivity: Array<{
    itemName: string;
    priceChange: string;
    timestamp: string;
    shopName: string;
  }>;
}

/**
 * HATEOAS Link Generator Class for TDD testing
 */
export class HATEOASLinkGenerator {
  generateLinks(item: any, userContext?: UserContext): EnhancedMarketplaceItem['_links'] {
    return generateHATEOASLinks(item, userContext);
  }
}

/**
 * Generate HATEOAS links based on user context and item ownership
 */
function generateHATEOASLinks(item: any, userContext?: UserContext): EnhancedMarketplaceItem['_links'] {
  const links: EnhancedMarketplaceItem['_links'] = {
    self: { href: `/api/data/public_items?id=eq.${item.id}` }
  };
  
  // Always available: copy warp command
  if (item.warp_command) {
    links.copyWarp = {
      href: '/api/v1/warp/copy',
      method: 'POST',
      title: 'Copy warp command'
    };
  }
  
  // User-specific actions
  if (userContext?.isAuthenticated) {
    // Owner actions
    if (userContext.ownedItemIds.has(item.id)) {
      links.edit = {
        href: `/api/internal/items/${item.id}`,
        method: 'PUT',
        title: 'Edit listing',
        requiresAuth: true
      };
      
      links.updateStock = {
        href: `/api/internal/items/${item.id}/stock`,
        method: 'PATCH',
        title: 'Update stock',
        requiresAuth: true
      };
    }
    
    // Community actions (authenticated users)
    links.reportPrice = {
      href: '/api/v1/reports/price',
      method: 'POST',
      title: 'Report price change',
      requiresAuth: true
    };
    
    // Moderator+ actions
    if (userContext.permissions.has('VERIFY_PRICES')) {
      links.verify = {
        href: `/api/v1/items/${item.id}/verify`,
        method: 'PATCH',
        title: 'Verify current',
        requiresAuth: true,
        permission: 'VERIFY_PRICES'
      };
    }
  }
  
  return links;
}

/**
 * Transform raw database item to enhanced marketplace item
 */
function transformDatabaseItem(item: any, userContext?: UserContext): EnhancedMarketplaceItem {
  const enhanced: EnhancedMarketplaceItem = {
    // Existing fields
    id: item.id,
    name: item.name,
    description: item.description || `Quality ${item.name.toLowerCase()}`,
    category: item.category,
    price: item.price_diamonds,
    priceDisplay: formatPrice(item.price_diamonds, item.trading_unit).text,
    tradingUnit: item.trading_unit,
    shopName: item.owner_shop_name || 'Local Shop',
    serverName: item.server_name || 'MainServer',
    stockQuantity: item.stock_quantity,
    
    // Enhanced location fields
    location: {
      biome: item.biome,
      direction: item.direction,
      warpCommand: item.warp_command,
      coordinates: item.coordinates_x && item.coordinates_z ? {
        x: item.coordinates_x,
        z: item.coordinates_z
      } : undefined
    },
    
    // Enhanced verification fields
    verification: {
      lastVerified: item.last_verified ? new Date(item.last_verified) : undefined,
      verifiedBy: item.verified_by,
      confidenceLevel: item.confidence_level || 'medium'
    },
    
    // Generate HATEOAS links
    _links: generateHATEOASLinks(item, userContext)
  };
  
  return enhanced;
}

/**
 * Build PostgREST query URL with enhanced filtering support
 */
function buildEnhancedFilterQuery(filters: FilterState = {}, page: number = 1, itemsPerPage: number = 20): string {
  const urlService = new URLConstructionService();
  const offset = (page - 1) * itemsPerPage;
  
  let queryParams = `limit=${itemsPerPage}&offset=${offset}`;
  
  // Existing filters
  if (filters.search) {
    queryParams += `&name=ilike.*${encodeURIComponent(filters.search)}*`;
  }
  
  if (filters.category && filters.category !== 'any') {
    queryParams += `&category=eq.${filters.category}`;
  }
  
  // Enhanced filters
  if (filters.biome && filters.biome !== 'any') {
    queryParams += `&biome=eq.${filters.biome}`;
  }
  
  if (filters.direction && filters.direction !== 'any') {
    queryParams += `&direction=eq.${filters.direction}`;
  }
  
  if (filters.priceRange) {
    // Use the existing price_diamonds field for filtering
    if (filters.priceRange.min !== undefined) {
      queryParams += `&price_diamonds=gte.${filters.priceRange.min}`;
    }
    if (filters.priceRange.max !== undefined) {
      queryParams += `&price_diamonds=lte.${filters.priceRange.max}`;
    }
  }
  
  if (filters.verification && filters.verification !== 'any') {
    if (filters.verification === 'verified') {
      queryParams += `&last_verified=not.is.null`;
    } else {
      queryParams += `&last_verified=is.null`;
    }
  }
  
  // Sorting
  switch (filters.sortBy) {
    case 'price_asc':
      queryParams += '&order=price_diamonds.asc';
      break;
    case 'name_asc':
      queryParams += '&order=name.asc';
      break;
    case 'recent':
      queryParams += '&order=created_at.desc';
      break;
    case 'verified_first':
      queryParams += '&order=last_verified.desc.nullslast';
      break;
    default:
      queryParams += '&order=price_diamonds.desc'; // Default: highest price first
  }
  
  return urlService.buildApiUrl(`/public_items?${queryParams}`);
}

/**
 * Load enhanced homepage data with filtering support
 */
export async function loadEnhancedHomepageData(
  filters: FilterState = {},
  page: number = 1,
  itemsPerPage: number = 20,
  userContext?: UserContext
): Promise<EnhancedHomepageData> {
  try {
    // Generate cache key for this query
    const cacheKey = ValkeyQueryCache.generateKey(filters, page, itemsPerPage);
    
    // Try to get from cache first
    const cachedResult = await globalValkeyCache.get(cacheKey);
    if (cachedResult) {
      console.log(`⚡ Valkey Cache HIT: Returning cached data for ${JSON.stringify(filters)}`);
      return cachedResult;
    }
    
    console.log(`🔍 Valkey Cache MISS: Fetching fresh data for ${JSON.stringify(filters)}`);
    
    const urlService = new URLConstructionService();
    
    // Fetch filtered items
    const itemsUrl = buildEnhancedFilterQuery(filters, page, itemsPerPage);
    console.log(`🔍 Fetching enhanced items: ${itemsUrl}`);
    const response = await fetch(itemsUrl);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const rawItems = await response.json();
    
    // Transform to enhanced format
    const allItems: EnhancedMarketplaceItem[] = rawItems.map((item: any) => 
      transformDatabaseItem(item, userContext)
    );
    
    // Get featured items (top 6 highest priced with good verification)
    const featuredUrl = urlService.buildApiUrl('/public_items?limit=6&order=price_diamonds.desc&confidence_level=not.eq.low');
    const featuredResponse = await fetch(featuredUrl);
    const featuredRaw = featuredResponse.ok ? await featuredResponse.json() : rawItems.slice(0, 6);
    const featuredItems: EnhancedMarketplaceItem[] = featuredRaw.slice(0, 6).map((item: any) =>
      transformDatabaseItem(item, userContext)
    );
    
    // Count total items for pagination (respect filters)
    const countUrl = buildEnhancedFilterQuery(filters, 1, 999999).replace('limit=999999&offset=0&', 'select=id&');
    const totalItemsResponse = await fetch(countUrl);
    const totalItemsCount = totalItemsResponse.ok ? (await totalItemsResponse.json()).length : 0;
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalItemsCount / itemsPerPage);
    const pagination = {
      currentPage: page,
      totalPages,
      itemsPerPage,
      totalItems: totalItemsCount
    };
    
    // Get market stats
    const shopsUrl = urlService.buildApiUrl('/public_items?select=owner_shop_name');
    const shopsResponse = await fetch(shopsUrl);
    const uniqueShops = shopsResponse.ok ? 
      new Set((await shopsResponse.json()).map((item: any) => item.owner_shop_name).filter(Boolean)).size : 0;
    
    const marketStats = {
      totalItems: totalItemsCount,
      activeShops: uniqueShops,
      recentTrades: Math.floor(totalItemsCount * 0.3)
    };
    
    // Group items by category
    const categoriesUrl = urlService.buildApiUrl('/public_items?select=category');
    const categoriesResponse = await fetch(categoriesUrl);
    const categoryData = categoriesResponse.ok ? await categoriesResponse.json() : [];
    const categoryCounts = categoryData.reduce((acc: any, item: any) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
    
    const categories = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count: count as number,
      topItems: allItems.filter(item => item.category === name).slice(0, 2)
    }));
    
    // Generate recent activity
    const recentActivity = [
      ...allItems.slice(0, 2).map((item, index) => ({
        itemName: item.name,
        priceChange: index === 0 ? 'New listing' : 'Stock updated',
        timestamp: new Date(Date.now() - (index + 1) * 1800000).toISOString(),
        shopName: item.shopName
      })),
      ...featuredItems.slice(0, 1).map(item => ({
        itemName: item.name,
        priceChange: 'Price updated',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        shopName: item.shopName
      }))
    ];
    
    const result: EnhancedHomepageData = {
      featuredItems,
      allItems,
      pagination,
      marketStats,
      categories,
      recentActivity
    };
    
    // Cache the result for future requests
    await globalValkeyCache.set(cacheKey, result);
    console.log(`💾 Valkey cached result for ${JSON.stringify(filters)} (${result.allItems.length} items)`);
    
    return result;
    
  } catch (error) {
    console.error('Error loading enhanced homepage data:', error);
    
    // Fallback to basic data if API fails
    return {
      featuredItems: [],
      allItems: [],
      pagination: { currentPage: 1, totalPages: 1, itemsPerPage: 20, totalItems: 0 },
      marketStats: { totalItems: 0, activeShops: 0, recentTrades: 0 },
      categories: [],
      recentActivity: []
    };
  }
}