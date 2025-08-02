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