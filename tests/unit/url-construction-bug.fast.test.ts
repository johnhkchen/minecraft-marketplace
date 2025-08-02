/**
 * URL Construction Bug - Isolated Unit Tests
 * 
 * PURPOSE: Expose the exact URL construction logic causing the homepage bug
 * FOCUS: Test the core logic without file dependencies
 */

import { describe, it, expect } from 'vitest';
import { expectFastExecution } from '../utils/fast-test-setup.js';

describe('URL Construction Bug Analysis', () => {
  it('should expose the environment-dependent URL construction flaw', () => {
  const start = performance.now();
  
    // This replicates the exact logic from homepage-data.ts
    const testEnvironmentLogic = (nodeEnv: string | undefined) => {
      return nodeEnv === 'test' ? 'http://localhost:3000' : '';
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
};
    
    const environments = [
      { name: 'test', value: 'test' },
      { name: 'production', value: 'production' },
      { name: 'development', value: 'development' },
      { name: 'staging', value: 'staging' },
      { name: 'undefined', value: undefined }
    ];
    
    console.log('🔍 URL Construction Logic Analysis:');
    
    const results = environments.map(env => {
      const baseUrl = testEnvironmentLogic(env.value);
      const fullUrl = `${baseUrl}/api/data/public_items?limit=5`;
      
      const result = {
        environment: env.name,
        baseUrl,
        fullUrl,
        isAbsolute: fullUrl.startsWith('http'),
        isRelative: fullUrl.startsWith('/api'),
        willWorkInNodeJs: fullUrl.startsWith('http')
      };
      
      console.log(`  ${env.name.toUpperCase()}:`);
      console.log(`    Base URL: "${baseUrl}"`);
      console.log(`    Full URL: "${fullUrl}"`);
      console.log(`    Will work in Node.js: ${result.willWorkInNodeJs}`);
      
      return result;
    });
    
    // BUG CONFIRMATION: Only test environment gets working URLs
    expect(results.find(r => r.environment === 'test')?.willWorkInNodeJs).toBe(true);
    expect(results.find(r => r.environment === 'production')?.willWorkInNodeJs).toBe(false);
    expect(results.find(r => r.environment === 'development')?.willWorkInNodeJs).toBe(false);
    
    console.log('\n🚨 BUG IDENTIFIED:');
    console.log('- Only NODE_ENV="test" produces working URLs in Node.js');
    console.log('- All other environments produce relative URLs that fail');
    console.log('- No consideration for server-side rendering contexts');
  });

  it('should demonstrate why relative URLs fail in Node.js fetch', async () => {
  const start = performance.now();
  
    const urlTestCases = [
      {
        name: 'Absolute URL (works)',
        url: 'http://localhost:3000/api/test',
        expectSuccess: true
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
},
      {
        name: 'Relative URL (fails)',
        url: '/api/test',
        expectSuccess: false
      },
      {
        name: 'Root-relative URL (fails)',
        url: '//localhost:3000/api/test',
        expectSuccess: false
      }
    ];
    
    console.log('\n🧪 Node.js Fetch URL Validation:');
    
    for (const testCase of urlTestCases) {
      let canParse = false;
      let parseError = '';
      
      try {
        new URL(testCase.url);
        canParse = true;
      } catch (error) {
        parseError = error.message;
      }
      
      console.log(`  ${testCase.name}:`);
      console.log(`    URL: "${testCase.url}"`);
      console.log(`    Can parse: ${canParse}`);
      if (!canParse) {
        console.log(`    Error: ${parseError}`);
      }
      
      expect(canParse).toBe(testCase.expectSuccess);
    }
    
    console.log('\n🔍 NODE.JS URL PARSING RULE:');
    console.log('- Node.js URL constructor requires absolute URLs');
    console.log('- Relative URLs cannot be parsed without a base URL');
    console.log('- fetch() relies on URL constructor, so relative URLs fail');
  });

  it('should show the fix needed for the bug', () => {
  const start = performance.now();
  
    // Current buggy logic
    const currentLogic = (nodeEnv: string | undefined) => {
      return nodeEnv === 'test' ? 'http://localhost:3000' : '';
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
};
    
    // Fixed logic that would work
    const fixedLogic = (nodeEnv: string | undefined, isServerSide: boolean = false) => {
      // Always use absolute URLs in server-side contexts
      if (isServerSide || typeof window === 'undefined') {
        return 'http://localhost:3000'; // Or environment-specific URL
      }
      
      // In browser contexts, relative URLs work fine
      return nodeEnv === 'test' ? 'http://localhost:3000' : '';
    };
    
    const environments = ['test', 'production', 'development'];
    const contexts = [
      { name: 'Server-side', isServerSide: true },
      { name: 'Browser', isServerSide: false }
    ];
    
    console.log('\n🔧 Bug Fix Analysis:');
    
    for (const context of contexts) {
      console.log(`\n  ${context.name.toUpperCase()} Context:`);
      
      for (const env of environments) {
        const currentUrl = `${currentLogic(env)}/api/test`;
        const fixedUrl = `${fixedLogic(env, context.isServerSide)}/api/test`;
        
        const currentWorks = currentUrl.startsWith('http');
        const fixedWorks = fixedUrl.startsWith('http');
        
        console.log(`    ${env}: Current="${currentUrl}" (${currentWorks ? '✅' : '❌'}) → Fixed="${fixedUrl}" (${fixedWorks ? '✅' : '❌'})`);
        
        // In server-side context, fixed version should always work
        if (context.isServerSide) {
          expect(fixedWorks).toBe(true);
        }
      }
    }
    
    console.log('\n💡 REQUIRED FIX:');
    console.log('1. Detect server-side rendering context');
    console.log('2. Use absolute URLs in server-side contexts');
    console.log('3. Allow relative URLs only in browser contexts');
  });

  it('should demonstrate the MSW testing implications', () => {
  const start = performance.now();
  
    // MSW can only intercept certain URL types in Node.js
    const mswTestCases = [
      {
        type: 'Absolute HTTP URL',
        url: 'http://localhost:3000/api/test',
        mswCanIntercept: true,
        reason: 'Standard MSW interception'
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
},
      {
        type: 'Relative URL',  
        url: '/api/test',
        mswCanIntercept: false,
        reason: 'Cannot parse URL, never reaches MSW'
      },
      {
        type: 'Absolute HTTPS URL',
        url: 'https://localhost:3000/api/test',
        mswCanIntercept: true,
        reason: 'Standard MSW interception'
      }
    ];
    
    console.log('\n🎭 MSW Interception Analysis:');
    
    for (const testCase of mswTestCases) {
      console.log(`  ${testCase.type}:`);
      console.log(`    URL: "${testCase.url}"`);
      console.log(`    MSW can intercept: ${testCase.mswCanIntercept ? '✅' : '❌'}`);
      console.log(`    Reason: ${testCase.reason}`);
      
      expect(testCase.mswCanIntercept).toBe(testCase.url.startsWith('http'));
    }
    
    console.log('\n🔍 MSW TESTING IMPLICATION:');
    console.log('- Tests pass because NODE_ENV=test → absolute URLs → MSW intercepts');
    console.log('- Production fails because relative URLs never reach MSW');
    console.log('- Bug hidden during testing due to environment-specific URL logic');
  });

  it('should trace the complete bug scenario step by step', () => {
  const start = performance.now();
  
    console.log('\n🎯 Complete Bug Scenario Trace:');
    
    const scenario = {
      environment: 'production',
      context: 'server-side rendering',
      steps: []
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
};
    
    // Step 1: Environment detection
    const nodeEnv = 'production';
    const baseUrl = nodeEnv === 'test' ? 'http://localhost:3000' : '';
    scenario.steps.push({
      step: 1,
      action: 'Environment Detection',
      input: `NODE_ENV="${nodeEnv}"`,
      output: `baseUrl="${baseUrl}"`,
      result: baseUrl === '' ? 'PROBLEM: Empty base URL' : 'OK'
    });
    
    // Step 2: URL construction
    const apiPath = '/api/data/public_items?limit=20';
    const fullUrl = `${baseUrl}${apiPath}`;
    scenario.steps.push({
      step: 2,
      action: 'URL Construction',
      input: `baseUrl + "${apiPath}"`,
      output: `"${fullUrl}"`,
      result: fullUrl.startsWith('/') ? 'PROBLEM: Relative URL' : 'OK'
    });
    
    // Step 3: URL parsing
    let urlParseError = '';
    try {
      new URL(fullUrl);
    } catch (error) {
      urlParseError = error.message;
    }
    scenario.steps.push({
      step: 3,
      action: 'URL Parsing',
      input: `new URL("${fullUrl}")`,
      output: urlParseError || 'Success',
      result: urlParseError ? 'PROBLEM: Parse failure' : 'OK'
    });
    
    // Step 4: Fetch attempt
    const fetchWillFail = !!urlParseError;
    scenario.steps.push({
      step: 4,
      action: 'Fetch Attempt',
      input: `fetch("${fullUrl}")`,
      output: fetchWillFail ? 'TypeError: Invalid URL' : 'HTTP Request',
      result: fetchWillFail ? 'PROBLEM: Fetch fails' : 'OK'
    });
    
    // Step 5: Error handling
    scenario.steps.push({
      step: 5,
      action: 'Error Handling',
      input: 'fetch() throws error',
      output: 'Fallback to synthetic data',
      result: 'PROBLEM: User sees wrong data'
    });
    
    console.log(`\n  Scenario: ${scenario.environment} environment, ${scenario.context}`);
    console.log('  ────────────────────────────────────────────────────');
    
    scenario.steps.forEach(step => {
      const status = step.result.startsWith('PROBLEM') ? '❌' : '✅';
      console.log(`  ${step.step}. ${step.action}`);
      console.log(`     Input:  ${step.input}`);
      console.log(`     Output: ${step.output}`);
      console.log(`     Result: ${step.result} ${status}`);
      console.log('');
    });
    
    // Validate the scenario leads to failure
    const problemSteps = scenario.steps.filter(s => s.result.startsWith('PROBLEM'));
    expect(problemSteps.length).toBeGreaterThan(0);
    
    console.log('🎯 BUG ROOT CAUSE CONFIRMED:');
    console.log(`- ${problemSteps.length} problem steps in the chain`);
    console.log('- Environment-dependent URL construction causes cascade failure');
    console.log('- Results in synthetic data being displayed to users');
  });
});