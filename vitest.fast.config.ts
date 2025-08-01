import { defineConfig } from 'vitest/config';
import { getViteConfig } from 'astro/config';

// Fast test configuration - all tests under 100ms total
export default defineConfig(
  getViteConfig({
    test: {
      globals: true,
      environment: 'node',
      // NO setupFiles - fast tests handle their own MSW setup
      
      // Ultra-fast execution settings
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true
        }
      },
      
      // Fast test patterns only
      include: [
        'tests/unit/**/*.fast.test.ts',
        'tests/unit/temporal-decoupling.test.ts',
        'tests/unit/discord-integration.consolidated.fast.test.ts', 
        'tests/unit/community-reporting.consolidated.fast.test.ts'
      ],
      exclude: [
        'tests/integration/**',
        'tests/collaboration/**',
        'tests/e2e/**',
        'tests/database/**',
        'tests/performance/**'
      ],
      
      // Ultra-fast timeouts for MSW-mocked tests
      testTimeout: 500,   // 500ms max per test
      hookTimeout: 1000   // 1s max for setup/teardown
    }
  })
);