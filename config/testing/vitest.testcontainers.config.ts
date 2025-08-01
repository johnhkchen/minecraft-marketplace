import { defineConfig } from 'vitest/config';

export default defineConfig({  
  test: {
    name: 'testcontainers',
    env: {
      VITEST_CONFIG_NAME: 'testcontainers'
    },
    include: ['tests/integration/**/*.testcontainers.test.ts'],
    testTimeout: 10000, // 10 seconds max per test - fail fast
    hookTimeout: 15000, // 15 seconds max for setup - fail fast
    maxConcurrency: 1, // Run testcontainer tests sequentially to avoid port conflicts
    reporters: ['verbose'],
    environment: 'node',
  },
  esbuild: {
    target: 'node18'
  }
});