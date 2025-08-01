/**
 * URL Service Debug - Understand what URLs are being generated
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupFastTests } from '../utils/fast-test-setup.js';
import { URLConstructionService } from '../../shared/services/url-construction-service.js';

setupFastTests();

describe('URL Service Debug', () => {
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

  it('should show exactly what URLs are generated in each context', () => {
    console.log('🔍 URL GENERATION DEBUG');
    console.log('======================\n');
    
    const testCases = [
      { env: 'test', hasWindow: true, label: 'Test Browser' },
      { env: 'test', hasWindow: false, label: 'Test Server' },
      { env: 'production', hasWindow: true, label: 'Prod Browser' },
      { env: 'production', hasWindow: false, label: 'Prod Server' },
      { env: 'development', hasWindow: true, label: 'Dev Browser' },
      { env: 'development', hasWindow: false, label: 'Dev Server' }
    ];

    for (const testCase of testCases) {
      // Set up environment
      process.env.NODE_ENV = testCase.env;
      if (testCase.hasWindow) {
        (global as any).window = { location: { href: 'http://localhost:3000' } };
      } else {
        delete (global as any).window;
      }

      const urlService = new URLConstructionService();
      const context = urlService.getContext();
      const baseUrl = urlService.getBaseUrl();
      const fullUrl = urlService.buildApiUrl('/api/data/public_items');

      console.log(`📋 ${testCase.label}:`);
      console.log(`   Environment: ${context.environment}`);
      console.log(`   isServerSide: ${context.isServerSide}`);
      console.log(`   isTestEnvironment: ${context.isTestEnvironment}`);
      console.log(`   isBrowserContext: ${context.isBrowserContext}`);
      console.log(`   Base URL: "${baseUrl}"`);
      console.log(`   Full URL: "${fullUrl}"`);
      
      // Test if URL is valid for Node.js fetch
      try {
        new URL(fullUrl);
        console.log(`   URL Valid: ✅`);
      } catch (error) {
        console.log(`   URL Valid: ❌ ${error.message}`);
      }
      
      console.log('');
    }

    expect(true).toBe(true);
  });
});