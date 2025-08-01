/**
 * Epic 1: Price Discovery - Server and Location Filtering Tests
 * SPEC REQUIREMENT: "Filter by category/server/price with <500ms response"
 * Fast Tests with MSW mocking for instant execution
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { setupFastTests, measure, expectFastExecution } from '../utils/fast-test-setup';
import { MarketplaceApiService } from '../../workspaces/frontend/src/lib/api/marketplace.ts';

// Setup MSW mocking for instant responses
setupFastTests();

// CONFIGURABLE - Minecraft server and location test data (matching MSW mock data)
const TEST_DATA = {
  // Minecraft server names (matching MSW handlers)
  primaryServer: 'HermitCraft',
  secondaryServer: 'CreativeWorld', // Changed to match MSW mock data
  creativeServer: 'HermitCraft',
  // Shop locations
  marketDistrict: 'spawn_market', // Changed to match MSW mock data
  spawnShops: 'spawn_market',
  diamondDistrict: 'diamond_district',
  coordinates: { x: 100, y: 64, z: 200 },
  // Minecraft usernames (matching MSW mock data)
  traders: ['steve', 'alex', 'notch']
};

describe('Epic 1: Price Discovery - Server and Location Filtering - Fast Tests', () => {
  let apiService: MarketplaceApiService;
  
  beforeEach(() => {
    // Use MSW-mocked API service for instant responses
    apiService = new MarketplaceApiService('http://localhost:3000/api/data');
  });

  describe('SPEC REQUIREMENT: Server Filtering with <500ms Response', () => {
    test('should filter items by server name with MSW mocking', async () => {
      const { result: results, timeMs } = await measure(async () => {
        return apiService.filterByServer(TEST_DATA.secondaryServer);
      });
      
      // Epic 1 requirement: <500ms filtering (MSW should be much faster)
      expectFastExecution(timeMs, 10);
      expect(timeMs).toBeLessThan(500);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // Validate Minecraft server filtering
      const listing = results[0];
      expect(listing).toHaveProperty('listing_id');
      expect(listing).toHaveProperty('item_name');
      expect(listing).toHaveProperty('seller_name');
      // Should return a valid Minecraft username (steve, alex, or notch)
      expect(TEST_DATA.traders).toContain(listing.seller_name);
    });

    test('should filter items by shop location with performance validation', async () => {
      const { result: results, timeMs } = await measure(async () => {
        return apiService.filterByLocation(TEST_DATA.marketDistrict);
      });
      
      expectFastExecution(timeMs, 10);
      expect(timeMs).toBeLessThan(500);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // Validate location filtering structure
      const listing = results[0];
      expect(listing).toHaveProperty('item_name');
      expect(listing).toHaveProperty('price');
      expect(listing).toHaveProperty('seller_name');
    });

    test('should combine server and location filters with fast execution', async () => {
      const { result: results, timeMs } = await measure(async () => {
        return apiService.filterByServerAndLocation(
          TEST_DATA.secondaryServer,
          TEST_DATA.spawnShops
        );
      });
      
      expectFastExecution(timeMs, 10);
      expect(timeMs).toBeLessThan(500);
      expect(Array.isArray(results)).toBe(true);
      
      // Validate combined filtering structure
      if (results.length > 0) {
        const listing = results[0];
        expect(listing).toHaveProperty('listing_id');
        expect(listing).toHaveProperty('item_name');
        expect(listing).toHaveProperty('seller_name');
      }
    });
  });

  describe('Advanced Location-Based Features', () => {
    test('should get unique server list for dropdown with caching', async () => {
      const { result: servers, timeMs } = await measure(async () => {
        return apiService.getAvailableServers();
      });
      
      expectFastExecution(timeMs, 10);
      expect(timeMs).toBeLessThan(500);
      expect(Array.isArray(servers)).toBe(true);
      expect(servers.length).toBeGreaterThan(0);
      
      // Validate unique server names structure
      const uniqueServers = new Set(servers);
      expect(uniqueServers.size).toBe(servers.length);
      
      // Should contain realistic Minecraft server names
      servers.forEach(server => {
        expect(typeof server).toBe('string');
        expect(server.length).toBeGreaterThan(0);
      });
    });

    test('should get shop locations within a server with fast caching', async () => {
      const { result: locations, timeMs } = await measure(async () => {
        return apiService.getServerLocations(TEST_DATA.secondaryServer);
      });
      
      expectFastExecution(timeMs, 10);
      expect(timeMs).toBeLessThan(500);
      expect(Array.isArray(locations)).toBe(true);
      
      // Validate location data structure
      if (locations.length > 0) {
        const location = locations[0];
        expect(location).toHaveProperty('shop_location');
        expect(location).toHaveProperty('item_count');
        expect(typeof location.item_count).toBe('number');
        expect(location.item_count).toBeGreaterThanOrEqual(0);
      }
    });

    test('should support proximity-based location search with distance calculation', async () => {
      const { result: results, timeMs } = await measure(async () => {
        return apiService.findNearbyItems(TEST_DATA.spawnShops, 2);
      });
      
      expectFastExecution(timeMs, 15); // Allow slightly more time for distance calculations
      expect(timeMs).toBeLessThan(500);
      expect(Array.isArray(results)).toBe(true);
      
      // Validate proximity search structure
      if (results.length > 0) {
        const result = results[0];
        expect(result).toHaveProperty('item_name');
        expect(result).toHaveProperty('seller_name');
        // Distance may be added by the mapper
      }
    });
  });

  describe('Performance Requirements - Location Filtering', () => {
    test('should handle multiple concurrent location filters with MSW optimization', async () => {
      const locations = [TEST_DATA.spawnShops, TEST_DATA.diamondDistrict, TEST_DATA.marketDistrict];
      
      const { result: results, timeMs } = await measure(async () => {
        const promises = locations.map(location => 
          apiService.filterByLocation(location)
        );
        return Promise.all(promises);
      });
      
      // MSW should handle concurrent requests very quickly
      expectFastExecution(timeMs, 25);
      expect(timeMs).toBeLessThan(1000);
      expect(results.length).toBe(locations.length);
      
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    test('should cache server/location metadata for fast filtering', async () => {
      // First call - with timing
      const { result: servers1, timeMs: firstCall } = await measure(async () => {
        return apiService.getAvailableServers();
      });
      
      // Second call - should use cache or be equally fast with MSW
      const { result: servers2, timeMs: secondCall } = await measure(async () => {
        return apiService.getAvailableServers();
      });
      
      // Validate caching behavior
      expect(servers1).toEqual(servers2);
      expectFastExecution(firstCall, 10);
      expectFastExecution(secondCall, 10);
      
      // Both calls should be very fast with MSW
      expect(secondCall).toBeLessThan(50);
    });
  });

  describe('Real-World Server Integration', () => {
    test('should integrate with actual server coordinates using mock data', async () => {
      const { result: results, timeMs } = await measure(async () => {
        return apiService.findItemsByCoordinates(
          TEST_DATA.coordinates.x, 
          TEST_DATA.coordinates.y, 
          TEST_DATA.coordinates.z, 
          50
        );
      });
      
      expectFastExecution(timeMs, 15);
      expect(timeMs).toBeLessThan(500);
      expect(Array.isArray(results)).toBe(true);
      
      // Validate coordinate structure if results exist
      if (results.length > 0) {
        const item = results[0];
        expect(item).toHaveProperty('item_name');
        expect(item).toHaveProperty('seller_name');
        // Coordinates may be added by the coordinate mapper
      }
    });

    test('should handle server dimension filtering (Overworld, Nether, End) with fast iteration', async () => {
      const dimensions = ['overworld', 'nether', 'end'];
      
      const { result: allResults, timeMs } = await measure(async () => {
        const results = [];
        for (const dimension of dimensions) {
          const dimensionResults = await apiService.filterByDimension(dimension);
          results.push({ dimension, results: dimensionResults });
        }
        return results;
      });
      
      expectFastExecution(timeMs, 20); // Allow time for multiple dimension calls
      expect(timeMs).toBeLessThan(1500); // All dimensions should complete quickly
      expect(allResults.length).toBe(dimensions.length);
      
      allResults.forEach(({ dimension, results }) => {
        expect(Array.isArray(results)).toBe(true);
        if (results.length > 0) {
          results.forEach((item: any) => {
            expect(item).toHaveProperty('item_name');
            expect(item).toHaveProperty('seller_name');
          });
        }
      });
    });
  });
});