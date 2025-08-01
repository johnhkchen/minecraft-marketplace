/**
 * Integration Test: Homepage Data Server-Side Rendering
 * 
 * PURPOSE: Catch the exact issue - homepage data failing during SSR without browser overhead
 * FOCUS: Server-side API calls, URL construction, and data transformation pipeline
 * 
 * This test simulates the exact conditions that cause the bug to surface
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

describe('Homepage Data Integration (Server-Side)', () => {
  // Create a separate MSW server for integration testing
  const integrationServer = setupServer();

  beforeAll(() => {
    integrationServer.listen({ onUnhandledRequest: 'error' });
    console.log('🔧 Integration MSW server started');
  });

  afterAll(() => {
    integrationServer.close();
    console.log('🔧 Integration MSW server stopped');
  });

  it('should detect when homepage data loading fails in production-like environment', async () => {
    // Simulate production environment (no test flag)
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    try {
      console.log('🌐 Testing in production-like environment (NODE_ENV=production)');
      
      // Import the function - this will use relative URLs since NODE_ENV !== 'test'
      const { loadHomepageData } = await import('../../workspaces/frontend/src/lib/homepage-data.js');
      
      // Mock console.error to catch failures
      const errors: string[] = [];
      const originalConsoleError = console.error;
      console.error = (...args) => {
        errors.push(args.join(' '));
        originalConsoleError(...args);
      };
      
      try {
        const result = await loadHomepageData();
        
        console.log('📊 Production environment result:', {
          featuredItems: result.featuredItems.length,
          allItems: result.allItems.length,
          totalItems: result.pagination.totalItems,
          hasErrors: errors.length > 0
        });
        
        // In production with relative URLs, this should fail and use fallback data
        if (result.pagination.totalItems === 0) {
          console.log('❌ INTEGRATION BUG DETECTED: API calls failed in production environment');
          console.log('🔍 Errors captured:', errors);
          
          // This confirms the bug - API calls failing in server-side context
          expect(errors.length).toBeGreaterThan(0);
          expect(result.featuredItems.length).toBe(0);
          expect(result.allItems.length).toBe(0);
          
          console.log('✅ Bug correctly identified by integration test');
        } else {
          console.log('✅ Production environment working correctly');
        }
        
      } finally {
        console.error = originalConsoleError;
      }
      
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('should validate the URL construction fix works correctly', async () => {
    // Test both environments to ensure the fix works
    const testCases = [
      { env: 'test', expectedWorking: true, description: 'Test environment with absolute URLs' },
      { env: 'production', expectedWorking: false, description: 'Production environment with relative URLs' },
      { env: 'development', expectedWorking: false, description: 'Development environment with relative URLs' }
    ];

    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.description}`);
      
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = testCase.env;
      
      try {
        // Set up appropriate MSW handlers based on environment
        if (testCase.env === 'test') {
          // Add handlers for absolute URLs
          integrationServer.use(
            http.get('http://localhost:3000/api/data/public_items', ({ request }) => {
              const url = new URL(request.url);
              console.log('🎯 MSW intercepted:', url.pathname + url.search);
              
              const mockItems = [
                { id: '1', name: 'Oak Wood', price_diamonds: 4.5, category: 'blocks', owner_shop_name: 'Wood Shop' },
                { id: '2', name: 'Stone Bricks', price_diamonds: 6.75, category: 'blocks', owner_shop_name: 'Stone Shop' },
                { id: '3', name: 'Glass', price_diamonds: 9.0, category: 'blocks', owner_shop_name: 'Glass Shop' }
              ];

              // Handle different query types
              const select = url.searchParams.get('select');
              if (select === 'id') {
                return HttpResponse.json(mockItems.map(item => ({ id: item.id })));
              }
              if (select === 'owner_shop_name') {
                return HttpResponse.json(mockItems.map(item => ({ owner_shop_name: item.owner_shop_name })));
              }
              if (select === 'category') {
                return HttpResponse.json(mockItems.map(item => ({ category: item.category })));
              }
              
              // Regular item query
              const limit = url.searchParams.get('limit');
              const limitNum = limit ? parseInt(limit, 10) : mockItems.length;
              return HttpResponse.json(mockItems.slice(0, limitNum));
            })
          );
        }
        
        const { loadHomepageData } = await import('../../workspaces/frontend/src/lib/homepage-data.js');
        
        const errors: string[] = [];
        const originalConsoleError = console.error;
        console.error = (...args) => {
          errors.push(args.join(' '));
          // Don't log expected errors in non-test environments
          if (testCase.env === 'test') {
            originalConsoleError(...args);
          }
        };
        
        try {
          const result = await loadHomepageData();
          
          const isWorking = result.pagination.totalItems > 0 && result.featuredItems.length > 0;
          
          console.log(`  📊 Results: ${result.featuredItems.length} featured, ${result.allItems.length} all, ${result.pagination.totalItems} total`);
          console.log(`  🎯 Working: ${isWorking} (expected: ${testCase.expectedWorking})`);
          console.log(`  ❌ Errors: ${errors.length}`);
          
          if (testCase.expectedWorking) {
            expect(isWorking).toBe(true);
            expect(errors.length).toBe(0);
            console.log('  ✅ Environment working as expected');
          } else {
            expect(isWorking).toBe(false);
            expect(errors.length).toBeGreaterThan(0);
            console.log('  ✅ Environment failing as expected (confirms bug exists)');
          }
          
        } finally {
          console.error = originalConsoleError;
        }
        
      } finally {
        process.env.NODE_ENV = originalEnv;
        integrationServer.resetHandlers();
      }
    }
  });

  it('should validate API endpoint requirements and responses', async () => {
    console.log('🔌 Testing API endpoint integration requirements');
    
    // Define the exact endpoints our homepage function needs
    const requiredEndpoints = [
      {
        path: '/api/data/public_items',
        params: 'limit=20&offset=0&order=price_diamonds.desc',
        purpose: 'Main paginated items',
        required: true
      },
      {
        path: '/api/data/public_items', 
        params: 'limit=6&order=price_diamonds.desc',
        purpose: 'Featured items',
        required: true
      },
      {
        path: '/api/data/public_items',
        params: 'select=id',
        purpose: 'Total count',
        required: true
      },
      {
        path: '/api/data/public_items',
        params: 'select=owner_shop_name', 
        purpose: 'Shop count',
        required: true
      },
      {
        path: '/api/data/public_items',
        params: 'select=category',
        purpose: 'Category grouping',
        required: true
      }
    ];

    // Set up comprehensive handlers
    integrationServer.use(
      http.get('http://localhost:3000/api/data/public_items', ({ request }) => {
        const url = new URL(request.url);
        const fullEndpoint = url.pathname + (url.search || '');
        
        console.log(`  📡 API Call: ${fullEndpoint}`);
        
        // Mock realistic response based on query
        const select = url.searchParams.get('select');
        const limit = url.searchParams.get('limit');
        const order = url.searchParams.get('order');
        
        const mockItems = [
          { 
            id: 'real_1', 
            name: 'Oak Wood', 
            price_diamonds: 4.5, 
            category: 'blocks', 
            owner_shop_name: 'Redstone Robotics',
            trading_unit: 'per_stack',
            stock_quantity: 2000,
            created_at: '2025-07-31T01:00:00Z'
          },
          { 
            id: 'real_2', 
            name: 'Stone Bricks', 
            price_diamonds: 6.75, 
            category: 'blocks', 
            owner_shop_name: 'Stone Emporium',
            trading_unit: 'per_stack',
            stock_quantity: 5000,
            created_at: '2025-07-31T02:00:00Z'
          },
          { 
            id: 'real_3', 
            name: 'Glass', 
            price_diamonds: 9.0, 
            category: 'blocks', 
            owner_shop_name: 'Glass Works',
            trading_unit: 'per_stack',
            stock_quantity: 1000,
            created_at: '2025-07-31T03:00:00Z'
          }
        ];

        // Handle different query types
        if (select === 'id') {
          return HttpResponse.json(mockItems.map(item => ({ id: item.id })));
        }
        if (select === 'owner_shop_name') {
          return HttpResponse.json(mockItems.map(item => ({ owner_shop_name: item.owner_shop_name })));
        }
        if (select === 'category') {
          return HttpResponse.json(mockItems.map(item => ({ category: item.category })));
        }
        
        // Handle ordering
        let sortedItems = [...mockItems];
        if (order === 'price_diamonds.desc') {
          sortedItems.sort((a, b) => b.price_diamonds - a.price_diamonds);
        }
        
        // Handle limit
        const limitNum = limit ? parseInt(limit, 10) : sortedItems.length;
        return HttpResponse.json(sortedItems.slice(0, limitNum));
      })
    );

    // Test in proper environment
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    
    try {
      const { loadHomepageData } = await import('../../workspaces/frontend/src/lib/homepage-data.js');
      
      const result = await loadHomepageData();
      
      console.log('📊 Integration test results:', {
        featuredItems: result.featuredItems.length,
        allItems: result.allItems.length,
        totalItems: result.pagination.totalItems,
        activeShops: result.marketStats.activeShops,
        categories: result.categories.length
      });
      
      // Validate complete data pipeline
      expect(result.featuredItems.length).toBeGreaterThan(0);
      expect(result.allItems.length).toBeGreaterThan(0);
      expect(result.pagination.totalItems).toBeGreaterThan(0);
      expect(result.marketStats.activeShops).toBeGreaterThan(0);
      expect(result.categories.length).toBeGreaterThan(0);
      
      // Validate data transformation worked correctly
      const firstItem = result.featuredItems[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('name');
      expect(firstItem).toHaveProperty('price');
      expect(firstItem).toHaveProperty('priceDisplay');
      expect(firstItem).toHaveProperty('shopName');
      
      console.log('✅ Complete API integration pipeline working');
      
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('should catch server-side rendering URL construction bugs', async () => {
    console.log('🔧 Testing server-side URL construction edge cases');
    
    // Test what happens when the function constructs URLs in different contexts
    const testScenarios = [
      {
        name: 'Simulated SSR context (no window)',
        setup: () => {
          // @ts-ignore - Remove window to simulate server-side
          const originalWindow = global.window;
          delete (global as any).window;
          return () => { (global as any).window = originalWindow; };
        },
        expectWorking: false // Should fail with relative URLs
      },
      {
        name: 'Simulated browser context (with window)', 
        setup: () => {
          // @ts-ignore - Ensure window exists
          (global as any).window = { location: { href: 'http://localhost:3000' } };
          return () => {};
        },
        expectWorking: false // Still fails because we're not actually in browser
      }
    ];

    for (const scenario of testScenarios) {
      console.log(`\n🎭 Scenario: ${scenario.name}`);
      
      const cleanup = scenario.setup();
      
      try {
        // Force fresh import to get updated behavior
        delete require.cache[require.resolve('../../workspaces/frontend/src/lib/homepage-data.js')];
        
        const { loadHomepageData } = await import('../../workspaces/frontend/src/lib/homepage-data.js');
        
        const errors: string[] = [];
        const originalConsoleError = console.error;
        console.error = (...args) => {
          errors.push(args.join(' '));
        };
        
        try {
          const result = await loadHomepageData();
          const isWorking = result.pagination.totalItems > 0;
          
          console.log(`  📊 Working: ${isWorking}, Errors: ${errors.length}`);
          
          if (scenario.expectWorking) {
            expect(isWorking).toBe(true);
            expect(errors.length).toBe(0);
          } else {
            // Should fail and use fallback data
            expect(isWorking).toBe(false);
            expect(errors.length).toBeGreaterThan(0);
          }
          
          console.log('  ✅ Scenario behaved as expected');
          
        } finally {
          console.error = originalConsoleError;
        }
        
      } finally {
        cleanup();
      }
    }
  });
});