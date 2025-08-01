/**
 * Integration Test Setup with Testcontainers
 * 
 * Provides isolated, reproducible test environments using Docker containers.
 * Falls back to infrastructure detection if Docker is not available.
 */

import { beforeAll, afterAll } from 'vitest';
import { setupTestcontainers, cleanupTestcontainers, skipIfDockerUnavailable, getTestcontainerUrls } from './testcontainers-setup';
import { setupInfrastructureOrSkip } from './test-environment';

// Global test state
let testContainersReady = false;
let testUrls: {
  postgres: string;
  postgrest: string;
  postgresDirect: string;
} | null = null;

/**
 * Setup integration tests with testcontainers
 * Falls back to infrastructure detection if Docker unavailable
 */
export async function setupIntegrationTests() {
  try {
    // Check if Docker is available
    await skipIfDockerUnavailable();
    
    // Setup testcontainers
    const containers = await setupTestcontainers();
    testUrls = containers.urls;
    testContainersReady = true;
    
    // Set global environment variables for tests
    process.env.POSTGREST_API_URL = testUrls.postgrest;
    process.env.TEST_POSTGRES_URL = testUrls.postgres;
    
    console.log('🎯 Integration tests using testcontainers');
    return true;
    
  } catch (error) {
    console.log('⏭️  Testcontainers unavailable, trying infrastructure detection...');
    
    try {
      // Fallback to existing infrastructure detection
      const environment = await setupInfrastructureOrSkip(['postgrest']);
      
      // Use existing infrastructure
      testUrls = {
        postgres: 'postgresql://localhost:5432/marketplace', // Default
        postgrest: environment.postgrestUrl || 'http://localhost:2888/api/data',
        postgresDirect: 'postgresql://localhost:5432/marketplace'
      };
      
      process.env.POSTGREST_API_URL = testUrls.postgrest;
      testContainersReady = true;
      
      console.log('🎯 Integration tests using existing infrastructure');
      return true;
      
    } catch (fallbackError) {
      console.log('❌ No test environment available (Docker or infrastructure)');
      console.log('💡 Solutions:');
      console.log('   1. Install Docker for testcontainers');
      console.log('   2. Start infrastructure: docker compose up -d');
      console.log('   3. Use fast tests: npm run test:fast');
      
      return false;
    }
  }
}

/**
 * Cleanup integration test environment
 */
export async function cleanupIntegrationTests() {
  if (testContainersReady) {
    await cleanupTestcontainers();
    testContainersReady = false;
    testUrls = null;
  }
}

/**
 * Get test environment URLs
 */
export function getIntegrationTestUrls() {
  if (!testUrls) {
    throw new Error('Integration tests not initialized. Call setupIntegrationTests() first.');
  }
  return testUrls;
}

/**
 * Skip test if integration environment is not ready
 */
export function skipIfIntegrationNotReady() {
  if (!testContainersReady) {
    throw new Error('SKIP: Integration test environment not available');
  }
}

/**
 * Standard integration test setup - call this in your test files
 */
export function useIntegrationTests() {
  beforeAll(async () => {
    const success = await setupIntegrationTests();
    if (!success) {
      throw new Error('SKIP: Integration test environment setup failed');
    }
  }, 15000); // Fail fast - only 15 seconds total

  afterAll(async () => {
    await cleanupIntegrationTests();
  });
}

/**
 * Create test context for API calls with proper URLs
 */
export function createIntegrationTestContext(path: string, options: any = {}) {
  const urls = getIntegrationTestUrls();
  const baseUrl = path.startsWith('/api/data') ? urls.postgrest : urls.postgrest.replace('/api/data', '');
  
  return {
    url: `${baseUrl}${path}`,
    ...options
  };
}