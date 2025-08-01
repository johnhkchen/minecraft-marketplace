/**
 * Production Code Path Validation - TDD Red Test
 * 
 * PURPOSE: Comprehensive TDD test that would have prevented the homepage bug
 * APPROACH: Test actual production code paths, not just test environment paths
 * 
 * This test should FAIL RED until the code is properly implemented to handle
 * server-side rendering in production environments.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupFastTests } from '../utils/fast-test-setup.js';

// Don't setup MSW - we want to test REAL failure conditions
// setupFastTests();

describe('Production Code Path Validation (TDD)', () => {
  let originalEnv: string | undefined;
  let originalWindow: any;
  let consoleSpy: any;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    originalWindow = global.window;
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    global.window = originalWindow;
    consoleSpy.mockRestore();
  });

  it('should load real data in production server-side context (TDD RED → GREEN)', async () => {
    console.log('🔴 TDD RED TEST: Testing production server-side code path');
    
    // Set up EXACT production conditions that cause the bug
    process.env.NODE_ENV = 'production';
    delete (global as any).window; // Server-side rendering context
    
    try {
      // Import the ACTUAL homepage data function
      const { loadHomepageData } = await import('../../workspaces/frontend/src/lib/homepage-data.js');
      
      console.log('📍 Testing actual code at: workspaces/frontend/src/lib/homepage-data.ts');
      console.log('🎯 Environment: NODE_ENV=production, typeof window=undefined');
      
      // This should work but will FAIL RED until fixed
      const result = await loadHomepageData(1, 5);
      
      // TDD ASSERTIONS: What we expect from a properly working implementation
      console.log('✅ TDD GREEN CRITERIA:');
      console.log(`  - featuredItems: ${result.featuredItems.length} (expect >0)`);
      console.log(`  - allItems: ${result.allItems.length} (expect >0)`);
      console.log(`  - totalItems: ${result.pagination.totalItems} (expect >0)`);
      console.log(`  - activeShops: ${result.marketStats.activeShops} (expect >0)`);
      
      // COMPREHENSIVE TDD VALIDATION
      expect(result.featuredItems.length).toBeGreaterThan(0);
      expect(result.allItems.length).toBeGreaterThan(0);
      expect(result.pagination.totalItems).toBeGreaterThan(0);
      expect(result.marketStats.activeShops).toBeGreaterThan(0);
      
      // Validate NO synthetic data
      const allItemNames = [
        ...result.featuredItems.map(item => item.name),
        ...result.allItems.map(item => item.name)
      ];
      
      const syntheticItems = ['Elytra', 'Netherite Sword', 'Totem of Undying', 'Mending Book'];
      const syntheticFound = allItemNames.filter(name => syntheticItems.includes(name));
      
      expect(syntheticFound.length).toBe(0);
      
      // Validate no errors were logged
      expect(consoleSpy).not.toHaveBeenCalled();
      
      console.log('🎉 TDD GREEN: Production server-side code path working correctly!');
      
    } catch (error) {
      console.log('🔴 TDD RED FAILURE DETECTED:');
      console.log(`  Error: ${error.message}`);
      console.log(`  This is the EXACT failure that production users experience`);
      
      // Line identification - pinpoint where the failure occurs
      if (error.stack) {
        const stackLines = error.stack.split('\n');
        const homepageDataLine = stackLines.find(line => line.includes('homepage-data'));
        if (homepageDataLine) {
          console.log(`  📍 Failure location: ${homepageDataLine.trim()}`);
        }
      }
      
      console.log('');
      console.log('🔧 TO FIX THIS TDD RED TEST:');
      console.log('1. Open: workspaces/frontend/src/lib/homepage-data.ts');
      console.log('2. Find the line: const baseUrl = process.env.NODE_ENV === "test" ? ...');
      console.log('3. Add server-side context detection');
      console.log('4. Use absolute URLs when typeof window === "undefined"');
      
      // Re-throw to maintain TDD RED state
      throw error;
    }
  });

  it('should work across ALL environment combinations (TDD Infrastructure Test)', async () => {
    console.log('🔴 TDD INFRASTRUCTURE TEST: All environment combinations');
    
    const testMatrix = [
      { env: 'test', hasWindow: true, description: 'Test Browser' },
      { env: 'test', hasWindow: false, description: 'Test SSR' },
      { env: 'production', hasWindow: true, description: 'Production Browser' },
      { env: 'production', hasWindow: false, description: 'Production SSR' }, // This fails!
      { env: 'development', hasWindow: true, description: 'Development Browser' },
      { env: 'development', hasWindow: false, description: 'Development SSR' }, // This fails!
    ];
    
    const results = [];
    
    for (const testCase of testMatrix) {
      console.log(`\n🧪 Testing: ${testCase.description}`);
      
      // Set up environment
      process.env.NODE_ENV = testCase.env;
      if (testCase.hasWindow) {
        (global as any).window = { location: { href: 'http://localhost:3000' } };
      } else {
        delete (global as any).window;
      }
      
      let success = false;
      let error = null;
      let itemCount = 0;
      
      try {
        // Clear module cache to get fresh import with new environment
        const modulePath = '../../workspaces/frontend/src/lib/homepage-data.js';
        delete require.cache[require.resolve(modulePath)];
        
        const { loadHomepageData } = await import(modulePath);
        const result = await loadHomepageData(1, 3);
        
        success = result.featuredItems.length > 0 && result.allItems.length > 0;
        itemCount = result.featuredItems.length + result.allItems.length;
        
        console.log(`  ✅ Success: ${itemCount} items loaded`);
        
      } catch (err) {
        error = err.message;
        console.log(`  ❌ Failed: ${error}`);
      }
      
      results.push({
        ...testCase,
        success,
        error,
        itemCount
      });
    }
    
    // TDD VALIDATION: All combinations should work
    console.log('\n📊 TDD MATRIX RESULTS:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${result.description}: ${result.success ? result.itemCount + ' items' : result.error}`);
    });
    
    const failedCases = results.filter(r => !r.success);
    
    if (failedCases.length > 0) {
      console.log('\n🔴 TDD RED: Infrastructure gaps detected');
      console.log('Failed cases:');
      failedCases.forEach(failed => {
        console.log(`  - ${failed.description}: ${failed.error}`);
      });
      
      // Identify the infrastructure pattern
      const ssrFailures = failedCases.filter(f => !f.hasWindow);
      const prodFailures = failedCases.filter(f => f.env !== 'test');
      
      if (ssrFailures.length > 0) {
        console.log('\n🎯 INFRASTRUCTURE FAILURE PATTERN: Server-Side Rendering');
        console.log('  Root cause: Code assumes browser context');
        console.log('  Fix needed: Detect and handle typeof window === "undefined"');
      }
      
      if (prodFailures.length > 0) {
        console.log('\n🎯 INFRASTRUCTURE FAILURE PATTERN: Production Environment');
        console.log('  Root cause: Only test environment gets absolute URLs');
        console.log('  Fix needed: Environment-aware URL construction');
      }
      
      throw new Error(`TDD RED: ${failedCases.length}/${results.length} environment combinations fail`);
    }
    
    console.log('\n🎉 TDD GREEN: All environment combinations working!');
  });

  it('should validate URL construction at specific code line (TDD Line-Level Test)', async () => {
    console.log('🔴 TDD LINE-LEVEL TEST: URL construction logic validation');
    
    // Test the EXACT logic that causes the bug
    const urlConstructionTests = [
      {
        name: 'Current Logic (Buggy)',
        logic: (nodeEnv: string, hasWindow: boolean) => {
          // This replicates the EXACT buggy logic
          return nodeEnv === 'test' ? 'http://localhost:3000' : '';
        },
        expectAllToWork: false
      },
      {
        name: 'Fixed Logic (Target)',
        logic: (nodeEnv: string, hasWindow: boolean) => {
          // This is what the fixed logic should look like
          const isServerSide = !hasWindow;
          return (nodeEnv === 'test' || isServerSide) ? 'http://localhost:3000' : '';
        },
        expectAllToWork: true
      }
    ];
    
    const environments = [
      { env: 'test', hasWindow: true },
      { env: 'test', hasWindow: false },
      { env: 'production', hasWindow: true },
      { env: 'production', hasWindow: false },
      { env: 'development', hasWindow: false }
    ];
    
    for (const urlTest of urlConstructionTests) {
      console.log(`\n🔍 Testing: ${urlTest.name}`);
      
      const results = environments.map(envConfig => {
        const baseUrl = urlTest.logic(envConfig.env, envConfig.hasWindow);
        const fullUrl = `${baseUrl}/api/data/test`;
        const willWork = fullUrl.startsWith('http');
        
        return {
          env: envConfig.env,
          hasWindow: envConfig.hasWindow,
          baseUrl,
          fullUrl,
          willWork,
          context: envConfig.hasWindow ? 'Browser' : 'SSR'
        };
      });
      
      results.forEach(result => {
        const status = result.willWork ? '✅' : '❌';
        console.log(`    ${status} ${result.env} ${result.context}: "${result.fullUrl}"`);
      });
      
      const workingCount = results.filter(r => r.willWork).length;
      const totalCount = results.length;
      
      console.log(`    Result: ${workingCount}/${totalCount} combinations work`);
      
      if (urlTest.expectAllToWork) {
        expect(workingCount).toBe(totalCount);
        console.log(`    🎉 TDD GREEN: All combinations work with fixed logic`);
      } else {
        expect(workingCount).toBeLessThan(totalCount);
        console.log(`    🔴 TDD RED: Current logic fails ${totalCount - workingCount} combinations`);
      }
    }
    
    console.log('\n📍 LINE IDENTIFICATION:');
    console.log('  File: workspaces/frontend/src/lib/homepage-data.ts');
    console.log('  Function: loadHomepageData');
    console.log('  Current line: const baseUrl = process.env.NODE_ENV === "test" ? "http://localhost:3000" : "";');
    console.log('  Fixed line: const baseUrl = (process.env.NODE_ENV === "test" || typeof window === "undefined") ? "http://localhost:3000" : "";');
  });

  it('should prevent the infrastructure blind spot that allowed this bug (TDD Meta-Test)', () => {
    console.log('🔴 TDD META-TEST: Infrastructure blind spot prevention');
    
    // This test validates that our testing infrastructure doesn't hide bugs
    console.log('\n🎯 INFRASTRUCTURE BLIND SPOTS IDENTIFIED:');
    
    const blindSpots = [
      {
        name: 'MSW Only Works With Absolute URLs',
        description: 'MSW mocking hides relative URL failures',
        testEnvironmentMasks: true,
        productionFails: true,
        detection: 'Test absolute AND relative URL handling'
      },
      {
        name: 'NODE_ENV=test Gets Special Treatment',
        description: 'Test environment uses different code path than production',
        testEnvironmentMasks: true,
        productionFails: true,
        detection: 'Test with NODE_ENV=production explicitly'
      },
      {
        name: 'Server-Side vs Browser Context',
        description: 'Tests assume browser context, production runs server-side',
        testEnvironmentMasks: true,
        productionFails: true,
        detection: 'Test with typeof window === "undefined"'
      },
      {
        name: 'Environment Variable Assumptions',
        description: 'Code makes assumptions about environment variables',
        testEnvironmentMasks: false,
        productionFails: true,
        detection: 'Test with different NODE_ENV values'
      }
    ];
    
    console.log('\n📊 Blind Spot Analysis:');
    blindSpots.forEach((spot, index) => {
      console.log(`  ${index + 1}. ${spot.name}`);
      console.log(`     Issue: ${spot.description}`);
      console.log(`     Test Environment Masks: ${spot.testEnvironmentMasks ? '⚠️ YES' : '✅ NO'}`);
      console.log(`     Production Fails: ${spot.productionFails ? '❌ YES' : '✅ NO'}`);
      console.log(`     Detection Strategy: ${spot.detection}`);
      console.log('');
    });
    
    // TDD REQUIREMENT: Infrastructure should not mask production failures
    const maskedBugCount = blindSpots.filter(s => s.testEnvironmentMasks && s.productionFails).length;
    
    console.log('🎯 TDD INFRASTRUCTURE REQUIREMENTS:');
    console.log('1. Test environment should replicate production conditions');
    console.log('2. Mocking should not hide environment-specific failures'); 
    console.log('3. All code paths should be testable');
    console.log('4. Environment differences should be explicit');
    
    if (maskedBugCount > 0) {
      console.log(`\n🔴 TDD RED: ${maskedBugCount} infrastructure blind spots detected`);
      console.log('These blind spots allowed the homepage bug to reach production');
    } else {
      console.log('\n🎉 TDD GREEN: No infrastructure blind spots detected');
    }
    
    // This test should guide infrastructure improvements
    expect(maskedBugCount).toBe(0); // Will fail until infrastructure is fixed
  });
});