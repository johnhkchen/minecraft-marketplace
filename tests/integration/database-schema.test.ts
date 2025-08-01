/**
 * Database Schema Validation Tests
 * Tests schema constraints through PostgREST API (nginx ingress)
 */

import { describe, test, expect } from 'vitest';
import { postgrestRequest } from '../setup.js';

describe('Database Schema Validation via PostgREST', () => {
  describe('Data Integrity Constraints', () => {
    test('should enforce category enum constraints', async () => {
      // Verify that only valid categories are returned
      const response = await postgrestRequest('/public_items');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      const validCategories = ['tools', 'armor', 'blocks', 'food', 'misc'];
      
      items.forEach((item: any) => {
        expect(validCategories).toContain(item.category);
      });
    });

    test('should enforce positive price constraints', async () => {
      // All prices should be non-negative
      const response = await postgrestRequest('/public_items');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      
      items.forEach((item: any) => {
        expect(item.price_diamonds).toBeGreaterThanOrEqual(0);
        expect(typeof item.price_diamonds).toBe('number');
      });
    });

    test('should enforce trading unit enum constraints', async () => {
      // Verify that only valid trading units are returned
      const response = await postgrestRequest('/public_items');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      const validTradingUnits = ['per_item', 'per_stack', 'per_shulker'];
      
      items.forEach((item: any) => {
        expect(validTradingUnits).toContain(item.trading_unit);
      });
    });
  });

  describe('View Structure Validation', () => {
    test('should include all required fields in public_items view', async () => {
      const response = await postgrestRequest('/public_items?limit=1');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      if (items.length > 0) {
        const item = items[0];
        
        // Core item fields
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('minecraft_id');
        expect(item).toHaveProperty('stock_quantity');
        expect(item).toHaveProperty('is_available');
        expect(item).toHaveProperty('server_name');
        expect(item).toHaveProperty('shop_location');
        
        // Pricing fields
        expect(item).toHaveProperty('price_diamonds');
        expect(item).toHaveProperty('trading_unit');
        
        // Owner fields (joined from users table)
        expect(item).toHaveProperty('owner_username');
        expect(item).toHaveProperty('owner_shop_name');
        
        // Timestamps
        expect(item).toHaveProperty('created_at');
        expect(item).toHaveProperty('updated_at');
      }
    });

    test('should exclude sensitive user data from public view', async () => {
      const response = await postgrestRequest('/public_items?limit=1');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      if (items.length > 0) {
        const item = items[0];
        
        // Should NOT include sensitive user data
        expect(item).not.toHaveProperty('discord_id');
        expect(item).not.toHaveProperty('email');
        expect(item).not.toHaveProperty('password_hash');
        expect(item).not.toHaveProperty('owner_id'); // Internal ID should be hidden
      }
    });
  });

  describe('Query Performance Indicators', () => {
    test('should support efficient filtering operations', async () => {
      // Test that common filter operations work efficiently
      const startTime = Date.now();
      
      const response = await postgrestRequest('/public_items?category=eq.tools&is_available=eq.true&limit=10');
      expect(response.ok).toBe(true);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Should respond quickly, indicating proper indexing
      expect(responseTime).toBeLessThan(1000);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
    });

    test('should support text search operations', async () => {
      // Test that text search works (indicates full-text search is working)
      const response = await postgrestRequest('/public_items?name=ilike.*diamond*&limit=5');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      
      // All results should match the search
      items.forEach((item: any) => {
        expect(item.name.toLowerCase()).toContain('diamond');
      });
    });

    test('should support sorting by price', async () => {
      // Test that price sorting works efficiently
      const response = await postgrestRequest('/public_items?order=price_diamonds.desc&limit=10');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      
      // Should be sorted by price descending
      if (items.length > 1) {
        for (let i = 1; i < items.length; i++) {
          expect(items[i].price_diamonds).toBeLessThanOrEqual(items[i-1].price_diamonds);
        }
      }
    });
  });

  describe('Data Consistency Validation', () => {
    test('should have consistent stock quantities', async () => {
      const response = await postgrestRequest('/public_items');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      
      items.forEach((item: any) => {
        expect(typeof item.stock_quantity).toBe('number');
        expect(item.stock_quantity).toBeGreaterThanOrEqual(0);
        
        // If item is available, stock should be > 0 (business rule)
        if (item.is_available === true) {
          expect(item.stock_quantity).toBeGreaterThan(0);
        }
      });
    });

    test('should have valid minecraft_id patterns', async () => {
      const response = await postgrestRequest('/public_items');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      
      items.forEach((item: any) => {
        expect(typeof item.minecraft_id).toBe('string');
        expect(item.minecraft_id.length).toBeGreaterThan(0);
        
        // Should follow minecraft naming convention (lowercase, underscores)
        expect(item.minecraft_id).toMatch(/^[a-z_]+$/);
      });
    });
  });
});