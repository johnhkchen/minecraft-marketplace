/**
 * Debug test for homepage data loading issue
 * This test will help us identify exactly what's failing
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { setupFastTests } from '../utils/fast-test-setup.js';

// Setup MSW mocking
setupFastTests();

describe('Homepage Data Loading Debug', () => {
  beforeAll(() => {
    // Ensure we have a clean test environment
    console.log('🔧 Starting debug tests for homepage data loading');
  });

  it('should load basic homepage data structure', async () => {
    // Import the actual function we're testing
    const { loadHomepageData } = await import('../../workspaces/frontend/src/lib/homepage-data.js');
    
    console.log('📊 Testing loadHomepageData function...');
    
    // RED: Test the current behavior
    const result = await loadHomepageData();
    
    console.log('📋 Result structure:', {
      featuredItems: result.featuredItems?.length || 0,
      allItems: result.allItems?.length || 0,
      pagination: result.pagination ? 'exists' : 'missing',
      marketStats: result.marketStats ? 'exists' : 'missing'
    });
    
    // Test what we actually get vs what we expect
    expect(result).toBeDefined();
    expect(result.featuredItems).toBeDefined();
    expect(Array.isArray(result.featuredItems)).toBe(true);
    
    // The bug: These should exist but might not
    console.log('🔍 Checking for pagination data...');
    expect(result.allItems).toBeDefined();
    expect(result.pagination).toBeDefined();
    expect(result.pagination.totalItems).toBeGreaterThan(0);
  });

  it('should handle API failures gracefully', async () => {
    // Test what happens when API fails
    const { loadHomepageData } = await import('../../workspaces/frontend/src/lib/homepage-data.js');
    
    // Mock a failing API call by testing with invalid parameters
    try {
      const result = await loadHomepageData(-1, -1); // Invalid page/itemsPerPage
      console.log('💔 API failure result:', {
        featuredItems: result.featuredItems?.length || 0,
        allItems: result.allItems?.length || 0,
        pagination: result.pagination
      });
      
      // Even on failure, we should get the correct structure
      expect(result.allItems).toBeDefined();
      expect(result.pagination).toBeDefined();
    } catch (error) {
      console.log('❌ Error during API failure test:', error.message);
      throw error;
    }
  });

  it('should fetch data with correct API endpoints', async () => {
    // Test the actual API calls that the function makes
    console.log('🌐 Testing API endpoints directly...');
    
    // Test the main API endpoint
    try {
      const response = await fetch('http://localhost:3000/api/data/public_items?limit=5&offset=0&order=price_diamonds.desc');
      console.log('📡 API Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 API Data Sample:', {
          count: data.length,
          firstItem: data[0]?.name,
          hasPrice: !!data[0]?.price_diamonds
        });
        expect(data.length).toBeGreaterThan(0);
        expect(data[0]).toHaveProperty('name');
        expect(data[0]).toHaveProperty('price_diamonds');
      } else {
        console.log('❌ API call failed:', response.statusText);
        expect(response.ok).toBe(true); // This will fail and show us the issue
      }
    } catch (error) {
      console.log('🚨 Network error:', error.message);
      throw error;
    }
  });
});