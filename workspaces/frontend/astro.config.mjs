import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
    // Note: Using standalone mode as recommended for Docker deployments
  }),
  integrations: [svelte()],
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '7411')
  },
  vite: {
    resolve: {
      alias: {
        '@shared': '../shared',
        '@backend': '../backend/src',
        '@tests': '../tests'
      }
    }
  }
});