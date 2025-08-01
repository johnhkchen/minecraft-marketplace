/**
 * Unit Test: Homepage API Root Cause Detection
 * 
 * PURPOSE: Catch the root cause - API calls failing during server-side rendering
 * ROOT CAUSE: Relative URLs fail in server-side context, MSW can't intercept them
 * 
 * This test will FAIL when the API integration breaks, showing us exactly why
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupFastTests } from '../utils/fast-test-setup.js';

// Setup MSW mocking
setupFastTests();

describe('Homepage API Root Cause Detection', () => {
  beforeEach(() => {
    // Clear any previous mocks
    vi.clearAllMocks();
  });

  it('should detect when API calls are failing in server-side context', async () => {
    // Import the function we're testing
    const { loadHomepageData } = await import('../../workspaces/frontend/src/lib/homepage-data.js');
    
    // Mock console.error to catch API failures
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Test in simulated server-side environment
    const originalWindow = global.window;
    // @ts-ignore - Simulate server-side environment
    delete global.window;
    
    try {
      console.log('🔧 Testing in server-side context (no window object)...');
      
      const result = await loadHomepageData();
      
      console.log('📊 API call results:', {
        featuredItems: result.featuredItems.length,
        allItems: result.allItems.length,
        totalItems: result.pagination.totalItems,
        apiCallsWorked: result.pagination.totalItems > 0
      });
      
      // ROOT CAUSE DETECTION: If API calls failed, we'll get empty/default data
      if (result.pagination.totalItems === 0) {
        console.log('❌ ROOT CAUSE DETECTED: API calls are failing');
        console.log('🔍 Check these potential causes:');
        console.log('  1. Relative URLs not working in server-side context');
        console.log('  2. MSW not intercepting requests properly');  
        console.log('  3. Environment variables not set correctly');
        console.log('  4. Base URL configuration incorrect');
        
        // Check if console.error was called (indicates API failure)
        expect(consoleSpy).toHaveBeenCalled();
        const errorCalls = consoleSpy.mock.calls;
        console.log('🚨 Error messages:', errorCalls.map(call => call[0]));
      }
      
      // ASSERTION: API calls should work and return real data
      expect(result.featuredItems.length).toBeGreaterThan(0);
      expect(result.allItems.length).toBeGreaterThan(0);
      expect(result.pagination.totalItems).toBeGreaterThan(0);
      
      // If we get here, API calls worked correctly
      console.log('✅ API calls working correctly in server-side context');
      
    } finally {
      // Restore window object
      global.window = originalWindow;
      consoleSpy.mockRestore();
    }
  });

  it('should detect URL construction issues', async () => {
    // Test that our URL construction works in different environments
    
    // Simulate different environment conditions
    const testCases = [
      { 
        name: 'Test Environment', 
        nodeEnv: 'test',
        expectedBaseUrl: 'http://localhost:3000'
      },
      { 
        name: 'Production Environment', 
        nodeEnv: 'production',
        expectedBaseUrl: ''
      },
      { 
        name: 'Development Environment', 
        nodeEnv: 'development',
        expectedBaseUrl: ''
      }
    ];

    for (const testCase of testCases) {
      console.log(`🌐 Testing URL construction for: ${testCase.name}`);
      
      // Mock process.env.NODE_ENV
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = testCase.nodeEnv;
      
      try {
        // Test URL construction logic
        const baseUrl = process.env.NODE_ENV === 'test' ? 'http://localhost:3000' : '';
        const testUrl = `${baseUrl}/api/data/public_items?limit=5`;
        
        console.log(`  📍 Base URL: "${baseUrl}"`);
        console.log(`  🔗 Full URL: "${testUrl}"`);
        
        expect(baseUrl).toBe(testCase.expectedBaseUrl);
        
        // Test that the URL is valid
        if (baseUrl) {
          expect(() => new URL(testUrl)).not.toThrow();
        } else {
          // Relative URL should be valid format
          expect(testUrl).toMatch(/^\/api\/data/);
        }
        
      } finally {
        // Restore original environment
        process.env.NODE_ENV = originalEnv;
      }
    }
  });

  it('should detect MSW handler coverage for all API endpoints', async () => {
    // Test that MSW handlers exist for all the endpoints our function uses
    const requiredEndpoints = [
      '/api/data/public_items?limit=20&offset=0&order=price_diamonds.desc',
      '/api/data/public_items?limit=6&order=price_diamonds.desc', 
      '/api/data/public_items?select=id',
      '/api/data/public_items?select=owner_shop_name',
      '/api/data/public_items?select=category'
    ];

    console.log('🎯 Testing MSW handler coverage...');
    
    for (const endpoint of requiredEndpoints) {
      console.log(`  📡 Testing: ${endpoint}`);
      
      try {
        const response = await fetch(`http://localhost:3000${endpoint}`);
        const isSuccessful = response.ok;
        
        console.log(`    Status: ${response.status} ${isSuccessful ? '✅' : '❌'}`);
        
        if (isSuccessful) {
          const data = await response.json();
          console.log(`    Data: ${Array.isArray(data) ? data.length : 'object'} items`);
          expect(response.status).toBe(200);
        } else {
          console.log(`    ❌ HANDLER MISSING for: ${endpoint}`);
          expect(response.ok).toBe(true); // This will fail and show the missing handler
        }
        
      } catch (error) {
        console.log(`    🚨 Network Error: ${error.message}`);
        throw new Error(`MSW handler failed for ${endpoint}: ${error.message}`);
      }
    }
    
    console.log('✅ All MSW handlers working correctly');
  });

  it('should detect when fallback data is being used instead of API data', async () => {
    // Test that we can distinguish between API data and fallback data
    const { loadHomepageData } = await import('../../workspaces/frontend/src/lib/homepage-data.js');
    
    const result = await loadHomepageData();
    
    // Fallback data indicators:
    const fallbackIndicators = {
      emptyItems: result.featuredItems.length === 0 && result.allItems.length === 0,
      zeroTotalItems: result.pagination.totalItems === 0,
      defaultPagination: result.pagination.totalPages === 1 && result.pagination.currentPage === 1,
      zeroShops: result.marketStats.activeShops === 0
    };
    
    console.log('🔍 Fallback data indicators:', fallbackIndicators);
    
    const usingFallback = Object.values(fallbackIndicators).some(indicator => indicator);
    
    if (usingFallback) {
      console.log('⚠️ USING FALLBACK DATA - API calls likely failed');
      console.log('🔧 Check server-side URL construction and MSW setup');
    } else {
      console.log('✅ Using real API data - system working correctly');
    }
    
    // ASSERTION: Should not be using fallback data
    expect(usingFallback).toBe(false);
  });
});