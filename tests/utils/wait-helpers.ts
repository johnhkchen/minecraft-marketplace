/**
 * TDD-compliant wait utilities
 * 
 * Replaces arbitrary timeouts with event-driven waiting patterns
 * following foundation-first architecture principles.
 */

interface WaitOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
}

const DEFAULT_WAIT_OPTIONS: Required<WaitOptions> = {
  maxAttempts: 30,
  baseDelayMs: 100,
  maxDelayMs: 2000,
  timeoutMs: 30000
};

/**
 * Wait for a service endpoint to become ready
 * Uses exponential backoff instead of fixed delays
 */
export async function waitForServiceReady(
  url: string, 
  options: WaitOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_WAIT_OPTIONS, ...options };
  const startTime = Date.now();
  
  let attempt = 0;
  let delay = opts.baseDelayMs;
  
  while (attempt < opts.maxAttempts) {
    // Check timeout
    if (Date.now() - startTime > opts.timeoutMs) {
      throw new Error(`Service readiness timeout after ${opts.timeoutMs}ms for ${url}`);
    }
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        return; // Service is ready
      }
      throw new Error(`Service responded with status: ${response.status}`);
    } catch (error) {
      attempt++;
      
      if (attempt >= opts.maxAttempts) {
        throw new Error(`Service failed to become ready after ${attempt} attempts: ${error}`);
      }
      
      // Exponential backoff with jitter
      const jitter = Math.random() * 0.1 * delay;
      const actualDelay = Math.min(delay + jitter, opts.maxDelayMs);
      
      await new Promise(resolve => setTimeout(resolve, actualDelay));
      delay = Math.min(delay * 1.5, opts.maxDelayMs);
    }
  }
}

/**
 * Wait for a condition to become true
 * Generic utility for any condition-based waiting
 */
export async function waitForCondition(
  condition: () => Promise<boolean> | boolean,
  errorMessage: string,
  options: WaitOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_WAIT_OPTIONS, ...options };
  const startTime = Date.now();
  
  let attempt = 0;
  let delay = opts.baseDelayMs;
  
  while (attempt < opts.maxAttempts) {
    if (Date.now() - startTime > opts.timeoutMs) {
      throw new Error(`Condition timeout after ${opts.timeoutMs}ms: ${errorMessage}`);
    }
    
    try {
      const result = await condition();
      if (result) {
        return; // Condition met
      }
    } catch (error) {
      // Condition check failed, continue trying
    }
    
    attempt++;
    
    if (attempt >= opts.maxAttempts) {
      throw new Error(`Condition failed after ${attempt} attempts: ${errorMessage}`);
    }
    
    // Exponential backoff
    const actualDelay = Math.min(delay, opts.maxDelayMs);
    await new Promise(resolve => setTimeout(resolve, actualDelay));
    delay = Math.min(delay * 1.2, opts.maxDelayMs);
  }
}

/**
 * Wait for multiple services to be healthy
 * Runs health checks in parallel for efficiency
 */
export async function waitForAllServicesHealthy(
  healthChecks: Array<{ name: string; url: string }>,
  options: WaitOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_WAIT_OPTIONS, ...options };
  
  const healthPromises = healthChecks.map(async ({ name, url }) => {
    try {
      await waitForServiceReady(url, {
        maxAttempts: opts.maxAttempts,
        baseDelayMs: opts.baseDelayMs,
        timeoutMs: opts.timeoutMs
      });
      return { name, status: 'healthy' };
    } catch (error) {
      throw new Error(`Service ${name} failed health check: ${error}`);
    }
  });
  
  try {
    await Promise.all(healthPromises);
  } catch (error) {
    throw new Error(`Not all services became healthy: ${error}`);
  }
}

/**
 * Wait for a server port to be listening
 * More reliable than arbitrary delays for server startup
 */
export async function waitForServerListening(
  port: number,
  host: string = 'localhost',
  options: WaitOptions = {}
): Promise<void> {
  const url = `http://${host}:${port}`;
  
  await waitForCondition(
    async () => {
      try {
        // Just check if the port responds, don't care about the response
        await fetch(url, { 
          method: 'HEAD',
          // Short timeout for individual checks
          signal: AbortSignal.timeout(1000)
        });
        return true;
      } catch {
        return false;
      }
    },
    `Server not listening on ${url}`,
    options
  );
}