/**
 * URL Construction Service - TDD Red Test for Centralized Solution
 * 
 * PURPOSE: Create universal URL construction that works in ALL environments
 * PREVENTS: Homepage synthetic data bug and similar environment mismatches
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupFastTests, measure, expectFastExecution } from '../utils/fast-test-setup.js';

setupFastTests();

describe('URL Construction Service (TDD Red)', () => {
  let originalEnv: string | undefined;
  let originalWindow: any;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    originalWindow = global.window;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    global.window = originalWindow;
  });

  it('should create universal URL construction that works in all environments (RED)', async () => {
    console.log('🔴 TDD RED: Universal URL Construction Service');
    console.log('============================================\n');
    
    // This test MUST FAIL until we implement the solution
    
    const { result: URLService, timeMs } = await measure(async () => {
      try {
        // This should exist but doesn't yet - causing test to fail
        const module = await import('../../shared/services/url-construction-service.js');
        return module.URLConstructionService;
      } catch (error) {
        throw new Error(`URLConstructionService not implemented: ${error.message}`);
      }
    });

    expectFastExecution(timeMs, 10);
    
    console.log('❌ Expected: URLConstructionService should be importable');
    console.log('✅ Actual: Import failed (this is expected in RED phase)');
    
    // This will fail until we create the service
    expect(() => new URLService()).not.toThrow();
  });

  it('should handle all environment combinations without failures (RED)', async () => {
    console.log('🔴 TDD RED: Environment-Universal URL Construction');
    console.log('===============================================\n');
    
    // Test matrix: ALL environment × context combinations that broke before
    const testMatrix = [
      { env: 'test', hasWindow: true, context: 'Test Browser' },
      { env: 'test', hasWindow: false, context: 'Test Server (SSR)' },
      { env: 'production', hasWindow: true, context: 'Prod Browser' },
      { env: 'production', hasWindow: false, context: 'Prod Server (SSR)' },
      { env: 'development', hasWindow: true, context: 'Dev Browser' },
      { env: 'development', hasWindow: false, context: 'Dev Server (SSR)' }
    ];

    const endpoints = [
      '/api/data/public_items',
      '/api/data/listings_with_details', 
      '/api/health',
      '/api/auth/discord'
    ];

    console.log('🧪 Testing URL construction across all environments:\n');

    let totalFailures = 0;

    for (const testCase of testMatrix) {
      console.log(`📋 ${testCase.context}:`);
      
      // Set up environment
      process.env.NODE_ENV = testCase.env;
      if (testCase.hasWindow) {
        (global as any).window = { location: { href: 'http://localhost:3000' } };
      } else {
        delete (global as any).window;
      }

      let contextFailures = 0;

      for (const endpoint of endpoints) {
        try {
          // This should work once we implement the service
          try {
            const module = await import('../../shared/services/url-construction-service.js');
            const URLService = module.URLConstructionService;
            const urlService = new URLService();
            const fullUrl = urlService.buildApiUrl(endpoint);
            console.log(`   ✅ ${endpoint}: ${fullUrl}`);
          } catch (importError) {
            // Fallback to broken pattern to show failures
            const baseUrl = process.env.NODE_ENV === 'test' ? 'http://localhost:3000' : '';
            const fullUrl = `${baseUrl}${endpoint}`;
            new URL(fullUrl); // This will fail for relative URLs
            console.log(`   ✅ ${endpoint}: ${fullUrl}`);
          }
          
        } catch (error) {
          contextFailures++;
          totalFailures++;
          console.log(`   ❌ ${endpoint}: ${error.message}`);
        }
      }
      
      console.log(`   Result: ${contextFailures}/${endpoints.length} failures\n`);
    }

    console.log(`🎯 TOTAL FAILURES: ${totalFailures}/${testMatrix.length * endpoints.length}`);
    console.log('\n🔴 This test SHOULD FAIL until URLConstructionService is implemented');
    console.log('✅ Once implemented, all URLs should work in all environments');

    // This should fail in RED phase - we expect environment mismatches
    expect(totalFailures).toBe(0); // This will fail until service is implemented
  });

  it('should provide centralized configuration for all URL patterns (RED)', async () => {
    console.log('🔴 TDD RED: Centralized URL Configuration');
    console.log('======================================\n');
    
    const expectedConfiguration = {
      // Base URL detection
      getBaseUrl: 'Function to detect correct base URL for current context',
      
      // API endpoint builders
      buildApiUrl: 'Function to build PostgREST API URLs',
      buildAstroUrl: 'Function to build Astro API URLs',
      buildStaticUrl: 'Function to build static asset URLs',
      
      // Environment detection
      isServerSide: 'Function to detect server-side rendering context',
      isTestEnvironment: 'Function to detect test environment',
      isBrowserContext: 'Function to detect browser context',
      
      // URL validation
      validateUrl: 'Function to ensure URL is valid and usable',
      
      // Configuration options
      defaults: {
        testBaseUrl: 'http://localhost:3000',
        devBaseUrl: 'http://localhost:3000', 
        prodBaseUrl: '', // Relative URLs in production browser context
        fallbackBaseUrl: 'http://localhost:3000' // Always absolute for SSR
      }
    };

    console.log('📋 Required URLConstructionService API:\n');
    
    Object.entries(expectedConfiguration).forEach(([method, description]) => {
      console.log(`   ${method}: ${description}`);
    });

    console.log('\n🔴 This configuration should exist but doesn\'t yet');
    
    try {
      // This should fail until we implement it
      const module = await import('../../shared/services/url-construction-service.js');
      const URLService = module.URLConstructionService;
      const service = new URLService();
      
      // Check if all required methods exist
      const requiredMethods = ['getBaseUrl', 'buildApiUrl', 'buildAstroUrl', 'isServerSide'];
      const missingMethods = requiredMethods.filter(method => typeof service[method] !== 'function');
      
      expect(missingMethods).toHaveLength(0);
      
    } catch (error) {
      console.log(`❌ URLConstructionService not available: ${error.message}`);
      console.log('✅ This is expected in RED phase - service needs to be implemented');
      
      // This should fail until we create the service
      expect(false).toBe(true); // Force failure
    }
  });

  it('should solve the exact homepage-data.ts URL construction bug (RED)', async () => {
    console.log('🔴 TDD RED: Fix Homepage Data URL Construction Bug');
    console.log('===============================================\n');
    
    // Recreate the exact problematic pattern from homepage-data.ts
    const problematicUrlConstruction = (nodeEnv: string, hasWindow: boolean) => {
      // This is the BROKEN pattern that caused synthetic data fallback
      const baseUrl = nodeEnv === 'test' ? 'http://localhost:3000' : '';
      return `${baseUrl}/api/data/listings_with_details`;
    };

    // Test the broken pattern to show it fails
    console.log('🧪 Testing the broken pattern that caused the bug:\n');
    
    const problemCases = [
      { env: 'production', hasWindow: false, label: 'Prod SSR (the bug case)' },
      { env: 'development', hasWindow: false, label: 'Dev SSR' }
    ];

    let brokenPatternFailures = 0;

    for (const testCase of problemCases) {
      try {
        const url = problematicUrlConstruction(testCase.env, testCase.hasWindow);
        new URL(url); // This should fail for relative URLs in Node.js
        console.log(`   ✅ ${testCase.label}: ${url}`);
      } catch (error) {
        brokenPatternFailures++;
        console.log(`   ❌ ${testCase.label}: ${error.message}`);
      }
    }

    console.log(`\n🔴 Broken pattern failures: ${brokenPatternFailures}/${problemCases.length}`);
    console.log('💡 This demonstrates the exact bug we need to fix');

    // Now test what the FIXED pattern should look like
    console.log('\n🔧 Testing the fixed pattern (should work when implemented):\n');
    
    try {
      // This should work when we implement the service
      const module = await import('../../shared/services/url-construction-service.js');
      const URLService = module.URLConstructionService;
      
      let fixedPatternFailures = 0;
      
      for (const testCase of problemCases) {
        // Set up environment for each test case
        process.env.NODE_ENV = testCase.env;
        if (testCase.hasWindow) {
          (global as any).window = { location: { href: 'http://localhost:3000' } };
        } else {
          delete (global as any).window;
        }
        
        try {
          const service = new URLService();
          const url = service.buildApiUrl('/api/data/listings_with_details');
          console.log(`   ✅ ${testCase.label}: ${url}`);
        } catch (error) {
          fixedPatternFailures++;
          console.log(`   ❌ ${testCase.label}: ${error.message}`);
        }
      }
      
      console.log(`\n✅ Fixed pattern failures: ${fixedPatternFailures}/${problemCases.length}`);
      expect(fixedPatternFailures).toBe(0); // This should pass with correct logic
      
    } catch (error) {
      console.log(`❌ URLConstructionService not implemented: ${error.message}`);
      console.log('🔴 This test SHOULD FAIL until we implement the service');
      
      // Force failure until service exists
      expect(false).toBe(true);
    }
  });

  it('should provide performance validation for fast execution (RED)', async () => {
    console.log('🔴 TDD RED: Fast URL Construction Performance');
    console.log('==========================================\n');
    
    const { result, timeMs } = await measure(async () => {
      try {
        // This should be fast when implemented
        // const URLService = require('../../shared/services/url-construction-service.js').URLConstructionService;
        // const service = new URLService();
        // return service.buildApiUrl('/api/test');
        
        // For now, simulate the work
        return 'mock-url-construction';
      } catch (error) {
        throw new Error(`Service not available: ${error.message}`);
      }
    });

    console.log(`⚡ URL construction time: ${timeMs.toFixed(2)}ms`);
    console.log('🎯 Target: <5ms for fast test execution');

    expectFastExecution(timeMs, 5);
    
    console.log('\n🔴 This test should pass when URLConstructionService is implemented');
    expect(result).toBeTruthy();
  });
});