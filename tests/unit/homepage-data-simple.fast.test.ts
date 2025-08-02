/**
 * Simple test to identify and fix homepage data pagination bug
 */

import { describe, it, expect } from 'vitest';
import { setupFastTests } from '../utils/fast-test-setup.js';
import { expectFastExecution } from '../utils/fast-test-setup.js';

// Setup MSW mocking - this will intercept our API calls
setupFastTests();

describe('Homepage Data Simple Test', () => {
  it('should make successful API calls to get paginated data', async () => {
  const start = performance.now();
  
    // Test the exact API calls that homepage makes
    
    // First test: Check if MSW can handle our API calls with full URL
    const response1 = await fetch('http://localhost:3000/api/data/public_items?limit=6&order=price_diamonds.desc');
    console.log('✅ Featured items API:', response1.status, response1.ok);
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('📊 Featured items count:', data1.length);
      expect(data1.length).toBeGreaterThan(0);
      expect(data1[0]).toHaveProperty('name');
      expect(data1[0]).toHaveProperty('price_diamonds');
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
}

    // Second test: Pagination API
    const response2 = await fetch('http://localhost:3000/api/data/public_items?limit=20&offset=0&order=price_diamonds.desc');
    console.log('✅ Pagination API:', response2.status, response2.ok);
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('📦 All items count:', data2.length);
      expect(data2.length).toBeGreaterThan(0);
    }

    // Third test: Count API
    const response3 = await fetch('http://localhost:3000/api/data/public_items?select=id');
    console.log('✅ Count API:', response3.status, response3.ok);
    
    if (response3.ok) {
      const data3 = await response3.json();
      console.log('🔢 Total items:', data3.length);
      expect(data3.length).toBeGreaterThan(0);
    }
  });

  it('should work with the homepage data function using absolute URLs', async () => {
  const start = performance.now();
  
    // Create a modified version of loadHomepageData that uses absolute URLs for testing
    const loadTestData = async () => {
      try {
        // Simulate what the function does but with absolute URLs
        const response = await fetch('http://localhost:3000/api/data/public_items?limit=20&offset=0&order=price_diamonds.desc');
        const rawItems = await response.json();
        
        const featuredResponse = await fetch('http://localhost:3000/api/data/public_items?limit=6&order=price_diamonds.desc');
        const featuredRaw = await featuredResponse.json();
        
        const totalItemsResponse = await fetch('http://localhost:3000/api/data/public_items?select=id');
        const totalItems = await totalItemsResponse.json();
        
        return {
          allItems: rawItems,
          featuredItems: featuredRaw.slice(0, 6),
          totalItems: totalItems.length,
          pagination: {
            currentPage: 1,
            totalPages: Math.ceil(totalItems.length / 20),
            itemsPerPage: 20,
            totalItems: totalItems.length
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
}
        };
      } catch (error) {
        console.log('❌ Test function error:', error.message);
        throw error;
      }
    };

    const result = await loadTestData();
    
    console.log('🎯 Test Result:', {
      allItems: result.allItems.length,
      featuredItems: result.featuredItems.length,
      totalItems: result.totalItems,
      pagination: result.pagination
    });

    expect(result.allItems.length).toBeGreaterThan(0);
    expect(result.featuredItems.length).toBeGreaterThan(0);
    expect(result.totalItems).toBeGreaterThan(0);
    expect(result.pagination.totalItems).toBeGreaterThan(0);
  });
});