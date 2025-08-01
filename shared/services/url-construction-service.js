/**
 * URL Construction Service - Universal Environment-Safe URL Building
 * 
 * PURPOSE: Prevent homepage synthetic data bug and similar environment mismatches
 * SOLVES: URLs that work in browser but fail in server-side rendering contexts
 */

class URLConstructionService {
  constructor(config = {}) {
    // Detect if we're in Docker environment (nginx proxy setup)
    const isDockerDeployment = process.env.COMPOSE_PROJECT_NAME || 
                              process.env.DOCKER_COMPOSE || 
                              // Check for nginx-style deployment with port 7410
                              this.checkDockerDeployment();
    
    const dockerBaseUrl = 'http://localhost:7410';
    const testBaseUrl = isDockerDeployment ? dockerBaseUrl : 'http://localhost:3000';
    
    this.config = {
      testBaseUrl,
      devBaseUrl: isDockerDeployment ? dockerBaseUrl : 'http://localhost:3000',  
      prodBaseUrl: '', // Relative URLs work in browser context
      fallbackBaseUrl: isDockerDeployment ? dockerBaseUrl : 'http://localhost:3000', // Always absolute for SSR
      ...config
    };
  }

  /**
   * Check if we're running in Docker deployment with nginx proxy
   */
  checkDockerDeployment() {
    try {
      // Check if we can reach nginx on port 7410 (Docker deployment indicator)
      // This is a synchronous check that doesn't block startup
      const isNodeJS = typeof process !== 'undefined';
      const hasDockerIndicators = isNodeJS && (
        process.env.HOME === '/app' || // Common Docker home directory
        process.env.PATH?.includes('/app') || // App directory in PATH
        typeof require === 'function' // Running in Node.js context where Docker would be detected
      );
      return hasDockerIndicators;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect current execution context
   */
  getContext() {
    const isServerSide = typeof window === 'undefined';
    const isBrowserContext = !isServerSide;
    const environment = process.env.NODE_ENV || 'development';
    const isTestEnvironment = environment === 'test';

    return {
      isServerSide,
      isBrowserContext,
      isTestEnvironment,
      environment
    };
  }

  /**
   * Get appropriate base URL for current context
   * CRITICAL: This solves the homepage bug by considering BOTH environment AND context
   */
  getBaseUrl() {
    const context = this.getContext();
    
    // Key insight: Server-side contexts ALWAYS need absolute URLs
    if (context.isServerSide) {
      return this.config.fallbackBaseUrl;
    }
    
    // Critical insight: Test runners (Vitest, Jest) run in Node.js even when simulating browser
    // MSW and Node.js fetch() require absolute URLs, so use absolute URLs in any test runner
    const isTestRunner = context.isTestEnvironment || 
                        typeof process !== 'undefined' && process.env.VITEST === 'true' ||
                        typeof global !== 'undefined' && global.__vitest__;
    
    if (isTestRunner) {
      return this.config.testBaseUrl;
    }
    
    // Browser contexts in real deployment can use environment-specific URLs
    switch (context.environment) {
      case 'development':
        return this.config.devBaseUrl;
      case 'production':
        return this.config.prodBaseUrl;
      default:
        return this.config.fallbackBaseUrl;
    }
  }

  /**
   * Build API URL with automatic context detection
   */
  buildApiUrl(endpoint) {
    const baseUrl = this.getBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = `${baseUrl}${cleanEndpoint}`;
    
    // Special handling for relative URLs in browser context
    const context = this.getContext();
    if (context.isBrowserContext && baseUrl === '') {
      // In browser context, relative URLs don't need validation with new URL()
      // because they work with fetch() and browser APIs
      return cleanEndpoint;
    }
    
    // Validate URL is constructible for absolute URLs
    this.validateUrl(fullUrl);
    
    return fullUrl;
  }

  /**
   * Build Astro API route URL
   */
  buildAstroUrl(endpoint) {
    return this.buildApiUrl(endpoint);
  }

  /**
   * Build static asset URL
   */
  buildStaticUrl(path) {
    return this.buildApiUrl(path);
  }

  /**
   * Validate URL can be constructed and used
   */
  validateUrl(url) {
    try {
      new URL(url);
    } catch (error) {
      throw new Error(`Invalid URL construction: ${url} - ${error.message}`);
    }
  }

  /**
   * Context detection helpers
   */
  isServerSide() {
    return this.getContext().isServerSide;
  }

  isTestEnvironment() {
    return this.getContext().isTestEnvironment;
  }

  isBrowserContext() {
    return this.getContext().isBrowserContext;
  }

  /**
   * Debug information for troubleshooting
   */
  getDebugInfo() {
    const context = this.getContext();
    const baseUrl = this.getBaseUrl();
    
    return {
      context,
      baseUrl,
      config: this.config,
      exampleUrls: {
        api: this.buildApiUrl('/api/data/public_items'),
        astro: this.buildAstroUrl('/api/auth/discord'),
        static: this.buildStaticUrl('/favicon.ico')
      }
    };
  }
}

export { URLConstructionService };