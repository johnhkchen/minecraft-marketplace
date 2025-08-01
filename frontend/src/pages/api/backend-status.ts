/**
 * Backend Status Check Endpoint
 * Proxy to check backend health from frontend
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://backend:3001';
    const response = await fetch(`${backendUrl}/health`, {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      return new Response(JSON.stringify({
        healthy: true,
        backend: data,
        checkedAt: new Date().toISOString(),
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      throw new Error(`Backend returned ${response.status}`);
    }
  } catch (error) {
    return new Response(JSON.stringify({
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      checkedAt: new Date().toISOString(),
    }), {
      status: 200, // Return 200 so frontend can display the error
      headers: { 'Content-Type': 'application/json' },
    });
  }
};