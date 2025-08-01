/**
 * Homepage Data Integration Tests
 * TDD for real marketplace homepage functionality
 */

import { describe, it, expect } from 'vitest';
import { loadHomepageData } from '../../src/lib/homepage-data.ts';

describe('Homepage Data Integration - TDD', () => {
  describe('Homepage data loading', () => {
    it('should load featured marketplace items on homepage', async () => {
      // GREEN: Use real loadHomepageData function
      const homepageData = await loadHomepageData();

      // Test that we have featured items with proper structure
      expect(homepageData.featuredItems.length).toBeGreaterThan(0);
      expect(homepageData.marketStats.totalItems).toBeGreaterThan(5);
      expect(homepageData.marketStats.activeShops).toBeGreaterThan(2);
      
      // Verify item structure
      const firstItem = homepageData.featuredItems[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('name');
      expect(firstItem).toHaveProperty('price');
      expect(firstItem).toHaveProperty('priceDisplay');
      expect(firstItem).toHaveProperty('shopName');
    });

    it('should display top-selling items by category', async () => {
      // GREEN: Use real data from loadHomepageData
      const homepageData = await loadHomepageData();
      const categories = homepageData.categories;
      
      expect(categories.length).toBeGreaterThan(0);
      
      // Test that categories have items
      const toolsCategory = categories.find(cat => cat.name === 'tools');
      expect(toolsCategory).toBeDefined();
      expect(toolsCategory?.topItems.length).toBeGreaterThan(0);
    });

    it('should show recent price updates and market activity', async () => {
      // GREEN: Use real data from loadHomepageData
      const homepageData = await loadHomepageData();
      const recentActivity = homepageData.recentActivity;
      
      expect(recentActivity.length).toBeGreaterThan(0);
      expect(recentActivity[0]).toHaveProperty('itemName');
      expect(recentActivity[0]).toHaveProperty('priceChange');
      expect(recentActivity[0]).toHaveProperty('timestamp');
      expect(recentActivity[0]).toHaveProperty('shopName');
    });
  });

  describe('Homepage performance', () => {
    it('should load homepage data in under 500ms', async () => {
      // GREEN: Test real function performance
      const start = performance.now();
      
      const homepageData = await loadHomepageData();
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500);
      expect(homepageData).toBeDefined();
      expect(homepageData.featuredItems).toBeDefined();
      expect(homepageData.marketStats).toBeDefined();
    });
  });
});