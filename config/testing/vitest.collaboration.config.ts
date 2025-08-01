import { defineConfig } from 'vitest/config';
import { getViteConfig } from 'astro/config';

// Collaboration test configuration - static validation tests
export default defineConfig(
  getViteConfig({
    test: {
      globals: true,
      environment: 'node',
      // No setup files - collaboration tests are static file validation
      
      // Standard timeouts for file operations
      testTimeout: 30000, // 30 seconds
      hookTimeout: 60000, // 1 minute
      
      // Include collaboration tests
      include: [
        'tests/collaboration/**/*.test.ts'
      ],
      exclude: [
        'node_modules/**',
        'dist/**',
        '.astro/**',
        'tmp/**'
      ]
    }
  })
);