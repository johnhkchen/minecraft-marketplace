/**
 * Unified Testcontainers Setup using Docker Compose
 * 
 * Uses existing Docker Compose infrastructure as single source of truth.
 * Nix-aligned approach: one reproducible infrastructure definition.
 */

import { DockerComposeEnvironment, StartedDockerComposeEnvironment, Wait } from 'testcontainers';

interface TestContainerStack {
  compose: StartedDockerComposeEnvironment;
  cleanup: () => Promise<void>;
  urls: {
    postgres: string;
    postgrest: string;
    nginx: string;
  };
}

// Cache containers across tests in the same suite
let containerCache: TestContainerStack | null = null;

/**
 * Sets up test environment using existing Docker Compose infrastructure
 * Nix-aligned: detects and uses existing running services instead of creating conflicts
 */
export async function setupTestcontainers(): Promise<TestContainerStack> {
  // Return cached containers if available
  if (containerCache) {
    return containerCache;
  }

  console.log('🐳 Detecting existing test infrastructure...');
  const startTime = Date.now();

  try {
    // Check if test infrastructure is already running
    const isRunning = await checkTestInfrastructure();
    
    if (isRunning) {
      console.log('✅ Using existing test infrastructure');
      
      // Use the existing running services
      const stack: TestContainerStack = {
        compose: null as any, // Not managed by testcontainers
        urls: {
          postgres: 'postgresql://test_user:test_password@localhost:5433/marketplace_test',
          postgrest: 'http://localhost:2888/api/data',
          nginx: 'http://localhost:2888'
        },
        cleanup: async () => {
          console.log('🧹 Not cleaning up - using external infrastructure');
          containerCache = null;
        }
      };

      // Verify services are working
      await verifyPostgrestConnection(stack.urls.postgrest);
      
      containerCache = stack;
      
      const setupTime = Date.now() - startTime;
      console.log(`🚀 Test infrastructure ready in ${setupTime}ms (using existing)`);
      
      return stack;
    } else {
      throw new Error('Test infrastructure not running. Start with: docker compose -f compose.test.yml up -d');
    }

  } catch (error) {
    console.error('❌ Failed to setup test infrastructure:', error);
    throw new Error(`Test infrastructure setup failed: ${error}`);
  }
}

/**
 * Check if the test infrastructure is already running
 */
async function checkTestInfrastructure(): Promise<boolean> {
  try {
    // Check if nginx is responding
    const response = await fetch('http://localhost:2888/health', { 
      signal: AbortSignal.timeout(2000) 
    });
    
    if (response.ok) {
      const text = await response.text();
      return text.includes('nginx test proxy healthy');
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * No longer needed - schema is applied via SQL files in Docker Compose
 */

/**
 * Verify PostgREST is responding correctly
 */
async function verifyPostgrestConnection(postgrestUrl: string): Promise<void> {
  try {
    const response = await fetch(`${postgrestUrl}/users?limit=1`);
    if (!response.ok) {
      throw new Error(`PostgREST health check failed: ${response.status}`);
    }
    const data = await response.json();
    console.log(`✅ PostgREST verified (${data.length} test records found)`);
  } catch (error) {
    throw new Error(`PostgREST verification failed: ${error}`);
  }
}

/**
 * Cleanup function for test teardown
 */
export async function cleanupTestcontainers(): Promise<void> {
  if (containerCache) {
    await containerCache.cleanup();
  }
}

/**
 * Get current testcontainer URLs (must call setupTestcontainers first)
 */
export function getTestcontainerUrls() {
  if (!containerCache) {
    throw new Error('Testcontainers not initialized. Call setupTestcontainers() first.');
  }
  return containerCache.urls;
}

/**
 * Check if Docker is available for testcontainers
 */
export async function isDockerAvailable(): Promise<boolean> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    await execAsync('docker info');
    return true;
  } catch {
    return false;
  }
}

/**
 * No longer needed - nginx config is in tests/fixtures/nginx-test.conf
 */

/**
 * Skip test if Docker is not available
 */
export async function skipIfDockerUnavailable() {
  const dockerAvailable = await isDockerAvailable();
  if (!dockerAvailable) {
    console.log('⏭️  Skipping testcontainer tests (Docker not available)');
    console.log('💡 Install Docker to run integration tests with testcontainers');
    throw new Error('SKIP: Docker not available for testcontainers');
  }
}