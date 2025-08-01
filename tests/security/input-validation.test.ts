/**
 * Security Input Validation Tests
 * Tests security constraints through nginx proxy and PostgREST
 */

import { describe, test, expect } from 'vitest';
import { postgrestRequest, astroApiRequest } from '../setup.js';

describe('Security Input Validation via nginx', () => {
  describe('PostgREST Query Injection Prevention', () => {
    test('should prevent SQL injection attempts in query parameters', async () => {
      // Attempt various SQL injection patterns
      const maliciousQueries = [
        "'; DROP TABLE items; --",
        "' OR '1'='1",
        "'; INSERT INTO items VALUES (...); --",
        "' UNION SELECT * FROM users; --"
      ];

      for (const maliciousQuery of maliciousQueries) {
        const response = await postgrestRequest(`/public_items?name=eq.${encodeURIComponent(maliciousQuery)}`);
        
        // Should either return empty results or handle gracefully
        // Should NOT return a server error (which might indicate successful injection)
        expect(response.status).not.toBe(500);
        
        if (response.ok) {
          const items = await response.json();
          expect(Array.isArray(items)).toBe(true);
          // Should return empty or filtered results, not expose sensitive data
        }
      }
    });

    test('should handle malformed query parameters gracefully', async () => {
      const malformedQueries = [
        '/public_items?category=eq.',  // Empty value
        '/public_items?limit=abc',     // Non-numeric limit
        '/public_items?offset=-1',     // Negative offset
        '/public_items?order=invalid_column', // Invalid column
        '/public_items?select=password,secret_data' // Attempt to select non-existent/protected columns
      ];

      for (const query of malformedQueries) {
        const response = await postgrestRequest(query);
        
        // Should handle gracefully - either 400 (bad request) or empty results
        expect([200, 400].includes(response.status)).toBe(true);
        expect(response.status).not.toBe(500); // Should not crash
      }
    });
  });

  describe('Authentication and Authorization', () => {
    test('should protect sensitive endpoints with 401 Unauthorized', async () => {
      // Try to access protected endpoints without authentication
      const protectedEndpoints = [
        '/users',
        '/items', 
        '/prices',
        '/community_reports',
        '/evidence'
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await postgrestRequest(endpoint);
        expect(response.status).toBe(401);
        
        // Should include proper authentication headers
        expect(response.headers.get('www-authenticate')).toContain('Bearer');
      }
    });

    test('should allow access to public endpoints without authentication', async () => {
      const publicEndpoints = [
        '/public_items',
        '/public_items?limit=5',
        '/public_items?category=eq.tools'
      ];

      for (const endpoint of publicEndpoints) {
        const response = await postgrestRequest(endpoint);
        expect(response.ok).toBe(true);
      }
    });

    test('should reject invalid JWT tokens', async () => {
      const invalidTokens = [
        'invalid.jwt.token',
        'Bearer invalid',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
        'Bearer ' + 'x'.repeat(500) // Very long token
      ];

      for (const token of invalidTokens) {
        const response = await postgrestRequest('/users', {
          headers: {
            'Authorization': token
          }
        });
        
        expect(response.status).toBe(401);
      }
    });
  });

  describe('Rate Limiting and DoS Protection', () => {
    test('should handle rapid successive requests without crashing', async () => {
      // Make multiple rapid requests
      const requests = Array.from({ length: 10 }, () => 
        postgrestRequest('/public_items?limit=1')
      );

      const responses = await Promise.all(requests);
      
      // All requests should complete (may be rate limited but not crash)
      responses.forEach(response => {
        expect([200, 429].includes(response.status)).toBe(true); // 200 OK or 429 Too Many Requests
      });
    });

    test('should limit query result size', async () => {
      // Try to request a very large number of results
      const response = await postgrestRequest('/public_items?limit=10000');
      
      if (response.ok) {
        const items = await response.json();
        expect(Array.isArray(items)).toBe(true);
        
        // Should have some reasonable limit (PostgREST default is often 1000)
        expect(items.length).toBeLessThan(2000);
      }
    });
  });

  describe('Data Sanitization', () => {
    test('should not expose sensitive data in error messages', async () => {
      // Try to trigger errors and check they don't leak sensitive info
      const response = await postgrestRequest('/nonexistent_table');
      
      if (!response.ok) {
        const errorText = await response.text();
        
        // Should not expose database schema details, connection strings, etc.
        expect(errorText.toLowerCase()).not.toContain('password');
        expect(errorText.toLowerCase()).not.toContain('secret');
        expect(errorText.toLowerCase()).not.toContain('connection');
        expect(errorText.toLowerCase()).not.toContain('postgresql://');
      }
    });

    test('should sanitize search input to prevent XSS', async () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        '"><script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        '&lt;script&gt;alert(1)&lt;/script&gt;'
      ];

      for (const xssAttempt of xssAttempts) {
        const response = await postgrestRequest(`/public_items?name=ilike.*${encodeURIComponent(xssAttempt)}*`);
        
        if (response.ok) {
          const items = await response.json();
          expect(Array.isArray(items)).toBe(true);
          
          // If any results returned, they should not contain unescaped scripts
          items.forEach((item: any) => {
            expect(item.name).not.toContain('<script>');
            expect(item.description).not.toContain('<script>');
          });
        }
      }
    });
  });

  describe('HTTP Security Headers', () => {
    test('should include security headers from nginx', async () => {
      const response = await postgrestRequest('/public_items?limit=1');
      
      // Check for common security headers that nginx should add
      expect(response.headers.get('x-frame-options')).toBeDefined();
      expect(response.headers.get('x-content-type-options')).toBeDefined();
      expect(response.headers.get('x-xss-protection')).toBeDefined();
      expect(response.headers.get('referrer-policy')).toBeDefined();
    });

    test('should set appropriate content-type headers', async () => {
      const response = await postgrestRequest('/public_items?limit=1');
      
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('API Endpoint Security', () => {
    test('should validate astro API endpoints exist and are secure', async () => {
      // Test that API endpoints return appropriate responses
      const response = await astroApiRequest('/nonexistent');
      expect(response.status).toBe(404);
    });

    test('should prevent directory traversal attempts', async () => {
      const traversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '....//....//....//etc/passwd'
      ];

      for (const attempt of traversalAttempts) {
        const response = await astroApiRequest(`/${attempt}`);
        
        // Should return 404 or 403, not 200 with file contents
        expect([403, 404].includes(response.status)).toBe(true);
      }
    });
  });
});