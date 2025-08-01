import type { APIRoute } from 'astro';
import { PostgresDB } from '../../lib/postgres-db.js';

export const GET: APIRoute = async ({ url }) => {
  let db: PostgresDB | null = null;
  
  try {
    db = new PostgresDB();
    const searchParams = url.searchParams;
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const available_only = searchParams.get('available_only') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (query) {
      // Use PostgreSQL full-text search
      const items = await db.searchItems(query, limit);
      return new Response(JSON.stringify(items), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      // Get items with filters
      const items = await db.getItems({
        category: category as any,
        available_only,
        limit,
        offset
      });
      return new Response(JSON.stringify(items), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching items:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch items' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } finally {
    if (db) {
      await db.close();
    }
  }
};