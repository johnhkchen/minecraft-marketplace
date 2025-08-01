/**
 * PostgREST Integration Tests
 * Tests the PostgREST API functionality through nginx proxy
 */

import { describe, test, expect } from 'vitest';
import { postgrestRequest, getExistingItems, getExistingUser } from '../setup.js';

describe('PostgREST Integration via nginx', () => {

  describe('Items API', () => {
    test('should fetch items via PostgREST through nginx', async () => {
      // Fetch items via PostgREST through nginx proxy
      const response = await postgrestRequest('/public_items');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
      
      // Verify item structure (using existing data)
      const firstItem = items[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('name');
      expect(firstItem).toHaveProperty('category');
      expect(firstItem).toHaveProperty('price_diamonds');
      expect(firstItem).toHaveProperty('owner_username');
      expect(firstItem).toHaveProperty('owner_shop_name');
    });

    test('should filter items by category', async () => {
      // Filter by tools category using existing data
      const response = await postgrestRequest('/public_items?category=eq.tools');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      
      // All items should be tools (if any exist)
      items.forEach((item: any) => {
        expect(item.category).toBe('tools');
      });
    });

    test('should search items by name', async () => {
      // Search for "Diamond" items using existing data
      const response = await postgrestRequest('/public_items?name=ilike.*Diamond*');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      
      // All returned items should contain "Diamond" in the name
      items.forEach((item: any) => {
        expect(item.name.toLowerCase()).toContain('diamond');
      });
    });
  });

  describe('Public API Endpoints', () => {
    test('should access public endpoints without authentication', async () => {
      // Test that public_items is accessible (no auth required)
      const response = await postgrestRequest('/public_items?limit=1');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      
      if (items.length > 0) {
        const item = items[0];
        // Should include user info through the view without exposing protected data
        expect(item).toHaveProperty('owner_username');
        expect(item).toHaveProperty('owner_shop_name');
        // Should not expose sensitive user data
        expect(item).not.toHaveProperty('discord_id');
        expect(item).not.toHaveProperty('email');
      }
    });
  });

  describe('Price Display Integration', () => {
    test('should include formatted price display in public_items view', async () => {
      // Fetch items with pricing via PostgREST public view
      const response = await postgrestRequest('/public_items?limit=5');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(items.length).toBeGreaterThan(0);
      
      const item = items[0];
      expect(item).toHaveProperty('price_diamonds');
      expect(item).toHaveProperty('trading_unit');
      
      // The view should include owner information
      expect(item).toHaveProperty('owner_username');
      expect(item).toHaveProperty('owner_shop_name');
      
      // Price should be a number
      expect(typeof item.price_diamonds).toBe('number');
      expect(item.price_diamonds).toBeGreaterThan(0);
    });
  });
});