/**
 * Valkey Initialization for Frontend
 * Sets up distributed caching on application startup
 */

import { initializeValkey, cleanupValkey, getValkeyService } from '../../../shared/services/valkey-cache.js';

/**
 * Initialize Valkey connection with error handling
 */
export async function initializeFrontendValkey(): Promise<void> {
  try {
    console.log('🚀 Initializing Valkey cache...');
    await initializeValkey();
    
    // Test the connection
    const valkey = getValkeyService();
    const isHealthy = await valkey.ping();
    
    if (isHealthy) {
      const stats = await valkey.info();
      console.log(`✅ Valkey cache ready - ${stats.keyCount || 0} keys, ${stats.memory || 'unknown'} memory`);
    } else {
      console.warn('⚠️ Valkey ping failed, cache may not be working');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Valkey cache:', error);
    console.log('🔄 Application will continue with degraded caching performance');
  }
}

/**
 * Cleanup Valkey connection on shutdown
 */
export async function cleanupFrontendValkey(): Promise<void> {
  try {
    console.log('🧹 Cleaning up Valkey cache...');
    await cleanupValkey();
    console.log('✅ Valkey cache cleanup complete');
  } catch (error) {
    console.error('❌ Error during Valkey cleanup:', error);
  }
}

/**
 * Health check for Valkey cache
 */
export async function checkValkeyHealth(): Promise<{
  connected: boolean;
  keyCount?: number;
  memory?: string;
  latency?: number;
}> {
  try {
    const valkey = getValkeyService();
    const start = Date.now();
    
    const isHealthy = await valkey.ping();
    const latency = Date.now() - start;
    
    if (!isHealthy) {
      return { connected: false, latency };
    }
    
    const stats = await valkey.info();
    return {
      connected: true,
      keyCount: stats.keyCount,
      memory: stats.memory,
      latency
    };
  } catch (error) {
    console.error('❌ Valkey health check failed:', error);
    return { connected: false };
  }
}