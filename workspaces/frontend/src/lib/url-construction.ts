/**
 * Local URL Construction for Homepage
 * Simplified version to unblock SSR testing
 */

export class URLConstructionService {
  buildApiUrl(endpoint: string): string {
    // Check if we're running in the browser (client-side)
    const isBrowser = typeof window !== 'undefined';
    
    if (isBrowser) {
      // Client-side: use the current origin with nginx proxy paths
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      return `/api/data${cleanEndpoint}`;
    }
    
    // Server-side: detect environment
    const isDocker = !!(
      process.env.POSTGRES_HOST === 'db' || 
      process.env.VALKEY_HOST === 'valkey' ||
      process.env.HOME === '/home/astro'
    );
    
    const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
    
    let baseUrl: string;
    if (isDocker) {
      // Docker container: use internal networking
      baseUrl = 'http://postgrest:3000';
    } else if (isTest) {
      // Test environment: use localhost for MSW mocking
      baseUrl = 'http://localhost:7410/api/data';
    } else {
      // Development: relative URLs
      baseUrl = '';
    }
    
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    if (isTest) {
      // In test, don't double-add /api/data
      return `${baseUrl}${cleanEndpoint}`;
    } else {
      return `${baseUrl}${cleanEndpoint}`;
    }
  }
}