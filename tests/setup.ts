import { beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { setupInfrastructureOrSkip, type TestEnvironment } from './utils/test-environment.js';
import { isDockerAvailable } from './utils/testcontainers-setup.js';

// Test configuration using nginx proxy (single entry point)
const NGINX_BASE_URL = process.env.NGINX_BASE_URL || 'http://localhost:2888';
const POSTGREST_API_URL = `${NGINX_BASE_URL}/api/data`;
const ASTRO_API_URL = `${NGINX_BASE_URL}/api`;

// Test state
let testSetupComplete = false;
let testEnvironment: TestEnvironment | null = null;
let dockerAvailable = false;

// Determine test capabilities
const isTestcontainerTest = process.env.VITEST_CONFIG_NAME === 'testcontainers' || 
                           process.argv.some(arg => arg.includes('testcontainers'));
const isFastTest = process.env.VITEST_CONFIG_NAME === 'fast' || 
                  process.argv.some(arg => arg.includes('fast'));

// **ENHANCED SETUP WITH TESTCONTAINER SUPPORT**
beforeAll(async () => {
  console.log('🧪 Enhanced test environment setup...');
  
  // Check Docker availability for testcontainers
  dockerAvailable = await isDockerAvailable();
  
  if (isTestcontainerTest) {
    console.log('🐳 Testcontainer mode detected');
    if (dockerAvailable) {
      console.log('✅ Docker available - testcontainers ready');
      testSetupComplete = true; // Let testcontainer tests handle their own setup
    } else {
      console.log('❌ Docker not available - testcontainer tests will fail');
      testSetupComplete = false;
    }
    return;
  }
  
  if (isFastTest) {
    console.log('⚡ Fast test mode - no infrastructure needed');
    testSetupComplete = true;
    return;
  }
  
  try {
    // Use safe infrastructure detection with automatic fallback
    testEnvironment = await setupInfrastructureOrSkip(['nginx', 'postgrest']);
    testSetupComplete = true;
    
    console.log('✅ Infrastructure setup complete - integration tests enabled');
  } catch (error) {
    console.log('⏭️  Infrastructure setup skipped - see logs above for details');
    
    // Don't throw here - let individual tests decide whether to skip
    testSetupComplete = false;
    
    // Provide helpful exit for developers
    if (process.env.NODE_ENV !== 'test') {
      console.log('');
      console.log('🚀 Available test options:');
      console.log('   npm run test:fast                # Instant MSW-mocked tests');
      if (dockerAvailable) {
        console.log('   npm run test:integration:containers  # Testcontainer tests');
      }
      console.log('   docker compose up -d             # Start infrastructure');
      console.log('');
    }
  }
});

beforeEach(async (context) => {
  // Enhanced skip logic based on test type
  if (!testSetupComplete) {
    if (isTestcontainerTest && !dockerAvailable) {
      console.log('⏭️  Skipping testcontainer test - Docker not available');
    } else if (!isFastTest && !isTestcontainerTest) {
      console.log('⏭️  Skipping infrastructure test - services not available');
    }
    context.skip();
    return;
  }
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  if (isTestcontainerTest) {
    // Testcontainer tests manage their own URLs
    (global as any).testMode = 'testcontainer';
    (global as any).dockerAvailable = dockerAvailable;
    console.log('🐳 Testcontainer test ready');
  } else if (isFastTest) {
    // Fast tests use MSW mocking
    (global as any).testMode = 'fast';
    console.log('⚡ Fast test ready - MSW mocked');
  } else {
    // Infrastructure tests use nginx proxy
    (global as any).testMode = 'infrastructure';
    (global as any).postgrestApiUrl = POSTGREST_API_URL;
    (global as any).astroApiUrl = ASTRO_API_URL;
    (global as any).nginxBaseUrl = NGINX_BASE_URL;
    (global as any).testEnvironment = testEnvironment;
    console.log(`🧪 Infrastructure test ready - using nginx proxy at ${NGINX_BASE_URL}`);
  }
});

afterEach(async (context) => {
  // Clean up global references based on test mode
  const testMode = (global as any).testMode;
  
  if (testMode === 'infrastructure') {
    delete (global as any).postgrestApiUrl;
    delete (global as any).astroApiUrl;
    delete (global as any).nginxBaseUrl;
    delete (global as any).testEnvironment;
  }
  
  delete (global as any).testMode;
  delete (global as any).dockerAvailable;
});

afterAll(async () => {
  console.log('🧹 Cleaning up enhanced test environment...');
  testSetupComplete = false;
  dockerAvailable = false;
});

// Helper functions for different test modes

/**
 * Get test mode - testcontainer, fast, or infrastructure
 */
export function getTestMode(): 'testcontainer' | 'fast' | 'infrastructure' | 'unknown' {
  return (global as any).testMode || 'unknown';
}

/**
 * Check if Docker is available for testcontainers
 */
export function isDockerReady(): boolean {
  return (global as any).dockerAvailable || false;
}

/**
 * Make API request appropriate for current test mode
 */
export async function makeApiRequest(endpoint: string, options: RequestInit = {}) {
  const testMode = getTestMode();
  
  switch (testMode) {
    case 'infrastructure':
      return postgrestRequest(endpoint, options);
    case 'testcontainer':
      // Testcontainer tests should provide their own URLs
      const postgrestUrl = (global as any).testcontainerPostgrestUrl;
      if (!postgrestUrl) {
        throw new Error('Testcontainer PostgREST URL not set. Call setTestcontainerUrls() first.');
      }
      const url = endpoint.startsWith('/') ? `${postgrestUrl}${endpoint}` : `${postgrestUrl}/${endpoint}`;
      return fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
      });
    case 'fast':
      throw new Error('Fast tests should use MSW mocking, not real API calls');
    default:
      throw new Error(`Unknown test mode: ${testMode}`);
  }
}

/**
 * Set testcontainer URLs for the current test
 */
export function setTestcontainerUrls(urls: { postgrest: string; postgres: string }) {
  (global as any).testcontainerPostgrestUrl = urls.postgrest;
  (global as any).testcontainerPostgresUrl = urls.postgres;
}

// Helper functions for nginx-based API testing (legacy)

/**
 * Make PostgREST API request through nginx proxy
 */
export async function postgrestRequest(endpoint: string, options: RequestInit = {}) {
  const baseUrl = (global as any).postgrestApiUrl;
  if (!baseUrl) throw new Error('PostgREST API URL not available');
  
  const url = endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    },
    ...options
  });

  return response;
}

/**
 * Make Astro API request through nginx proxy
 */
export async function astroApiRequest(endpoint: string, options: RequestInit = {}) {
  const baseUrl = (global as any).astroApiUrl;
  if (!baseUrl) throw new Error('Astro API URL not available');
  
  const url = endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    },
    ...options
  });

  return response;
}

/**
 * Get existing user from the database (read-only testing approach)
 */
export async function getExistingUser() {
  const response = await postgrestRequest('/users?limit=1');
  if (!response.ok) throw new Error('Failed to fetch users');
  
  const users = await response.json();
  return users.length > 0 ? users[0] : null;
}

/**
 * Get existing items from the database (read-only testing approach)
 */
export async function getExistingItems(limit = 5) {
  const response = await postgrestRequest(`/public_items?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch items');
  
  return await response.json();
}

// Helper function to create test request
export function createTestRequest(url: string, options: RequestInit = {}) {
  return new Request(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
}

// Helper function to create test context for Astro API routes
export function createTestContext(url: string, options: RequestInit = {}) {
  const request = createTestRequest(url, options);
  return {
    request,
    url: new URL(url),
    params: {},
    props: {},
    redirect: (url: string) => Response.redirect(url),
    locals: {}
  };
}