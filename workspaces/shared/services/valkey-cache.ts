/**
 * Valkey Cache Service
 * Redis-compatible distributed caching for enhanced performance
 */

import { createClient, RedisClientType } from 'redis';

export interface ValkeyConfig {
  host: string;
  port: number;
  password?: string;
  database?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface CacheEntry<T = any> {
  data: T;
  expires: number;
}

/**
 * Valkey Cache Service for distributed caching
 * Compatible with Redis protocol for high-performance marketplace queries
 */
export class ValkeyCacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private readonly config: ValkeyConfig;

  constructor(config: ValkeyConfig) {
    this.config = {
      maxRetries: 3,
      retryDelayMs: 1000,
      database: 0,
      ...config
    };
  }

  /**
   * Connect to Valkey server
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    const url = `redis://${this.config.host}:${this.config.port}/${this.config.database}`;
    
    this.client = createClient({
      url,
      password: this.config.password,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries >= (this.config.maxRetries || 3)) {
            console.error('⛔ Max Valkey reconnection attempts reached');
            return false;
          }
          const delay = Math.min(retries * (this.config.retryDelayMs || 1000), 5000);
          console.log(`🔄 Valkey reconnecting in ${delay}ms (attempt ${retries + 1})`);
          return delay;
        }
      }
    });

    this.client.on('error', (err) => {
      console.error('❌ Valkey Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('🔌 Valkey client connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('🔌 Valkey client disconnected');
      this.isConnected = false;
    });

    await this.client.connect();
    this.isConnected = true;
    console.log(`✅ Connected to Valkey at ${this.config.host}:${this.config.port}`);
  }

  /**
   * Disconnect from Valkey server
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.client = null;
      this.isConnected = false;
      console.log('🔌 Disconnected from Valkey');
    }
  }

  /**
   * Get cached value by key
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      console.warn('⚠️ Valkey not connected, cache miss');
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(value);
      
      // Check if expired
      if (Date.now() > entry.expires) {
        await this.client.del(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('❌ Valkey GET error:', error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  async set<T = any>(key: string, value: T, ttlMs: number = 30000): Promise<void> {
    if (!this.client || !this.isConnected) {
      console.warn('⚠️ Valkey not connected, skipping cache set');
      return;
    }

    try {
      const entry: CacheEntry<T> = {
        data: value,
        expires: Date.now() + ttlMs
      };

      const ttlSeconds = Math.ceil(ttlMs / 1000);
      await this.client.setEx(key, ttlSeconds, JSON.stringify(entry));
    } catch (error) {
      console.error('❌ Valkey SET error:', error);
    }
  }

  /**
   * Delete cached value
   */
  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      console.error('❌ Valkey DEL error:', error);
    }
  }

  /**
   * Clear all cached values (use with caution)
   */
  async clear(): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.flushAll();
      console.log('🧹 Valkey cache cleared');
    } catch (error) {
      console.error('❌ Valkey CLEAR error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async info(): Promise<{ connected: boolean; keyCount?: number; memory?: string }> {
    if (!this.client || !this.isConnected) {
      return { connected: false };
    }

    try {
      const keyCount = await this.client.dbSize();
      const info = await this.client.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : 'unknown';

      return {
        connected: true,
        keyCount,
        memory
      };
    } catch (error) {
      console.error('❌ Valkey INFO error:', error);
      return { connected: this.isConnected };
    }
  }

  /**
   * Health check for Valkey connection
   */
  async ping(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('❌ Valkey PING error:', error);
      return false;
    }
  }

  /**
   * Generate cache key for marketplace queries
   */
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

/**
 * Create Valkey service instance from environment variables
 */
export function createValkeyService(): ValkeyCacheService {
  const config: ValkeyConfig = {
    host: process.env.VALKEY_HOST || 'localhost',
    port: parseInt(process.env.VALKEY_PORT || '6379', 10),
    password: process.env.VALKEY_PASSWORD,
    database: parseInt(process.env.VALKEY_DATABASE || '0', 10),
    maxRetries: parseInt(process.env.VALKEY_MAX_RETRIES || '3', 10),
    retryDelayMs: parseInt(process.env.VALKEY_RETRY_DELAY_MS || '1000', 10)
  };

  return new ValkeyCacheService(config);
}

// Global Valkey instance for the application
let globalValkeyService: ValkeyCacheService | null = null;

// Allow mocking in tests
let mockValkeyService: any = null;

/**
 * Get or create global Valkey service instance
 */
export function getValkeyService(): ValkeyCacheService {
  // Return mock service in test environment
  if (mockValkeyService && (process.env.NODE_ENV === 'test' || process.env.VITEST)) {
    return mockValkeyService;
  }
  
  if (!globalValkeyService) {
    globalValkeyService = createValkeyService();
  }
  return globalValkeyService;
}

/**
 * Set mock Valkey service for testing (only in test environment)
 */
export function setMockValkeyService(mock: any): void {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    mockValkeyService = mock;
  }
}

/**
 * Initialize Valkey connection (call this at app startup)
 */
export async function initializeValkey(): Promise<void> {
  const valkey = getValkeyService();
  await valkey.connect();
}

/**
 * Cleanup Valkey connection (call this at app shutdown)
 */
export async function cleanupValkey(): Promise<void> {
  if (globalValkeyService) {
    await globalValkeyService.disconnect();
    globalValkeyService = null;
  }
}