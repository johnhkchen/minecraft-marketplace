// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import svelte from '@astrojs/svelte';

// Minecraft Marketplace - Astro v5.x with Node.js adapter for SSR + API routes
// Following 000_consolidated_specification.md architecture decisions
export default defineConfig({
  // Integrations: Svelte for existing components + Node.js for SSR
  integrations: [svelte()],
  
  // SSR + API routes for unified backend/frontend
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  
  // TypeScript configuration (moved to tsconfig.json)
  
  // Development server configuration
  server: {
    port: 3000,
    host: true // Allows Docker container access
  }
});
