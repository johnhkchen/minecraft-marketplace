/**
 * API Endpoint Integration Tests
 * Tests API endpoints through nginx proxy (single entry point)
 */

import { describe, test, expect } from 'vitest';
import { astroApiRequest, postgrestRequest } from '../setup.js';

describe('API Endpoints via nginx', () => {
  describe('PostgREST Data API', () => {
    test('should access items through /api/data/public_items', async () => {
      const response = await postgrestRequest('/public_items?limit=5');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      
      if (items.length > 0) {
        const item = items[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('price_diamonds');
      }
    });

    test('should filter items by category', async () => {
      const response = await postgrestRequest('/public_items?category=eq.tools');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      
      // All returned items should be tools
      items.forEach((item: any) => {
        expect(item.category).toBe('tools');
      });
    });

    test('should search items by name', async () => {
      const response = await postgrestRequest('/public_items?name=ilike.*sword*');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      
      // All returned items should contain "sword" in the name
      items.forEach((item: any) => {
        expect(item.name.toLowerCase()).toContain('sword');
      });
    });

    test('should handle pagination with limit and offset', async () => {
      const response = await postgrestRequest('/public_items?limit=2&offset=1');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeLessThanOrEqual(2);
    });
  });

  describe('API Route Availability', () => {
    test('should return 404 for non-existent endpoints', async () => {
      const response = await astroApiRequest('/nonexistent');
      expect(response.status).toBe(404);
    });

    test('should handle protected endpoints appropriately', async () => {
      // Try to access a protected PostgREST endpoint
      const response = await postgrestRequest('/users');
      // Should return 401 (unauthorized) since we don't have JWT
      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed PostgREST queries', async () => {
      const response = await postgrestRequest('/public_items?invalid=query');
      // PostgREST should handle invalid queries gracefully
      expect([200, 400].includes(response.status)).toBe(true);
    });

    test('should handle large limit values', async () => {
      const response = await postgrestRequest('/public_items?limit=1000');
      expect(response.ok).toBe(true);
      
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      // Should not crash, even with large limits
    });
  });

  describe('Content Type and Headers', () => {
    test('should return JSON content type', async () => {
      const response = await postgrestRequest('/public_items?limit=1');
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    test('should include CORS headers through nginx', async () => {
      const response = await postgrestRequest('/public_items?limit=1');
      // nginx should add security headers
      expect(response.headers.get('x-frame-options')).toBeDefined();
    });
  });
});