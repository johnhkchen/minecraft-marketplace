/**
 * Performance Testing Utilities
 * 
 * Provides functional programming patterns for performance testing
 * with English-language-like test descriptions and Epic 1 requirements validation.
 */

import { expect } from 'vitest';
import '../matchers/business-matchers.js';

export interface PerformanceResult<T> {
  result: T;
  timeMs: number;
  success: boolean;
  error?: Error;
}

export interface ConcurrentPerformanceResult<T> {
  results: T[];
  totalTimeMs: number;
  averageTimeMs: number;
  maxTimeMs: number;
  minTimeMs: number;
  successCount: number;
  failureCount: number;
  errors: Error[];
}

/**
 * Performance testing utilities with functional programming patterns
 */
export const performanceTesting = {
  /**
   * Measures execution time of an async operation
   * 
   * @example
   * const { result, timeMs } = await performanceTesting.measureTime(
   *   () => apiService.searchItems('Diamond')
   * );
   */
  measureTime: async <T>(operation: () => Promise<T>): Promise<PerformanceResult<T>> => {
    const start = performance.now();
    try {
      const result = await operation();
      const timeMs = performance.now() - start;
      return { result, timeMs, success: true };
    } catch (error) {
      const timeMs = performance.now() - start;
      return { 
        result: undefined as any, 
        timeMs, 
        success: false, 
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  },

  /**
   * Runs operations concurrently and measures total and individual performance
   * 
   * @example
   * const operations = searchTerms.map(term => () => apiService.searchItems(term));
   * const stats = await performanceTesting.measureConcurrent(operations);
   */
  measureConcurrent: async <T>(operations: Array<() => Promise<T>>): Promise<ConcurrentPerformanceResult<T>> => {
    const start = performance.now();
    
    const results = await Promise.allSettled(operations.map(op => performanceTesting.measureTime(op)));
    const totalTimeMs = performance.now() - start;
    
    const successful = results
      .filter((r): r is PromiseFulfilledResult<PerformanceResult<T>> => r.status === 'fulfilled' && r.value.success)
      .map(r => r.value);
    
    const failed = results
      .filter((r): r is PromiseFulfilledResult<PerformanceResult<T>> => r.status === 'fulfilled' && !r.value.success)
      .map(r => r.value.error!)
      .concat(
        results
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map(r => r.reason instanceof Error ? r.reason : new Error(String(r.reason)))
      );
    
    const individualTimes = successful.map(r => r.timeMs);
    
    return {
      results: successful.map(r => r.result),
      totalTimeMs,
      averageTimeMs: individualTimes.length > 0 ? individualTimes.reduce((a, b) => a + b, 0) / individualTimes.length : 0,
      maxTimeMs: individualTimes.length > 0 ? Math.max(...individualTimes) : 0,
      minTimeMs: individualTimes.length > 0 ? Math.min(...individualTimes) : 0,
      successCount: successful.length,
      failureCount: failed.length,
      errors: failed
    };
  },

  /**
   * Creates search terms for performance testing
   * 
   * @example
   * const terms = performanceTesting.createSearchTerms(10, ['Diamond', 'Iron', 'Gold']);
   */
  createSearchTerms: (count: number, baseTerms: string[] = ['Diamond', 'Iron', 'Block', 'Sword', 'Pickaxe']): string[] =>
    Array.from({ length: count }, (_, i) => baseTerms[i % baseTerms.length]),

  /**
   * Creates large datasets for performance testing
   * 
   * @example
   * const items = performanceTesting.createLargeDataset(1000, () => ItemBuilder.create().build());
   */
  createLargeDataset: <T>(count: number, itemFactory: (index: number) => T): T[] =>
    Array.from({ length: count }, (_, i) => itemFactory(i)),

  /**
   * Validates Epic 1 performance requirements
   */
  validateEpic1Requirements: {
    /**
     * Validates search performance requirement: <2s response time
     */
    searchPerformance: (timeMs: number, operationName: string = 'search') => {
      expect(timeMs).toBeWithinPerformanceTarget(2000);
      console.log(`✅ ${operationName} completed in ${timeMs.toFixed(2)}ms (Epic 1 requirement: <2000ms)`);
    },

    /**
     * Validates filtering performance requirement: <500ms response time
     */
    filterPerformance: (timeMs: number, operationName: string = 'filter') => {
      expect(timeMs).toBeWithinPerformanceTarget(500);
      console.log(`✅ ${operationName} completed in ${timeMs.toFixed(2)}ms (Epic 1 requirement: <500ms)`);
    },

    /**
     * Validates API performance requirement: <200ms response time
     */
    apiPerformance: (timeMs: number, operationName: string = 'API call') => {
      expect(timeMs).toBeWithinPerformanceTarget(200);
      console.log(`✅ ${operationName} completed in ${timeMs.toFixed(2)}ms (Epic 1 requirement: <200ms)`);
    }
  },

  /**
   * Validates all results meet criteria with readable output
   */
  expectAllResults: <T>(
    results: T[], 
    validator: (result: T) => boolean, 
    description: string
  ) => {
    const validResults = results.filter(validator);
    const allValid = validResults.length === results.length;
    
    expect(allValid).toBe(true);
    
    if (allValid) {
      console.log(`✅ All ${results.length} results ${description}`);
    } else {
      console.error(`❌ Only ${validResults.length}/${results.length} results ${description}`);
    }
    
    return allValid;
  },

  /**
   * Stress tests an operation with increasing load
   * 
   * @example
   * const stressResults = await performanceTesting.stressTest(
   *   'search operation',
   *   () => apiService.searchItems('Diamond'),
   *   [1, 5, 10, 20],
   *   2000
   * );
   */
  stressTest: async <T>(
    operationName: string,
    operation: () => Promise<T>,
    concurrencyLevels: number[],
    maxTimeMs: number
  ): Promise<Array<{ concurrency: number; stats: ConcurrentPerformanceResult<T>; passed: boolean }>> => {
    const results = [];
    
    for (const concurrency of concurrencyLevels) {
      console.log(`🔄 Testing ${operationName} with ${concurrency} concurrent requests...`);
      
      const operations = Array(concurrency).fill(null).map(() => operation);
      const stats = await performanceTesting.measureConcurrent(operations);
      const passed = stats.totalTimeMs < maxTimeMs && stats.failureCount === 0;
      
      results.push({ concurrency, stats, passed });
      
      if (passed) {
        console.log(`✅ ${concurrency} concurrent requests completed in ${stats.totalTimeMs.toFixed(2)}ms`);
      } else {
        console.log(`❌ ${concurrency} concurrent requests failed (${stats.totalTimeMs.toFixed(2)}ms, ${stats.failureCount} failures)`);
      }
    }
    
    return results;
  }
};

/**
 * Higher-order function for creating performance test cases
 */
export function createPerformanceTest<T>(
  testName: string,
  operation: () => Promise<T>,
  maxTimeMs: number,
  resultValidator?: (result: T) => void
) {
  return {
    name: `should ${testName} within ${maxTimeMs}ms (Epic 1 requirement)`,
    test: async () => {
      const { result, timeMs, success, error } = await performanceTesting.measureTime(operation);
      
      if (!success) {
        throw error;
      }
      
      expect(timeMs).toBeWithinPerformanceTarget(maxTimeMs);
      
      if (resultValidator) {
        resultValidator(result);
      }
      
      console.log(`✅ ${testName} completed in ${timeMs.toFixed(2)}ms`);
      
      return { result, timeMs };
    }
  };
}

/**
 * Higher-order function for creating concurrent performance test cases
 */
export function createConcurrentPerformanceTest<T>(
  testName: string,
  operationFactory: () => Array<() => Promise<T>>,
  maxTotalTimeMs: number,
  resultValidator?: (results: T[]) => void
) {
  return {
    name: `should handle concurrent ${testName} within ${maxTotalTimeMs}ms`,
    test: async () => {
      const operations = operationFactory();
      const stats = await performanceTesting.measureConcurrent(operations);
      
      expect(stats.failureCount).toBe(0);
      expect(stats.totalTimeMs).toBeWithinPerformanceTarget(maxTotalTimeMs);
      
      if (resultValidator) {
        resultValidator(stats.results);
      }
      
      console.log(`✅ ${operations.length} concurrent ${testName} completed in ${stats.totalTimeMs.toFixed(2)}ms`);
      console.log(`   Average: ${stats.averageTimeMs.toFixed(2)}ms, Min: ${stats.minTimeMs.toFixed(2)}ms, Max: ${stats.maxTimeMs.toFixed(2)}ms`);
      
      return stats;
    }
  };
}

/**
 * Epic 1 performance test suite factory
 */
export function createEpic1PerformanceTests<T>(
  serviceFactory: () => T,
  operations: {
    search: (service: T) => (query: string) => Promise<any>;
    filter: (service: T) => (filters: any) => Promise<any>;
    api: (service: T) => () => Promise<any>;
  }
) {
  return {
    searchPerformance: createPerformanceTest(
      'complete item search',
      () => operations.search(serviceFactory())('Diamond'),
      2000,
      (results) => {
        expect(results).toHaveSearchResults();
        expect(results).toContainMinecraftItem('Diamond');
      }
    ),

    filterPerformance: createPerformanceTest(
      'filter available items',
      () => operations.filter(serviceFactory())({ category: 'weapons', isAvailable: true }),
      500,
      (results) => {
        expect(results).toHaveSearchResults();
        performanceTesting.expectAllResults(results, (item: any) => item.category === 'weapons', 'are weapons');
        performanceTesting.expectAllResults(results, (item: any) => item.isAvailable === true, 'are available');
      }
    ),

    apiPerformance: createPerformanceTest(
      'API endpoint response',
      () => operations.api(serviceFactory())(),
      200,
      (response) => {
        expect(response).toBeDefined();
      }
    ),

    concurrentSearchPerformance: createConcurrentPerformanceTest(
      'searches',
      () => performanceTesting.createSearchTerms(5).map(term => () => operations.search(serviceFactory())(term)),
      2000,
      (results) => {
        performanceTesting.expectAllResults(results, Array.isArray, 'returned arrays');
      }
    )
  };
}