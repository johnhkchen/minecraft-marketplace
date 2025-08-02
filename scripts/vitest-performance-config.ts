#!/usr/bin/env tsx

/**
 * Vitest Performance Configuration Generator
 * 
 * Creates an optimized Vitest config for identifying slow tests using
 * Vitest's built-in profiling and performance analysis capabilities.
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

const performanceConfig = `
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Enable performance profiling
    slowTestThreshold: 100, // Lower threshold to catch more slow tests
    
    // Use verbose reporter to get individual test timings
    reporter: ['verbose', 'json'],
    
    // Output detailed performance information
    outputFile: {
      json: './test-results/performance-report.json'
    },
    
    // Disable isolation for faster execution during profiling
    isolate: false,
    
    // Use threads pool for better performance analysis
    pool: 'threads',
    poolOptions: {
      threads: {
        // Enable CPU profiling for test runner processes
        execArgv: [
          '--cpu-prof',
          '--cpu-prof-dir=test-performance-profiles',
        ],
        
        // Use single thread for consistent profiling
        singleThread: true,
      },
    },
    
    // Include all test patterns for comprehensive analysis
    include: [
      'tests/unit/**/*.{test,spec}.ts',
      'tests/unit/**/*.fast.{test,spec}.ts',
    ],
    
    // Environment setup for MSW mocking
    environment: 'node',
    setupFiles: ['./config/testing/setup-msw.ts'],
    
    // Performance-focused configuration
    testTimeout: 10000, // 10s timeout to catch hanging tests
    hookTimeout: 5000,  // 5s hook timeout
    
    // Generate coverage for performance analysis
    coverage: {
      enabled: true,
      reporter: ['text', 'json'],
      provider: 'v8'
    }
  }
});
`;

// Write the performance config
const configPath = join(process.cwd(), 'vitest.performance.config.ts');
writeFileSync(configPath, performanceConfig.trim());

console.log('✅ Created vitest.performance.config.ts');
console.log('');
console.log('🚀 Usage:');
console.log('   npx vitest run --config vitest.performance.config.ts');
console.log('');
console.log('📊 This will generate:');
console.log('   • ./test-results/performance-report.json - Detailed test timings');
console.log('   • ./test-performance-profiles/ - CPU profiles for analysis');
console.log('   • Console output with slow test identification');
console.log('');
console.log('🔍 Analyze results with:');
console.log('   node --inspect-brk ./test-performance-profiles/*.cpuprofile');