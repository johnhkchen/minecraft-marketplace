/**
 * Minecraft Marketplace Backend
 * Hono server for external integrations and heavy processing
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:7411',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check endpoint
app.get('/health', (c) => {
  const health = {
    status: 'healthy',
    service: 'minecraft-marketplace-backend',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
    },
  };

  return c.json(health);
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Minecraft Marketplace Backend API',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      docs: '/docs',
      webhooks: '/api/v1/webhooks',
      baml: '/api/v1/baml',
    },
  });
});

// API v1 routes
const api = new Hono();

// Webhook endpoints (Discord, etc.)
api.get('/webhooks/discord', (c) => {
  return c.json({ message: 'Discord webhook endpoint ready' });
});

// BAML processing endpoints
api.get('/baml/status', (c) => {
  return c.json({ 
    message: 'BAML processing endpoint ready',
    apiKey: process.env.BAML_API_KEY ? 'configured' : 'missing',
  });
});

app.route('/api/v1', api);

// 404 handler
app.notFound((c) => {
  return c.json({ 
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    timestamp: new Date().toISOString(),
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Backend error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
  }, 500);
});

const port = parseInt(process.env.PORT || process.env.HONO_PORT || '7412');

console.log(`🚀 Minecraft Marketplace Backend starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`✅ Backend server running at http://localhost:${info.port}`);
});

export default app;