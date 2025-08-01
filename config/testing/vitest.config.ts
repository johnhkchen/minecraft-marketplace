import { defineConfig } from 'vitest/config';
import { getViteConfig } from 'astro/config';

// Vitest configuration following 000_consolidated_specification.md testing strategy
export default defineConfig(
  getViteConfig({
    test: {
      globals: true,
      environment: 'node', // For API and database tests (not jsdom)
      setupFiles: ['../../tests/setup.ts'],
      // globalTeardown: './tests/setup/global-teardown.ts', // Not supported in current vitest version
      
      // Test database isolation - each test gets clean PostgreSQL state
      pool: 'forks', // Changed from threads to forks for better isolation
      poolOptions: {
        forks: {
          singleFork: true // Prevents database connection conflicts
        }
      },
      
      // Coverage configuration with >80% targets
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        thresholds: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
          }
        },
        exclude: [
          'tests/**',
          'database/migrations/**',
          '**/*.d.ts',
          'tmp/**',
          'dist/**',
          '.astro/**',
          'node_modules/**',
          'scripts/**'
        ]
      },
      
      // Test timeouts for database operations
      testTimeout: 10000, // 10 seconds for integration tests
      hookTimeout: 30000, // 30 seconds for setup/teardown
      
      // File patterns following organized test structure
      include: [
        '../../tests/unit/**/*.test.ts',
        '../../tests/integration/**/*.test.ts',
        '../../tests/security/**/*.test.ts',
        '../../tests/performance/**/*.test.ts'
        // NOTE: tests/collaboration/ excluded from regular runs (requires Docker)
        // Use npm run test:collaboration to run these heavy tests
      ],
      exclude: [
        'node_modules/**',
        'dist/**',
        '.astro/**',
        'tmp/**'
      ]
    },
    
    // Resolve configuration for monorepo path mapping
    resolve: {
      alias: {
        '@shared': '../../workspaces/shared',
        '@frontend': '../../workspaces/frontend/src',
        '@backend': '../../workspaces/backend/src',
        '@tests': '../../tests'
      }
    }
  })
);