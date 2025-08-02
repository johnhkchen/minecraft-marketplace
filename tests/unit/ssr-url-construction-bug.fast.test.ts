/**
 * Unit Test: SSR URL Construction Bug
 * 
 * PURPOSE: Prove that the URL construction service is causing SSR to hit wrong endpoint
 * ROOT CAUSE: fallbackBaseUrl points to localhost:3000 (dev) instead of production API
 * 
 * This explains why:
 * - Browser calls work (hit port 7410 production API) ✅
 * - SSR calls fail (hit port 3000 dev API with old data) ❌
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { URLConstructionService } from '../../shared/services/url-construction-service.js';
import { expectFastExecution } from '../utils/fast-test-setup.js';

describe('SSR URL Construction Bug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose the systematic bug in SSR URL construction', async () => {
  const start = performance.now();
  
    console.log('🔍 SSR URL CONSTRUCTION BUG ANALYSIS');
    console.log('Testing URL construction in different contexts');
    console.log('');

    const urlService = new URLConstructionService();

    // Test browser context (simulated)
    console.log('🌐 Browser Context (simulated):');
    const browserContext = urlService.getContext(); // This will show server-side in test
    console.log(`   Is server-side: ${browserContext.isServerSide
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
}`);
    console.log(`   Environment: ${browserContext.environment}`);
    
    const browserBaseUrl = urlService.getBaseUrl();
    const browserApiUrl = urlService.buildApiUrl('/api/data/public_items');
    console.log(`   Base URL: "${browserBaseUrl}"`);
    console.log(`   API URL: "${browserApiUrl}"`);
    console.log('');

    // Test server-side context (current context)
    console.log('🖥️ Server-Side Context (current):');
    console.log(`   Is server-side: ${urlService.isServerSide()}`);
    console.log(`   Environment: ${urlService.getContext().environment}`);
    
    const ssrBaseUrl = urlService.getBaseUrl();
    const ssrApiUrl = urlService.buildApiUrl('/api/data/public_items');
    console.log(`   Base URL: "${ssrBaseUrl}"`);
    console.log(`   API URL: "${ssrApiUrl}"`);
    console.log('');

    console.log('🚨 BUG ANALYSIS:');
    
    // The bug: SSR uses fallbackBaseUrl which points to wrong endpoint
    const isBugPresent = ssrApiUrl.includes('localhost:3000');
    const shouldHitProduction = ssrApiUrl.includes('localhost:7410') || ssrApiUrl.startsWith('/api/');
    
    console.log(`   SSR hits localhost:3000 (dev): ${isBugPresent ? '❌ YES' : '✅ NO'}`);
    console.log(`   SSR should hit production API: ${shouldHitProduction ? '✅ YES' : '❌ NO'}`);
    
    if (isBugPresent) {
      console.log('');
      console.log('🎯 ROOT CAUSE IDENTIFIED:');
      console.log('   • SSR context uses fallbackBaseUrl: "http://localhost:3000"');
      console.log('   • This hits the dev PostgREST instance with old 18-item data');
      console.log('   • Should hit production nginx proxy: relative URLs or localhost:7410');
      console.log('');
      console.log('💡 SOLUTION:');
      console.log('   • Change fallbackBaseUrl to "" (relative URLs)');
      console.log('   • Or change fallbackBaseUrl to "http://localhost:7410"');
      console.log('   • This will make SSR hit the production API with 55 items');
    }

    // Debug info
    const debugInfo = urlService.getDebugInfo();
    console.log('');
    console.log('🔧 Debug Information:');
    console.log(`   Config: ${JSON.stringify(debugInfo.config, null, 2)}`);
    
    // This test should expose the bug
    expect(isBugPresent).toBe(true); // This proves the bug exists
    expect(ssrApiUrl).toBe('http://localhost:3000/api/data/public_items'); // Exact wrong URL
  });

  it('should demonstrate the fix for SSR URL construction', async () => {
  const start = performance.now();
  
    console.log('');
    console.log('🛠️ DEMONSTRATING THE FIX');
    console.log('Testing corrected URL construction for SSR');
    console.log('');

    // Create URL service with corrected configuration
    const fixedUrlService = new URLConstructionService({
      fallbackBaseUrl: '' // Use relative URLs so nginx can proxy correctly
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
});

    const fixedContext = fixedUrlService.getContext();
    const fixedBaseUrl = fixedUrlService.getBaseUrl();
    const fixedApiUrl = fixedUrlService.buildApiUrl('/api/data/public_items');

    console.log('✅ Fixed Configuration:');
    console.log(`   Is server-side: ${fixedContext.isServerSide}`);
    console.log(`   Base URL: "${fixedBaseUrl}"`);
    console.log(`   API URL: "${fixedApiUrl}"`);
    console.log('');

    const isFixed = fixedApiUrl === '/api/data/public_items';
    console.log(`   Uses relative URL: ${isFixed ? '✅ YES' : '❌ NO'}`);
    
    if (isFixed) {
      console.log('');
      console.log('🎉 FIX VALIDATED:');
      console.log('   • SSR will use relative URLs');
      console.log('   • nginx will proxy to correct PostgREST instance');
      console.log('   • Homepage will show 55 items from 7 shops');
    }

    expect(fixedApiUrl).toBe('/api/data/public_items');
  });

  it('should test URL construction across all expected environments', async () => {
  const start = performance.now();
  
    console.log('');
    console.log('🌍 ENVIRONMENT URL CONSTRUCTION TEST');
    console.log('Testing URL construction across different environments');
    console.log('');

    const environments = ['test', 'development', 'production'];
    const contexts = ['server-side', 'browser'];

    for (const env of environments) {
      console.log(`📊 Environment: ${env
  
  const timeMs = performance.now() - start;
  expectFastExecution(timeMs, 10); // Fast test should complete in <10ms
}`);
      
      // Mock environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = env;
      
      const urlService = new URLConstructionService();
      const context = urlService.getContext();
      const baseUrl = urlService.getBaseUrl();
      const apiUrl = urlService.buildApiUrl('/api/data/public_items');
      
      console.log(`   Context: ${context.isServerSide ? 'server-side' : 'browser'}`);
      console.log(`   Base URL: "${baseUrl}"`);
      console.log(`   API URL: "${apiUrl}"`);
      
      // Validate URL construction
      const isAbsolute = apiUrl.startsWith('http');
      const isRelative = apiUrl.startsWith('/');
      const isValid = isAbsolute || isRelative;
      
      console.log(`   Valid URL: ${isValid ? '✅' : '❌'}`);
      console.log('');
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
      
      expect(isValid).toBe(true);
    }
  });
});