/**
 * Backend Build Script
 * Prepares the Hono application for production
 */

import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildBackend(): Promise<void> {
  console.log('🔨 Building Minecraft Marketplace Backend...');

  try {
    await build({
      entryPoints: [join(__dirname, 'index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node22',
      outfile: join(__dirname, '../dist/index.js'),
      format: 'esm',
      external: [
        // Keep Node.js built-ins external
        'fs', 'path', 'url', 'util', 'crypto', 'stream', 'buffer',
        // Keep large dependencies external (they should be in node_modules)
        'pg', 'valkey',
      ],
      minify: process.env.NODE_ENV === 'production',
      sourcemap: true,
      logLevel: 'info',
    });

    // Create package.json for the built app
    const packageJson = {
      type: 'module',
      main: 'index.js',
      engines: {
        node: '>=22.0.0'
      }
    };

    writeFileSync(
      join(__dirname, '../dist/package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    console.log('✅ Backend build completed successfully');
  } catch (error) {
    console.error('❌ Backend build failed:', error);
    process.exit(1);
  }
}

buildBackend();