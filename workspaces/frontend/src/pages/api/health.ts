/**
 * Frontend Health Check Endpoint
 * Foundation-first: Docker smoke test validation
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    // Basic health checks
    const checks = {
      status: 'healthy',
      service: 'minecraft-marketplace-frontend',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      checks: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
      }
    };

    return new Response(JSON.stringify(checks, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'unhealthy',
      service: 'minecraft-marketplace-frontend',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, null, 2), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};