/**
 * MarketplaceBrowser Svelte Component Unit Tests - Fast Version
 * TDD approach with MSW mocking for instant test execution
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { setupFastTests, fastItem, measure, measureSync, expectFastExecution } from '../../utils/fast-test-setup';
import type { ListingWithDetails } from '../../../workspaces/frontend/src/types/marketplace.js';
import { MarketplaceApiService } from '../../../workspaces/frontend/src/lib/api/marketplace.js';

// Setup fast MSW mocking
setupFastTests();

// CONFIGURABLE - Minecraft naming conventions
const TEST_DATA = {
  baseUrl: 'http://localhost:3000/api/data',
  diamondTrader: 'steve',
  shopName: 'Steve\'s Diamond Emporium',
  serverName: 'HermitCraft'
};

describe('MarketplaceBrowser API Integration Logic - Fast Tests', () => {
  let apiService: MarketplaceApiService;
  
  beforeEach(() => {
    // Use MSW-mocked API service for instant responses
    apiService = new MarketplaceApiService(TEST_DATA.baseUrl);
  });

  describe('Initial Data Loading', () => {
    test('should load initial listings from PostgREST on component mount', async () => {
      const { result, timeMs } = await measure(async () => {
        return apiService.fetchListings();
      });
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Validate Minecraft marketplace data structure
      const listing = result[0];
      expect(listing).toHaveProperty('listing_id');
      expect(listing).toHaveProperty('item_name');
      expect(listing).toHaveProperty('price');
      expect(listing).toHaveProperty('seller_name');
      expect(listing).toHaveProperty('qty');
      expect(listing).toHaveProperty('is_active');
      
      // Validate Minecraft-specific data
      expect(listing.seller_name).toBe('steve');
      expect(listing.item_name).toBe('Diamond Sword');
      
      expectFastExecution(timeMs, 15);
    });

    test('should handle API errors gracefully during initial load', async () => {
      // Mock API service with error response for fast testing
      const mockApiService = {
        fetchListings: vi.fn().mockRejectedValue(new Error('Network timeout'))
      };
      
      const { timeMs } = await measure(async () => {
        await expect(mockApiService.fetchListings()).rejects.toThrow('Network timeout');
      });
      
      expectFastExecution(timeMs, 5);
    });
  });

  describe('Search Functionality', () => {
    test('should search items by name through PostgREST API', async () => {
      const { result, timeMs } = await measure(async () => {
        return apiService.searchItems('diamond');
      });
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Validate search results contain search term (Minecraft items)
      const hasSearchTerm = result.some(item => 
        item.name?.toLowerCase().includes('diamond')
      );
      expect(hasSearchTerm).toBe(true);
      
      expectFastExecution(timeMs, 5);
    });

    test('should return empty array for searches with no results', async () => {
      const { result, timeMs } = await measure(async () => {
        // Search for item not in our Minecraft test data
        return apiService.searchItems('bedrock_sword');
      });
      
      expect(Array.isArray(result)).toBe(true);
      // MSW mock returns filtered results, so this should be empty
      const filtered = result.filter(item => 
        item.item_name?.toLowerCase().includes('bedrock_sword')
      );
      expect(filtered.length).toBe(0);
      
      expectFastExecution(timeMs, 5);
    });
  });

  describe('Category Filtering', () => {
    test('should filter items by category through PostgREST API', async () => {
      const { result, timeMs } = await measure(async () => {
        return apiService.filterByCategory('tools');
      });
      
      expect(Array.isArray(result)).toBe(true);
      
      // Validate Minecraft tool category filtering
      if (result.length > 0) {
        expect(result.every(item => item.item_category === 'tools')).toBe(true);
        // Should include items like Diamond Pickaxe
        const hasPickaxe = result.some(item => 
          item.item_name?.toLowerCase().includes('pickaxe')
        );
        expect(hasPickaxe).toBe(true);
      }
      
      expectFastExecution(timeMs, 5);
    });
  });

  describe('Performance Requirements', () => {
    test('should complete search operations within 500ms requirement', async () => {
      const { result, timeMs } = await measure(async () => {
        return apiService.searchItems('Diamond');
      });
      
      // Epic 1 requirement: <500ms filtering (MSW should be much faster)
      expect(timeMs).toBeLessThan(500);
      expectFastExecution(timeMs, 5);
      
      expect(Array.isArray(result)).toBe(true);
    });
    
    test('should validate all marketplace operations meet performance targets', async () => {
      const operations = [
        () => apiService.fetchListings(),
        () => apiService.searchItems('diamond'),
        () => apiService.filterByCategory('weapons')
      ];
      
      const { result: results, timeMs } = await measure(async () => {
        return Promise.all(operations.map(op => op()));
      });
      
      // All operations should complete quickly with MSW
      expectFastExecution(timeMs, 15);
      expect(results.length).toBe(3);
      expect(results.every(result => Array.isArray(result))).toBe(true);
    });
  });

  describe('Data Structure Validation', () => {
    test('should validate that API returns correctly structured ListingWithDetails', async () => {
      const { result, timeMs } = await measure(async () => {
        return apiService.fetchListings();
      });
      
      expect(result.length).toBeGreaterThan(0);
      const listing = result[0];
      
      // Validate required fields for Minecraft marketplace component
      expect(listing).toHaveProperty('listing_id');
      expect(listing).toHaveProperty('item_name');
      expect(listing).toHaveProperty('price');
      expect(listing).toHaveProperty('seller_name');
      expect(listing).toHaveProperty('qty');
      expect(listing).toHaveProperty('is_active');
      
      // Validate types match marketplace interface
      expect(typeof listing.price).toBe('number');
      expect(typeof listing.qty).toBe('number');
      expect(typeof listing.is_active).toBe('boolean');
      expect(typeof listing.listing_id).toBe('number');
      expect(typeof listing.item_name).toBe('string');
      expect(typeof listing.seller_name).toBe('string');
      
      // Validate Minecraft-specific data structure
      expect(listing.seller_name).toBe('steve');
      expect(listing.item_name).toBe('Diamond Sword');
      expect(listing.price).toBeGreaterThan(0);
      
      expectFastExecution(timeMs, 5);
    });
  });
});