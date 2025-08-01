import type { APIRoute } from 'astro';
import { PostgresDB } from '../../lib/postgres-db.js';

export const GET: APIRoute = async ({ url }) => {
  let db: PostgresDB | null = null;
  
  try {
    console.log('GET /api/market-data - Starting request');
    db = new PostgresDB();
    
    const searchParams = url.searchParams;
    const item_id = searchParams.get('item_id');
    
    if (item_id) {
      // Validate item_id is a valid number
      const itemIdNum = parseInt(item_id);
      if (isNaN(itemIdNum)) {
        return new Response(JSON.stringify({ error: 'Invalid item_id parameter' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Get market data for specific item
      const marketData = await db.getMarketData(itemIdNum);
      return new Response(JSON.stringify(marketData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Get market overview for all items
      const marketOverview = await db.getMarketOverview();
      return new Response(JSON.stringify(marketOverview), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('GET /api/market-data - Error occurred:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch market data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    if (db) {
      try {
        await db.close();
        console.log('GET /api/market-data - Database connection closed');
      } catch (closeError) {
        console.error('GET /api/market-data - Error closing database:', closeError);
      }
    }
  }
};