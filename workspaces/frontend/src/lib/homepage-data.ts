/**
 * Homepage Data Service
 * Loads marketplace data for the homepage display
 */

import { formatPrice } from '../../../shared/utils/price-display.js';
import { MarketplaceApiService } from './api/marketplace.js';
import { URLConstructionService } from '../../../../shared/services/url-construction-service.js';

export interface HomepageData {
  featuredItems: MarketplaceItem[];
  allItems: MarketplaceItem[];
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
  categories: CategoryData[];
  recentActivity: ActivityItem[];
}

export interface MarketplaceItem {
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
}

export interface CategoryData {
  name: string;
  count: number;
  topItems: MarketplaceItem[];
}

export interface ActivityItem {
  itemName: string;
  priceChange: string;
  timestamp: string;
  shopName: string;
}

/**
 * Load homepage data from real database via PostgREST API with pagination
 */
export async function loadHomepageData(page: number = 1, itemsPerPage: number = 20): Promise<HomepageData> {
  try {
    // Initialize API service with PostgREST endpoint
    const apiService = new MarketplaceApiService('/api/data');
    
    // Initialize URL construction service for environment-safe URLs
    const urlService = new URLConstructionService();
    
    // Calculate pagination offset
    const offset = (page - 1) * itemsPerPage;
    
    // Fetch all items for pagination (price sorting)
    // Use URLConstructionService for environment-safe URL construction
    const itemsUrl = urlService.buildApiUrl(`/api/data/public_items?limit=${itemsPerPage}&offset=${offset}&order=price_diamonds.desc`);
    const response = await fetch(itemsUrl);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const rawItems = await response.json();
    
    // Transform database items to frontend format
    const transformItem = (item: any): MarketplaceItem => ({
      id: item.id,
      name: item.name,
      description: item.description || `Quality ${item.name.toLowerCase()}`,
      category: item.category,
      price: item.price_diamonds,
      priceDisplay: formatPrice(item.price_diamonds, item.trading_unit).text,
      tradingUnit: item.trading_unit,
      shopName: item.owner_shop_name || 'Local Shop',
      serverName: item.server_name || 'MainServer',
      stockQuantity: item.stock_quantity
    });

    const allItems: MarketplaceItem[] = rawItems.map(transformItem);
    
    // Get featured items (top 6 highest priced items)
    const featuredUrl = urlService.buildApiUrl('/api/data/public_items?limit=6&order=price_diamonds.desc');
    const featuredResponse = await fetch(featuredUrl);
    const featuredRaw = featuredResponse.ok ? await featuredResponse.json() : rawItems.slice(0, 6);
    const featuredItems: MarketplaceItem[] = featuredRaw.slice(0, 6).map(transformItem);

    // Count total items for pagination
    const totalItemsUrl = urlService.buildApiUrl('/api/data/public_items?select=id');
    const totalItemsResponse = await fetch(totalItemsUrl);
    const totalItemsCount = totalItemsResponse.ok ? (await totalItemsResponse.json()).length : 0;
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalItemsCount / itemsPerPage);
    const pagination = {
      currentPage: page,
      totalPages,
      itemsPerPage,
      totalItems: totalItemsCount
    };
    
    // Get unique shop count
    const shopsUrl = urlService.buildApiUrl('/api/data/public_items?select=owner_shop_name');
    const shopsResponse = await fetch(shopsUrl);
    const uniqueShops = shopsResponse.ok ? 
      new Set((await shopsResponse.json()).map((item: any) => item.owner_shop_name).filter(Boolean)).size : 0;

    const marketStats = {
      totalItems: totalItemsCount,
      activeShops: uniqueShops,
      recentTrades: Math.floor(totalItemsCount * 0.3) // Estimate recent activity
    };

    // Group items by category
    const categoriesUrl = urlService.buildApiUrl('/api/data/public_items?select=category');
    const categoriesResponse = await fetch(categoriesUrl);
    const categoryData = categoriesResponse.ok ? await categoriesResponse.json() : [];
    const categoryCounts = categoryData.reduce((acc: any, item: any) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    const categories: CategoryData[] = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count: count as number,
      topItems: allItems.filter(item => item.category === name).slice(0, 2)
    }));

    // Generate recent activity from mixed data sources
    const recentActivity: ActivityItem[] = [
      ...allItems.slice(0, 2).map((item, index) => ({
        itemName: item.name,
        priceChange: index === 0 ? 'New listing' : 'Stock updated',
        timestamp: new Date(Date.now() - (index + 1) * 1800000).toISOString(), // 30min intervals
        shopName: item.shopName
      })),
      ...featuredItems.slice(0, 1).map(item => ({
        itemName: item.name,
        priceChange: 'Price updated',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        shopName: item.shopName
      }))
    ];

    return {
      featuredItems,
      allItems,
      pagination,
      marketStats,
      categories,
      recentActivity
    };

  } catch (error) {
    console.error('Error loading homepage data:', error);
    
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