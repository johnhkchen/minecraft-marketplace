/**
 * URL Construction Service - Universal Environment-Safe URL Building
 * 
 * PURPOSE: Prevent homepage synthetic data bug and similar environment mismatches
 * SOLVES: URLs that work in browser but fail in server-side rendering contexts
 */

export interface URLConstructionConfig {
  testBaseUrl: string;
  devBaseUrl: string;
  prodBaseUrl: string;
  fallbackBaseUrl: string;
}

export interface ContextInfo {
  isServerSide: boolean;
  isBrowserContext: boolean;  
  isTestEnvironment: boolean;
  environment: string;
}

export class URLConstructionService {
  private config: URLConstructionConfig;

  constructor(config?: Partial<URLConstructionConfig>) {
    // Detect if we're running inside Docker container
    const isDockerEnvironment = this.isRunningInDocker();
    
    this.config = {
      testBaseUrl: 'http://localhost:3000',
      devBaseUrl: 'http://localhost:3000', 
      prodBaseUrl: '', // Relative URLs work in browser context
      fallbackBaseUrl: isDockerEnvironment ? 'http://postgrest:3000' : 'http://localhost:7410',
      ...config
    };
  }

  /**
   * Detect current execution context
   */
  getContext(): ContextInfo {
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
  getBaseUrl(): string {
    const context = this.getContext();
    
    // Key insight: Server-side contexts ALWAYS need absolute URLs
    if (context.isServerSide) {
      return this.config.fallbackBaseUrl;
    }
    
    // Browser contexts can use environment-specific URLs
    switch (context.environment) {
      case 'test':
        return this.config.testBaseUrl;
      case 'development':
        return this.config.devBaseUrl;
      case 'production':
        return this.config.prodBaseUrl; // Relative URLs work in browser
      default:
        return this.config.fallbackBaseUrl;
    }
  }

  /**
   * Build API URL with automatic context detection
   */
  buildApiUrl(endpoint: string): string {
    const baseUrl = this.getBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = `${baseUrl}${cleanEndpoint}`;
    
    // Validate URL is constructible
    this.validateUrl(fullUrl);
    
    return fullUrl;
  }

  /**
   * Build Astro API route URL
   */
  buildAstroUrl(endpoint: string): string {
    return this.buildApiUrl(endpoint);
  }

  /**
   * Build static asset URL
   */
  buildStaticUrl(path: string): string {
    return this.buildApiUrl(path);
  }

  /**
   * Validate URL can be constructed and used
   */
  validateUrl(url: string): void {
    try {
      new URL(url);
    } catch (error) {
      throw new Error(`Invalid URL construction: ${url} - ${error.message}`);
    }
  }

  /**
   * Detect if running inside Docker container
   */
  private isRunningInDocker(): boolean {
    // Check for Docker environment indicators
    return !!(
      process.env.HOSTNAME || // Docker containers have hostname
      process.env.POSTGRES_HOST === 'db' || // Our Docker compose setup
      process.env.VALKEY_HOST === 'valkey' || // Our Docker compose setup
      process.env.HOME === '/home/astro' // Our Docker container user
    );
  }

  /**
   * Context detection helpers
   */
  isServerSide(): boolean {
    return this.getContext().isServerSide;
  }

  isTestEnvironment(): boolean {
    return this.getContext().isTestEnvironment;
  }

  isBrowserContext(): boolean {
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