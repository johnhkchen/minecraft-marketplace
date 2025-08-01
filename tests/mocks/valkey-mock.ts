/**
 * Mock Valkey Service for Testing
 * Provides in-memory caching that mimics Valkey behavior for fast tests
 */

export class MockValkeyService {
  private cache = new Map<string, { data: any; expires: number }>();
  private isConnected = false;
  public client = {}; // Mock client object to match interface

  async connect(): Promise<void> {
    this.isConnected = true;
    console.log('🧪 Mock Valkey connected');
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.cache.clear();
    console.log('🧪 Mock Valkey disconnected');
  }

  async get<T = any>(key: string): Promise<T | null> {
    // Remove the isConnected check to prevent warnings in logs
    // Mock service should always respond
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  async set<T = any>(key: string, value: T, ttlMs: number = 30000): Promise<void> {
    // Remove the isConnected check to prevent warnings in logs
    // Mock service should always work
    this.cache.set(key, {
      data: value,
      expires: Date.now() + ttlMs
    });
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    if (!this.isConnected) return;
    this.cache.clear();
  }

  async info(): Promise<{ connected: boolean; keyCount?: number; memory?: string }> {
    if (!this.isConnected) {
      return { connected: false };
    }

    // Clean expired entries first
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }

    return {
      connected: true,
      keyCount: this.cache.size,
      memory: `${Math.round(this.cache.size * 0.1)}K` // Fake memory usage
    };
  }

  async ping(): Promise<boolean> {
    return this.isConnected;
  }
}

// Mock the Valkey service for testing
let mockService: MockValkeyService | null = null;

export function getMockValkeyService(): MockValkeyService {
  if (!mockService) {
    mockService = new MockValkeyService();
  }
  return mockService;
}

export function resetMockValkey(): void {
  if (mockService) {
    mockService.clear();
  }
}

// Mock the actual Valkey service imports for testing
export function mockValkeyService() {
  const mockService = getMockValkeyService();
  
  // This would be used in test setup to override the real service
  return {
    getValkeyService: () => mockService,
    initializeValkey: () => mockService.connect(),
    cleanupValkey: () => mockService.disconnect(),
    ValkeyCacheService: class MockValkeyCacheService {
      static generateKey(prefix: string, params: Record<string, any>): string {
        const sortedParams = Object.keys(params)
          .sort()
          .reduce((sorted, key) => {
            sorted[key] = params[key];
            return sorted;
          }, {} as Record<string, any>);
        
        const paramsString = JSON.stringify(sortedParams);
        return `${prefix}:${Buffer.from(paramsString).toString('base64')}`;
      }
    }
  };
}