/**
 * Homepage Fix Validation - Verify URLConstructionService Resolves Environment Issues
 * 
 * PURPOSE: Validate that the homepage synthetic data bug is fixed
 * TESTS: Environment-safe URL construction in actual homepage code
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupFastTests, measure, expectFastExecution } from '../utils/fast-test-setup.js';
import { loadHomepageData } from '../../workspaces/frontend/src/lib/homepage-data.js';

setupFastTests();

describe('Homepage Fix Validation', () => {
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

  it('should work in production server-side context (the original bug case)', async () => {
    console.log('🔧 PRODUCTION SSR FIX VALIDATION');
    console.log('==============================\n');
    
    // Set up the exact environment that caused the original bug
    process.env.NODE_ENV = 'production';
    delete (global as any).window; // Server-side context
    
    console.log('🎯 Testing the exact bug scenario:');
    console.log('   Environment: production');
    console.log('   Context: Server-side (no window object)');
    console.log('   Previous behavior: Relative URLs fail with "Invalid URL" error');
    console.log('   Expected behavior: URLConstructionService provides absolute URLs');
    
    const { result: homepageData, timeMs } = await measure(async () => {
      return await loadHomepageData(1, 6);
    });

    expectFastExecution(timeMs, 100); // Should be fast with MSW mocking
    
    console.log(`\n✅ Homepage data loaded successfully in ${timeMs.toFixed(2)}ms`);
    console.log(`📊 Results: ${homepageData.allItems.length} items, ${homepageData.featuredItems.length} featured`);
    
    // Validate we got real data, not fallback data
    expect(homepageData.allItems.length).toBeGreaterThan(0);
    expect(homepageData.featuredItems.length).toBeGreaterThan(0);
    expect(homepageData.marketStats.totalItems).toBeGreaterThan(0);
    
    console.log('\n🎉 BUG FIXED: Production SSR context now works correctly!');
  });

  it('should work in development server-side context', async () => {
    console.log('🔧 DEVELOPMENT SSR FIX VALIDATION');
    console.log('===============================\n');
    
    // Set up development server-side context
    process.env.NODE_ENV = 'development';
    delete (global as any).window; // Server-side context
    
    const { result: homepageData, timeMs } = await measure(async () => {
      return await loadHomepageData(1, 6);
    });

    expectFastExecution(timeMs, 100);
    
    console.log(`✅ Development SSR loaded in ${timeMs.toFixed(2)}ms`);
    
    expect(homepageData.allItems.length).toBeGreaterThan(0);
    expect(homepageData.featuredItems.length).toBeGreaterThan(0);
  });

  it('should work in all browser contexts (regression test)', async () => {
    console.log('🔧 BROWSER CONTEXT REGRESSION TEST');
    console.log('=================================\n');
    
    const browserContexts = [
      { env: 'test', label: 'Test Browser' },
      { env: 'development', label: 'Dev Browser' },
      { env: 'production', label: 'Prod Browser' }
    ];

    for (const context of browserContexts) {
      process.env.NODE_ENV = context.env;
      (global as any).window = { location: { href: 'http://localhost:3000' } };
      
      const { result: homepageData, timeMs } = await measure(async () => {
        return await loadHomepageData(1, 6);
      });

      console.log(`✅ ${context.label}: ${homepageData.allItems.length} items (${timeMs.toFixed(2)}ms)`);
      
      expect(homepageData.allItems.length).toBeGreaterThan(0);
      expectFastExecution(timeMs, 100);
    }
    
    console.log('\n🎉 All browser contexts work correctly!');
  });

  it('should demonstrate the fix prevents synthetic data fallback', async () => {
    console.log('🔧 SYNTHETIC DATA PREVENTION VALIDATION');
    console.log('=====================================\n');
    
    // Test the original problematic environment
    process.env.NODE_ENV = 'production';
    delete (global as any).window; // Server-side context
    
    const homepageData = await loadHomepageData(1, 6);
    
    console.log('🔍 Checking for synthetic data signatures:');
    
    // Check that we're getting real API data, not synthetic fallback
    const hasRealData = homepageData.allItems.length > 0 && 
                       homepageData.marketStats.totalItems > 0 &&
                       homepageData.categories.length >= 0; // Categories might be empty but not undefined
    
    console.log(`   Real API data: ${hasRealData ? '✅' : '❌'}`);
    console.log(`   Items count: ${homepageData.allItems.length}`);
    console.log(`   Market stats: ${JSON.stringify(homepageData.marketStats)}`);
    console.log(`   Categories: ${homepageData.categories.length}`);
    
    // Validate we're not getting fallback data
    const isNotFallbackData = !(
      homepageData.allItems.length === 0 &&
      homepageData.marketStats.totalItems === 0 &&
      homepageData.categories.length === 0
    );
    
    console.log(`   Not fallback data: ${isNotFallbackData ? '✅' : '❌'}`);
    
    expect(hasRealData).toBe(true);
    expect(isNotFallbackData).toBe(true);
    
    console.log('\n🎉 SYNTHETIC DATA FALLBACK PREVENTED!');
    console.log('The homepage now loads real marketplace data in all environments.');
  });

  it('should provide fast performance with centralized URL construction', async () => {
    console.log('🔧 URL CONSTRUCTION PERFORMANCE VALIDATION');
    console.log('=========================================\n');
    
    const performanceTests = [
      { env: 'test', hasWindow: false, label: 'Test SSR' },
      { env: 'production', hasWindow: false, label: 'Prod SSR (bug case)' },
      { env: 'production', hasWindow: true, label: 'Prod Browser' }
    ];

    let totalTime = 0;
    
    for (const test of performanceTests) {
      process.env.NODE_ENV = test.env;
      if (test.hasWindow) {
        (global as any).window = { location: { href: 'http://localhost:3000' } };
      } else {
        delete (global as any).window;
      }
      
      const { result: homepageData, timeMs } = await measure(async () => {
        return await loadHomepageData(1, 6);
      });

      totalTime += timeMs;
      console.log(`⚡ ${test.label}: ${timeMs.toFixed(2)}ms`);
      
      expectFastExecution(timeMs, 100);
      expect(homepageData.allItems.length).toBeGreaterThan(0);
    }
    
    console.log(`\n📊 Total test time: ${totalTime.toFixed(2)}ms`);
    console.log('🎯 All URL constructions are fast and work correctly');
    
    expectFastExecution(totalTime, 300); // All tests combined should be fast
  });
});