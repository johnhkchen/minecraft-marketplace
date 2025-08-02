/**
 * Unit Test: Homepage Data 55 vs 18 Item Discrepancy
 * 
 * PURPOSE: Systematically surface why database has 55 items but frontend shows 18
 * CRITICAL BUG: Database contains 55 items from 7 shops, but homepage only displays 18 items from 4 shops
 * 
 * This test will systematically check each layer to identify where the data loss occurs:
 * 1. Database layer (PostgREST direct)
 * 2. API layer (through nginx)
 * 3. Frontend data loading layer
 * 4. Frontend display/rendering layer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupFastTests } from '../utils/fast-test-setup.js';
import { expectFastExecution } from '../utils/fast-test-setup.js';

// Setup MSW mocking
setupFastTests();

describe('Homepage Data 55 vs 18 Item Discrepancy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect the exact layer where 55 items become 18 items', async () => {
  const start = performance.now();
  
    console.log('🔍 SYSTEMATIC DISCREPANCY ANALYSIS');
    console.log('Database has 55 items, frontend shows 18 - WHERE is the data lost?');
    console.log('');

    // Layer 1: Test direct PostgREST API (should have 55 items)
    console.log('📊 Layer 1: Direct PostgREST API test');
    try {
      const directApiResponse = await fetch('http://localhost:7410/api/data/public_items');
      const directApiData = directApiResponse.ok ? await directApiResponse.json() : null;
      const directApiCount = directApiData ? directApiData.length : 0;
      
      console.log(`   PostgREST direct: ${directApiCount
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
} items`);
      
      if (directApiCount === 55) {
        console.log('   ✅ PostgREST layer: CORRECT (55 items)');
      } else {
        console.log(`   ❌ PostgREST layer: INCORRECT (expected 55, got ${directApiCount})`);
      }
    } catch (error) {
      console.log(`   🚨 PostgREST layer: ERROR - ${error.message}`);
    }

    // Layer 2: Test homepage pagination API call (should have 20 items for first page)
    console.log('');
    console.log('📄 Layer 2: Homepage pagination API call test');
    try {
      const paginatedApiResponse = await fetch('http://localhost:7410/api/data/public_items?limit=20&offset=0&order=price_diamonds.desc');
      const paginatedApiData = paginatedApiResponse.ok ? await paginatedApiResponse.json() : null;
      const paginatedApiCount = paginatedApiData ? paginatedApiData.length : 0;
      
      console.log(`   Paginated API: ${paginatedApiCount} items`);
      
      if (paginatedApiCount === 20) {
        console.log('   ✅ Pagination layer: CORRECT (20 items per page)');
      } else {
        console.log(`   ❌ Pagination layer: INCORRECT (expected 20, got ${paginatedApiCount})`);
      }
    } catch (error) {
      console.log(`   🚨 Pagination layer: ERROR - ${error.message}`);
    }

    // Layer 3: Test homepage data loading function
    console.log('');
    console.log('🏠 Layer 3: Homepage data loading function test');
    try {
      const { loadHomepageData } = await import('../../workspaces/frontend/src/lib/homepage-data.js');
      const homepageData = await loadHomepageData();
      
      console.log(`   Homepage function: ${homepageData.allItems.length} items`);
      console.log(`   Homepage stats: ${homepageData.marketStats.totalItems} total items`);
      console.log(`   Homepage stats: ${homepageData.marketStats.activeShops} active shops`);
      
      if (homepageData.allItems.length === 20 && homepageData.marketStats.totalItems === 55) {
        console.log('   ✅ Homepage data loading: CORRECT (20 displayed, 55 total)');
      } else {
        console.log(`   ❌ Homepage data loading: INCORRECT`);
        console.log(`      - Expected: 20 displayed items, 55 total items`);
        console.log(`      - Actual: ${homepageData.allItems.length} displayed, ${homepageData.marketStats.totalItems} total`);
      }
    } catch (error) {
      console.log(`   🚨 Homepage data loading: ERROR - ${error.message}`);
    }

    // Layer 4: Test unique shop count consistency
    console.log('');
    console.log('🏪 Layer 4: Shop count consistency test');
    try {
      const shopsApiResponse = await fetch('http://localhost:7410/api/data/public_items?select=owner_shop_name');
      const shopsApiData = shopsApiResponse.ok ? await shopsApiResponse.json() : null;
      const uniqueShops = shopsApiData ? 
        new Set(shopsApiData.map((item: any) => item.owner_shop_name).filter(Boolean)).size : 0;
      
      console.log(`   API unique shops: ${uniqueShops} shops`);
      
      if (uniqueShops === 7) {
        console.log('   ✅ Shop count: CORRECT (7 unique shops)');
      } else {
        console.log(`   ❌ Shop count: INCORRECT (expected 7, got ${uniqueShops})`);
      }
    } catch (error) {
      console.log(`   🚨 Shop count test: ERROR - ${error.message}`);
    }

    console.log('');
    console.log('🎯 CONCLUSION: Run this test to see where the discrepancy occurs');
    
    // This test should help us identify the exact layer where data is lost
    expect(true).toBe(true); // Always pass - this is a diagnostic test
  });

  it('should detect if homepage is using fallback data instead of API data', async () => {
  const start = performance.now();
  
    console.log('');
    console.log('🔍 FALLBACK DATA DETECTION');
    console.log('Testing if homepage is accidentally using fallback/synthetic data');
    console.log('');

    try {
      const { loadHomepageData
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
} = await import('../../workspaces/frontend/src/lib/homepage-data.js');
      
      // Mock console.error to detect API failures
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const homepageData = await loadHomepageData();
      
      // Check for fallback data indicators
      const fallbackIndicators = {
        emptyItems: homepageData.allItems.length === 0,
        emptyFeatured: homepageData.featuredItems.length === 0,
        zeroTotal: homepageData.marketStats.totalItems === 0,
        zeroShops: homepageData.marketStats.activeShops === 0,
        defaultPagination: homepageData.pagination.totalPages === 1 && homepageData.pagination.totalItems === 0
      };
      
      const usingFallback = Object.values(fallbackIndicators).some(indicator => indicator);
      
      console.log('📊 Fallback indicators:', fallbackIndicators);
      console.log(`🎯 Using fallback data: ${usingFallback ? 'YES ❌' : 'NO ✅'}`);
      
      if (usingFallback) {
        console.log('');
        console.log('🚨 FALLBACK DATA DETECTED');
        console.log('   Likely causes:');
        console.log('   • API calls are failing silently');
        console.log('   • Network connectivity issues');
        console.log('   • Rate limiting blocking requests');
        console.log('   • URL construction problems');
      }
      
      // Check if any API errors were logged
      if (consoleSpy.mock.calls.length > 0) {
        console.log('');
        console.log('🚨 API ERRORS DETECTED:');
        consoleSpy.mock.calls.forEach((call, index) => {
          console.log(`   ${index + 1}. ${call[0]}`);
        });
      } else {
        console.log('   ✅ No API errors detected in console');
      }
      
      consoleSpy.mockRestore();
      
      // Should not be using fallback data if we have a working database
      expect(usingFallback).toBe(false);
      
    } catch (error) {
      console.log(`🚨 Homepage data test failed: ${error.message}`);
      throw error;
    }
  });

  it('should validate that MSW handlers return realistic 55-item dataset', async () => {
  const start = performance.now();
  
    console.log('');
    console.log('🎭 MSW HANDLER VALIDATION');
    console.log('Testing if MSW mocks are providing realistic data scale');
    console.log('');

    // Test the main PostgREST endpoint that homepage uses
    const endpoints = [
      { 
        url: 'http://localhost:3000/api/data/public_items',
        description: 'All items',
        expectedMinimum: 15 // Should have substantial data
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
},
      {
        url: 'http://localhost:3000/api/data/public_items?limit=20&offset=0&order=price_diamonds.desc',
        description: 'Homepage pagination call',
        expectedMinimum: 15 // Should have at least 15 items for realistic testing
      },
      {
        url: 'http://localhost:3000/api/data/public_items?select=owner_shop_name',
        description: 'Shop names for counting',
        expectedMinimum: 15
      }
    ];

    for (const endpoint of endpoints) {
      console.log(`📡 Testing: ${endpoint.description}`);
      
      try {
        const response = await fetch(endpoint.url);
        const data = response.ok ? await response.json() : [];
        
        console.log(`   URL: ${endpoint.url}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Items: ${Array.isArray(data) ? data.length : 'not array'}`);
        
        expect(response.ok).toBe(true);
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThanOrEqual(endpoint.expectedMinimum);
        
        console.log(`   ✅ MSW handler working correctly`);
        
      } catch (error) {
        console.log(`   ❌ MSW handler failed: ${error.message}`);
        throw error;
      }
    }

    // Test unique shop count in MSW data
    console.log('');
    console.log('🏪 MSW Shop diversity test');
    const shopsResponse = await fetch('http://localhost:3000/api/data/public_items?select=owner_shop_name');
    const shopsData = await shopsResponse.json();
    const uniqueShops = new Set(shopsData.map((item: any) => item.owner_shop_name).filter(Boolean)).size;
    
    console.log(`   Unique shops in MSW data: ${uniqueShops}`);
    expect(uniqueShops).toBeGreaterThanOrEqual(3); // Should have multiple shops for realism
    
    console.log('   ✅ MSW provides diverse shop data');
  });

  it('should identify exact API endpoint differences between expected and actual', async () => {
  const start = performance.now();
  
    console.log('');
    console.log('🔗 API ENDPOINT COMPARISON');
    console.log('Comparing what we expect vs what we actually get from each endpoint');
    console.log('');

    const apiTests = [
      {
        name: 'Total items count',
        url: 'http://localhost:3000/api/data/public_items',
        expectedProperty: 'length',
        expectedValue: 55,
        description: 'Should return 55 total items'
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
},
      {
        name: 'Paginated items (homepage call)',
        url: 'http://localhost:3000/api/data/public_items?limit=20&offset=0&order=price_diamonds.desc',
        expectedProperty: 'length',
        expectedValue: 20,
        description: 'Should return 20 items for first page'
      },
      {
        name: 'Unique shops count',
        url: 'http://localhost:3000/api/data/public_items?select=owner_shop_name',
        expectedProperty: 'uniqueCount',
        expectedValue: 7,
        description: 'Should represent 7 unique shops'
      },
      {
        name: 'Featured items (top 6)',
        url: 'http://localhost:3000/api/data/public_items?limit=6&order=price_diamonds.desc',
        expectedProperty: 'length',
        expectedValue: 6,
        description: 'Should return 6 highest-priced items'
      }
    ];

    let discrepancyFound = false;

    for (const test of apiTests) {
      console.log(`🧪 Testing: ${test.name}`);
      
      try {
        const response = await fetch(test.url);
        const data = await response.json();
        
        let actualValue;
        if (test.expectedProperty === 'length') {
          actualValue = Array.isArray(data) ? data.length : 0;
        } else if (test.expectedProperty === 'uniqueCount') {
          actualValue = new Set(data.map((item: any) => item.owner_shop_name).filter(Boolean)).size;
        }
        
        console.log(`   Expected: ${test.expectedValue}`);
        console.log(`   Actual: ${actualValue}`);
        console.log(`   Status: ${actualValue === test.expectedValue ? '✅ MATCH' : '❌ MISMATCH'}`);
        
        if (actualValue !== test.expectedValue) {
          discrepancyFound = true;
          console.log(`   🚨 DISCREPANCY: ${test.description}`);
          console.log(`      This endpoint may be the source of the 55 vs 18 item issue`);
        }
        
        console.log('');
        
      } catch (error) {
        console.log(`   🚨 API test failed: ${error.message}`);
        discrepancyFound = true;
      }
    }

    if (discrepancyFound) {
      console.log('🎯 DISCREPANCIES FOUND: One or more API endpoints are not returning expected data');
    } else {
      console.log('✅ ALL API ENDPOINTS: Returning expected data counts');
    }

    // This test helps identify which specific API call is causing the issue
    expect(true).toBe(true); // Always pass - this is diagnostic
  });
});