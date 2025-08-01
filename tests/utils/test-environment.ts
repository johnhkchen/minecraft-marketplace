/**
 * Test Environment Detection
 * 
 * Safely detects available test infrastructure and provides graceful fallbacks
 * to prevent hanging Vitest processes when services are not available.
 */

export interface TestEnvironment {
  hasMSWMocking: boolean;
  hasPostgREST: boolean;
  hasNginx: boolean;
  hasDatabase: boolean;
  isInfrastructureFree: boolean;
  recommendedTestCommand: string;
}

/**
 * Quick infrastructure availability check with timeout
 */
async function quickServiceCheck(url: string, timeoutMs: number = 2000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Detect current test environment capabilities
 */
export async function detectTestEnvironment(): Promise<TestEnvironment> {
  const NGINX_BASE_URL = process.env.NGINX_BASE_URL || 'http://localhost:7410';
  const POSTGREST_API_URL = `${NGINX_BASE_URL}/api/data`;
  
  // Quick parallel checks with short timeouts
  const [hasNginx, hasPostgREST] = await Promise.all([
    quickServiceCheck(NGINX_BASE_URL, 1000),
    quickServiceCheck(`${POSTGREST_API_URL}/public_items?limit=1`, 1000)
  ]);
  
  // MSW is always available (client-side mocking)
  const hasMSWMocking = true;
  
  // Database availability is inferred from PostgREST
  const hasDatabase = hasPostgREST;
  
  // Infrastructure-free means we can run without external services
  const isInfrastructureFree = hasMSWMocking;
  
  let recommendedTestCommand = 'npm run test:fast';
  if (hasPostgREST && hasNginx) {
    recommendedTestCommand = 'npm test (infrastructure available)';
  }
  
  return {
    hasMSWMocking,
    hasPostgREST,
    hasNginx,
    hasDatabase,
    isInfrastructureFree,
    recommendedTestCommand
  };
}

/**
 * Log test environment status with helpful guidance
 */
export function logTestEnvironment(env: TestEnvironment): void {
  console.log('🔍 Test Environment Detection:');
  console.log(`   MSW Mocking: ${env.hasMSWMocking ? '✅' : '❌'}`);
  console.log(`   nginx: ${env.hasNginx ? '✅' : '❌'}`);
  console.log(`   PostgREST: ${env.hasPostgREST ? '✅' : '❌'}`);
  console.log(`   Database: ${env.hasDatabase ? '✅' : '❌'}`);
  console.log(`💡 Recommended: ${env.recommendedTestCommand}`);
  
  if (!env.hasPostgREST) {
    console.log('');
    console.log('⚡ For instant testing without infrastructure:');
    console.log('   npm run test:fast    # MSW-mocked tests');
    console.log('');
    console.log('🐳 To start infrastructure:');
    console.log('   docker compose up -d');
  }
}

/**
 * Skip test suite if infrastructure is required but not available
 */
export function skipIfInfrastructureMissing(env: TestEnvironment, requiredServices: string[]): void {
  const missing: string[] = [];
  
  if (requiredServices.includes('nginx') && !env.hasNginx) missing.push('nginx');
  if (requiredServices.includes('postgrest') && !env.hasPostgREST) missing.push('PostgREST');
  if (requiredServices.includes('database') && !env.hasDatabase) missing.push('database');
  
  if (missing.length > 0) {
    const message = `Skipping infrastructure-dependent tests (missing: ${missing.join(', ')})`;
    console.log(`⏭️  ${message}`);
    console.log(`💡 Use ${env.recommendedTestCommand} for infrastructure-free testing`);
    
    // Skip the entire test suite
    describe.skip('Infrastructure-dependent tests', () => {
      it.skip(`requires: ${missing.join(', ')}`, () => {});
    });
    
    throw new Error(`SKIP: ${message}`);
  }
}

/**
 * Graceful infrastructure setup with automatic fallback
 */
export async function setupInfrastructureOrSkip(requiredServices: string[] = ['nginx', 'postgrest']): Promise<TestEnvironment> {
  console.log('🔍 Detecting test environment...');
  
  const env = await detectTestEnvironment();
  logTestEnvironment(env);
  
  try {
    skipIfInfrastructureMissing(env, requiredServices);
    console.log('✅ Infrastructure available - proceeding with integration tests');
    return env;
  } catch (error) {
    console.log('⏭️  Infrastructure not available - tests will be skipped');
    throw error;
  }
}