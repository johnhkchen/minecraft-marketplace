import { defineConfig } from 'vitest/config';
import { getViteConfig } from 'astro/config';

// Unit test configuration - fast, isolated, no infrastructure
export default defineConfig(
  getViteConfig({
    test: {
      globals: true,
      environment: 'node',
      // NO setupFiles - unit tests handle their own MSW setup
      
      // Fast execution for unit tests
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true
        }
      },
      
      // Unit test patterns only
      include: [
        'tests/unit/**/*.test.ts'
      ],
      exclude: [
        'tests/integration/**',
        'tests/collaboration/**',
        'tests/e2e/**'
      ],
      
      // Fast timeouts for unit tests
      testTimeout: 1000,
      hookTimeout: 5000
    }
  })
);