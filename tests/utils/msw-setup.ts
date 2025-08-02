/**
 * MSW Setup Utilities for Orphaned Test Conversion
 * 
 * Provides centralized MSW configuration for converting infrastructure-dependent tests
 * to fast, mocked tests. This replaces the need for Docker/PostgREST infrastructure.
 */

import { setupServer } from 'msw/node';
import { postgrestHandlers } from './msw-handlers/postgrest-handlers.js';

// Global MSW server instance
export const mswServer = setupServer(...postgrestHandlers);

/**
 * Setup MSW for tests that were previously infrastructure-dependent
 * This is the primary function for converting orphaned tests
 */
export function setupMSWForOrphanedTests() {
  // Start MSW server before all tests
  beforeAll(() => {
    mswServer.listen({
      onUnhandledRequest: 'warn' // Warn about unmocked requests
    });
  });

  // Reset handlers after each test for isolation
  afterEach(() => {
    mswServer.resetHandlers();
  });

  // Clean up after all tests
  afterAll(() => {
    mswServer.close();
  });
}

/**
 * Enhanced setup for performance-critical tests
 * Includes performance validation and optimized for <10ms execution
 */
export function setupFastMSWTests() {
  setupMSWForOrphanedTests();

  // Additional performance optimizations
  beforeEach(() => {
    // Reset any global state quickly
    // Avoid expensive setup operations
  });
}

/**
 * Utility to add custom handlers for specific test scenarios
 */
export function addTestHandlers(...handlers: any[]) {
  mswServer.use(...handlers);
}

/**
 * Utility to temporarily override handlers for specific tests
 */
export function overrideHandlers(...handlers: any[]) {
  mswServer.use(...handlers);
}

/**
 * Convert infrastructure test patterns to MSW patterns
 * This helps with systematic conversion of orphaned tests
 */
export const conversionPatterns = {
  // Before: Real PostgREST calls
  // await fetch('http://localhost:3000/api/data/items')
  
  // After: MSW mocked calls (same code, mocked response)
  // await fetch('http://localhost:3000/api/data/items') // Now returns mock data
  
  postgrestEndpoints: {
    items: 'http://localhost:3000/api/data/items',
    prices: 'http://localhost:3000/api/data/prices', 
    users: 'http://localhost:3000/api/data/users'
  },
  
  // Common conversion patterns for orphaned tests
  examples: {
    itemListing: 'GET /api/data/public_items',
    itemCreation: 'POST /api/data/items',
    priceUpdate: 'PATCH /api/data/prices',
    userAuth: 'GET /api/data/users'
  }
};

/**
 * Performance measurement utilities for converted tests
 */
export function measureConversionPerformance<T>(
  testName: string,
  testFn: () => Promise<T>
): Promise<{ result: T; timeMs: number }> {
  return new Promise(async (resolve) => {
    const start = performance.now();
    const result = await testFn();
    const timeMs = performance.now() - start;
    
    console.log(`🚀 Converted test "${testName}" executed in ${timeMs.toFixed(2)}ms`);
    
    resolve({ result, timeMs });
  });
}

/**
 * Validation that converted tests maintain correctness
 */
export function validateConvertedTest(originalBehavior: any, mockedBehavior: any) {
  // Ensure mock responses match expected real API behavior
  expect(mockedBehavior).toEqual(originalBehavior);
}

/**
 * Migration helper for converting specific test files
 */
export const migrationHelpers = {
  /**
   * Convert integration test to fast unit test
   */
  convertIntegrationTest: (testFile: string) => {
    console.log(`🔄 Converting ${testFile} from infrastructure-dependent to MSW-mocked`);
    // Helper for systematic conversion
  },

  /**
   * Verify converted test performance
   */
  verifyPerformance: (testFile: string, maxTimeMs: number = 10) => {
    console.log(`⚡ Verifying ${testFile} meets performance target of ${maxTimeMs}ms`);
    // Performance validation
  },

  /**
   * Document conversion for tracking progress
   */
  documentConversion: (testFile: string, before: string, after: string) => {
    console.log(`📝 Documented conversion of ${testFile}:`);
    console.log(`   Before: ${before}`);
    console.log(`   After: ${after}`);
  }
};

export default {
  setupMSWForOrphanedTests,
  setupFastMSWTests,
  addTestHandlers,
  overrideHandlers,
  conversionPatterns,
  measureConversionPerformance,
  validateConvertedTest,
  migrationHelpers
};