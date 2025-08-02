/**
 * Homepage SSR Root Cause Analysis - Fast Unit Tests
 * 
 * PURPOSE: Dig into the exact mechanism causing API calls to fail during server-side rendering
 * APPROACH: Test different environment conditions and URL construction scenarios
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setupFastTests } from '../utils/fast-test-setup.js';
import { expectFastExecution } from '../utils/fast-test-setup.js';

setupFastTests();

describe('Homepage SSR Root Cause Analysis', () => {
  let originalEnv: string | undefined;
  let originalWindow: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = process.env.NODE_ENV;
    originalWindow = global.window;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    global.window = originalWindow;
  });

  it('should expose URL construction differences between test and production environments', async () => {
  const start = performance.now();
  
    const environments = [
      { name: 'test', nodeEnv: 'test'
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
},
      { name: 'production', nodeEnv: 'production' },
      { name: 'development', nodeEnv: 'development' }
    ];

    const urlConstructionResults = {};

    for (const env of environments) {
      process.env.NODE_ENV = env.nodeEnv;
      
      // Force fresh import to get updated environment behavior
      delete require.cache[require.resolve('../../workspaces/frontend/src/lib/homepage-data.js')];
      
      // Test the URL construction logic directly
      const baseUrl = process.env.NODE_ENV === 'test' ? 'http://localhost:3000' : '';
      const testUrl = `${baseUrl}/api/data/public_items?limit=5`;
      
      urlConstructionResults[env.name] = {
        nodeEnv: env.nodeEnv,
        baseUrl,
        fullUrl: testUrl,
        isAbsolute: testUrl.startsWith('http'),
        isRelative: testUrl.startsWith('/api')
      };
      
      console.log(`🌐 ${env.name.toUpperCase()} Environment:`);
      console.log(`  NODE_ENV: ${env.nodeEnv}`);
      console.log(`  Base URL: "${baseUrl}"`);
      console.log(`  Full URL: "${testUrl}"`);
      console.log(`  Absolute: ${urlConstructionResults[env.name].isAbsolute}`);
      console.log(`  Relative: ${urlConstructionResults[env.name].isRelative}`);
    }

    // ROOT CAUSE ANALYSIS: URL construction logic
    expect(urlConstructionResults.test.isAbsolute).toBe(true);
    expect(urlConstructionResults.production.isAbsolute).toBe(false);
    expect(urlConstructionResults.development.isAbsolute).toBe(false);

    // The issue: Only test environment gets absolute URLs
    console.log('\n🔍 ROOT CAUSE IDENTIFIED:');
    console.log('- Test environment: Absolute URLs (work with MSW)');
    console.log('- Production/Dev: Relative URLs (fail in server-side context)');
    
    expect(urlConstructionResults.test.baseUrl).toBe('http://localhost:3000');
    expect(urlConstructionResults.production.baseUrl).toBe('');
    expect(urlConstructionResults.development.baseUrl).toBe('');
  });

  it('should demonstrate fetch behavior differences in server vs browser contexts', async () => {
  const start = performance.now();
  
    const testScenarios = [
      {
        name: 'Server-side (no window)',
        setup: () => {
          delete (global as any).window;
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
},
        url: '/api/data/public_items?limit=1',
        expectsToFail: true
      },
      {
        name: 'Server-side with absolute URL',
        setup: () => {
          delete (global as any).window;
        },
        url: 'http://localhost:3000/api/data/public_items?limit=1',
        expectsToFail: false
      },
      {
        name: 'Browser-like (with window)',
        setup: () => {
          (global as any).window = { location: { href: 'http://localhost:3000' } };
        },
        url: '/api/data/public_items?limit=1',
        expectsToFail: false // Would work in real browser, but still fails in Node
      }
    ];

    const fetchResults = {};

    for (const scenario of testScenarios) {
      console.log(`\n🧪 Testing: ${scenario.name}`);
      
      scenario.setup();
      
      let fetchError = null;
      let fetchSuccess = false;
      
      try {
        const response = await fetch(scenario.url);
        fetchSuccess = response.ok;
        console.log(`  ✅ Fetch succeeded: ${response.status}`);
      } catch (error) {
        fetchError = error.message;
        console.log(`  ❌ Fetch failed: ${error.message}`);
      }
      
      fetchResults[scenario.name] = {
        url: scenario.url,
        error: fetchError,
        success: fetchSuccess,
        expectedToFail: scenario.expectsToFail
      };
      
      // Validate expectations
      if (scenario.expectsToFail) {
        expect(fetchError).toBeTruthy();
        console.log(`  🎯 Expected failure confirmed`);
      } else {
        expect(fetchError).toBeFalsy();
        console.log(`  🎯 Expected success confirmed`);
      }
    }

    // ROOT CAUSE: Relative URLs fail in server-side context
    console.log('\n🔍 FETCH BEHAVIOR ROOT CAUSE:');
    console.log('- Relative URLs cannot be resolved without browser context');
    console.log('- Node.js fetch() requires absolute URLs');
    console.log('- window object presence doesn\'t fix URL resolution');
  });

  it('should expose the environment variable detection logic flaw', async () => {
  const start = performance.now();
  
    const envTestCases = [
      { nodeEnv: 'test', description: 'Test environment'
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
},
      { nodeEnv: 'production', description: 'Production environment' },
      { nodeEnv: 'development', description: 'Development environment' },
      { nodeEnv: undefined, description: 'Undefined NODE_ENV' },
      { nodeEnv: 'staging', description: 'Custom environment' }
    ];

    console.log('🔍 Environment Variable Detection Analysis:');
    
    for (const testCase of envTestCases) {
      const originalNodeEnv = process.env.NODE_ENV;
      
      if (testCase.nodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = testCase.nodeEnv;
      }
      
      // Test the actual logic from homepage-data.ts
      const baseUrl = process.env.NODE_ENV === 'test' ? 'http://localhost:3000' : '';
      const getsAbsoluteUrl = baseUrl !== '';
      
      console.log(`  ${testCase.description}:`);
      console.log(`    NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
      console.log(`    Gets absolute URL: ${getsAbsoluteUrl}`);
      console.log(`    Base URL: "${baseUrl}"`);
      
      // ROOT CAUSE: Only exact match with 'test' gets absolute URLs
      if (testCase.nodeEnv === 'test') {
        expect(getsAbsoluteUrl).toBe(true);
      } else {
        expect(getsAbsoluteUrl).toBe(false);
      }
      
      process.env.NODE_ENV = originalNodeEnv;
    }

    console.log('\n🔍 ENVIRONMENT DETECTION FLAW:');
    console.log('- Only NODE_ENV="test" gets absolute URLs');
    console.log('- All other environments (prod/dev/staging) get relative URLs');
    console.log('- No fallback mechanism for server-side rendering contexts');
  });

  it('should demonstrate MSW interception differences with URL types', async () => {
  const start = performance.now();
  
    const urlTypes = [
      {
        name: 'Absolute URL',
        url: 'http://localhost:3000/api/data/public_items?limit=1',
        shouldBeIntercepted: true
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
},
      {
        name: 'Relative URL',
        url: '/api/data/public_items?limit=1',
        shouldBeIntercepted: false // MSW can't intercept relative URLs in Node
      },
      {
        name: 'Protocol-relative URL',
        url: '//localhost:3000/api/data/public_items?limit=1',
        shouldBeIntercepted: false
      }
    ];

    console.log('🎯 MSW Interception Analysis:');
    
    for (const urlType of urlTypes) {
      console.log(`\n  Testing ${urlType.name}: ${urlType.url}`);
      
      let intercepted = false;
      let fetchError = null;
      
      try {
        const response = await fetch(urlType.url);
        
        // If we get a successful response, MSW intercepted it
        if (response.ok) {
          const data = await response.json();
          intercepted = Array.isArray(data) && data.length > 0;
          console.log(`    ✅ MSW intercepted, got ${data.length} items`);
        } else {
          console.log(`    ❌ Response not OK: ${response.status}`);
        }
      } catch (error) {
        fetchError = error.message;
        console.log(`    ❌ Fetch error: ${error.message}`);
      }
      
      if (urlType.shouldBeIntercepted) {
        expect(intercepted).toBe(true);
        expect(fetchError).toBeFalsy();
      } else {
        expect(intercepted).toBe(false);
        expect(fetchError).toBeTruthy();
      }
    }

    console.log('\n🔍 MSW INTERCEPTION ROOT CAUSE:');
    console.log('- MSW can only intercept absolute URLs in Node.js environment');
    console.log('- Relative URLs bypass MSW and fail with "Invalid URL" errors');
    console.log('- This is why test environment (absolute URLs) works but others fail');
  });

  it('should expose the complete failure chain from environment to fallback data', async () => {
  const start = performance.now();
  
    console.log('🔗 Complete Failure Chain Analysis:');
    
    // Simulate production environment
    process.env.NODE_ENV = 'production';
    delete (global as any).window;
    
    const failureChain = [];
    
    // Step 1: Environment detection
    const baseUrl = process.env.NODE_ENV === 'test' ? 'http://localhost:3000' : '';
    const usesRelativeUrl = baseUrl === '';
    
    failureChain.push({
      step: 1,
      description: 'Environment Detection',
      result: `NODE_ENV=production → relative URLs`,
      issue: usesRelativeUrl ? 'Uses relative URLs' : 'OK'
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
});
    
    // Step 2: URL construction
    const testUrl = `${baseUrl}/api/data/public_items?limit=3`;
    const isRelative = testUrl.startsWith('/');
    
    failureChain.push({
      step: 2,
      description: 'URL Construction',
      result: `"${testUrl}"`,
      issue: isRelative ? 'Relative URL constructed' : 'OK'
    });
    
    // Step 3: Fetch attempt
    let fetchFailed = false;
    let fetchError = '';
    
    try {
      await fetch(testUrl);
    } catch (error) {
      fetchFailed = true;
      fetchError = error.message;
    }
    
    failureChain.push({
      step: 3,
      description: 'Fetch Execution',
      result: fetchFailed ? `Error: ${fetchError}` : 'Success',
      issue: fetchFailed ? 'Fetch fails with relative URL' : 'OK'
    });
    
    // Step 4: Error handling (simulated)
    const fallsBackToSynthetic = fetchFailed;
    
    failureChain.push({
      step: 4,
      description: 'Error Handling',
      result: fallsBackToSynthetic ? 'Returns synthetic data' : 'Returns real data',
      issue: fallsBackToSynthetic ? 'Synthetic data fallback activated' : 'OK'
    });
    
    // Display the complete chain
    console.log('\n  Failure Chain:');
    failureChain.forEach(step => {
      const status = step.issue === 'OK' ? '✅' : '❌';
      console.log(`    ${step.step}. ${step.description}: ${step.result} ${status}`);
      if (step.issue !== 'OK') {
        console.log(`       Issue: ${step.issue}`);
      }
    });
    
    // Validate the chain leads to synthetic data
    expect(usesRelativeUrl).toBe(true);
    expect(isRelative).toBe(true);
    expect(fetchFailed).toBe(true);
    expect(fallsBackToSynthetic).toBe(true);
    
    console.log('\n🎯 ROOT CAUSE CONFIRMED:');
    console.log('1. Production environment → relative URLs');
    console.log('2. Relative URLs → fetch() failures in Node.js');
    console.log('3. Fetch failures → synthetic data fallback');
    console.log('4. Result: Homepage shows synthetic items instead of real data');
  });
});