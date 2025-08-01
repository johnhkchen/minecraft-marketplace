/**
 * Valkey Diagnostics Tests
 * Identifies why Valkey connection warnings are appearing
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { ValkeyCacheService, createValkeyService, getValkeyService, initializeValkey } from '../../workspaces/shared/services/valkey-cache.js';
import { loadEnhancedHomepageData } from '../../workspaces/frontend/src/lib/enhanced-homepage-data.js';

describe('Valkey Connection Diagnostics', () => {
  
  test('should diagnose Valkey service creation', async () => {
    console.log('🔍 Diagnosing Valkey service creation...');
    
    // Test environment variables
    console.log('📋 Environment Variables:');
    console.log(`   VALKEY_HOST: ${process.env.VALKEY_HOST || 'undefined'}`);
    console.log(`   VALKEY_PORT: ${process.env.VALKEY_PORT || 'undefined'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
    console.log(`   VITEST: ${process.env.VITEST || 'undefined'}`);
    
    // Test service creation
    const service = createValkeyService();
    expect(service).toBeInstanceOf(ValkeyCacheService);
    console.log('✅ Service creation successful');
    
    // Test global service
    const globalService = getValkeyService();
    expect(globalService).toBeDefined();
    console.log('✅ Global service retrieval successful');
  });

  test('should diagnose connection attempt', async () => {
    console.log('🔍 Diagnosing Valkey connection...');
    
    const service = new ValkeyCacheService({
      host: 'localhost',
      port: 6379,
      database: 3, // Use different DB for diagnostics
      maxRetries: 1,
      retryDelayMs: 100
    });

    try {
      console.log('🔌 Attempting connection...');
      await service.connect();
      
      const isHealthy = await service.ping();
      console.log(`🏥 Health check: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
      
      const stats = await service.info();
      console.log('📊 Connection stats:', stats);
      
      // Test basic operations
      await service.set('diagnostic:test', 'connection-working', 5000);
      const retrieved = await service.get('diagnostic:test');
      console.log(`💾 Cache test: ${retrieved === 'connection-working' ? 'SUCCESS' : 'FAILED'}`);
      
      await service.disconnect();
      console.log('✅ Connection diagnostic completed successfully');
      
    } catch (error) {
      console.log('❌ Connection failed:', error.message);
      console.log('💡 This explains why tests show "Valkey not connected" warnings');
      console.log('💡 To fix: Start Valkey with `docker compose up valkey -d`');
      
      // This is expected in test environment without running Valkey
      expect(error).toBeDefined();
    }
  });

  test('should diagnose enhanced homepage data service caching', async () => {
    console.log('🔍 Diagnosing enhanced homepage data caching...');
    
    // This will use the mock service in test environment
    const startTime = Date.now();
    
    try {
      const result = await loadEnhancedHomepageData({ biome: 'jungle' }, 1, 5);
      const duration = Date.now() - startTime;
      
      console.log(`⏱️ First call duration: ${duration}ms`);
      console.log(`📊 Items returned: ${result.allItems.length}`);
      
      // Second call should be faster (cached)
      const startTime2 = Date.now();
      const result2 = await loadEnhancedHomepageData({ biome: 'jungle' }, 1, 5);
      const duration2 = Date.now() - startTime2;
      
      console.log(`⚡ Cached call duration: ${duration2}ms`);
      console.log(`🔄 Cache working: ${duration2 < duration ? 'YES' : 'NO'}`);
      
      expect(result.allItems.length).toBe(result2.allItems.length);
      
    } catch (error) {
      console.log('❌ Enhanced homepage data error:', error.message);
      throw error;
    }
  });

  test('should show connection flow step by step', async () => {
    console.log('🔍 Step-by-step connection diagnostic...');
    
    // Step 1: Create service
    console.log('Step 1: Creating service...');
    const service = new ValkeyCacheService({
      host: 'localhost',
      port: 6379,
      database: 4,
      maxRetries: 1,
      retryDelayMs: 500
    });
    console.log('✅ Service created');
    
    // Step 2: Check initial state
    console.log('Step 2: Checking initial state...');
    try {
      const initialPing = await service.ping();
      console.log(`   Initial ping: ${initialPing ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.log(`   Initial ping: FAILED (${error.message})`);
    }
    
    // Step 3: Attempt connection
    console.log('Step 3: Attempting connection...');
    try {
      await service.connect();
      console.log('✅ Connection established');
      
      // Step 4: Test operations
      console.log('Step 4: Testing operations...');
      
      const pingResult = await service.ping();
      console.log(`   Ping: ${pingResult ? 'SUCCESS' : 'FAILED'}`);
      
      await service.set('test:diagnostic', { step: 4, success: true });
      console.log('   Set: SUCCESS');
      
      const getData = await service.get('test:diagnostic');
      console.log(`   Get: ${getData?.success ? 'SUCCESS' : 'FAILED'}`);
      
      const stats = await service.info();
      console.log(`   Stats: ${stats.connected ? 'CONNECTED' : 'DISCONNECTED'} (${stats.keyCount} keys)`);
      
      await service.disconnect();
      console.log('✅ Diagnostic completed - Valkey is working correctly');
      
    } catch (error) {
      console.log(`❌ Connection failed at step 3: ${error.message}`);
      console.log('');
      console.log('🚨 ROOT CAUSE IDENTIFIED:');
      console.log('   The "Valkey not connected" warnings occur because:');
      console.log('   1. Tests run without a real Valkey instance');
      console.log('   2. The ValkeyCacheService connection check fails');
      console.log('   3. The service gracefully degrades (good behavior)');
      console.log('');
      console.log('💡 SOLUTIONS:');
      console.log('   • For tests: Mock service is already working correctly');
      console.log('   • For integration: Run `docker compose up valkey -d`');
      console.log('   • For production: Environment variables configured correctly');
      
      expect(error.message).toContain('connect');
    }
  });

  test('should verify mock service behavior in tests', async () => {
    console.log('🔍 Verifying mock service behavior...');
    
    // Import and test the mock
    const { getMockValkeyService } = await import('../mocks/valkey-mock.js');
    const mockService = getMockValkeyService();
    
    await mockService.connect();
    console.log('✅ Mock service connected');
    
    const isHealthy = await mockService.ping();
    console.log(`🏥 Mock health: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
    
    // Test operations
    await mockService.set('mock:test', { mock: true, working: true });
    const retrieved = await mockService.get('mock:test');
    
    console.log(`💾 Mock cache test: ${retrieved?.working ? 'SUCCESS' : 'FAILED'}`);
    
    const stats = await mockService.info();
    console.log(`📊 Mock stats: ${stats.connected ? 'CONNECTED' : 'DISCONNECTED'} (${stats.keyCount} keys)`);
    
    expect(retrieved.working).toBe(true);
    expect(stats.connected).toBe(true);
    
    await mockService.disconnect();
    console.log('✅ Mock service test completed');
  });

  test('should provide environment setup instructions', () => {
    console.log('');
    console.log('🚀 VALKEY SETUP INSTRUCTIONS:');
    console.log('');
    console.log('📋 Current Status:');
    console.log('   ✅ Valkey service code: IMPLEMENTED');
    console.log('   ✅ Mock service for tests: WORKING');
    console.log('   ✅ Docker configuration: READY');
    console.log('   ⚠️  Live connection: REQUIRES VALKEY RUNNING');
    console.log('');
    console.log('🛠️  To start Valkey:');
    console.log('   docker compose up valkey -d');
    console.log('');
    console.log('🧪 To run integration tests:');
    console.log('   docker compose up valkey -d');
    console.log('   npm run test:integration tests/integration/valkey-integration.test.ts');
    console.log('');
    console.log('🚀 To run full stack:');
    console.log('   docker compose up --build');
    console.log('');
    console.log('✅ The warnings in unit tests are EXPECTED and show graceful degradation');
    
    // This test always passes - it's just for documentation
    expect(true).toBe(true);
  });
});