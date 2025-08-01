import type { APIRoute } from 'astro';
import { MarketplaceDB } from '../../lib/database.js';
import type { ShopListing } from '../../types/marketplace.js';

// Helper functions to prevent test data contamination
function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

function containsTestData(listing: any): boolean {
  const testPatterns = [
    /TEST_/i,
    /faker/i, 
    /clark[_\s]mraz/i,
    /ergonomic.*bike.*marble/i,
    /designed.*with.*marble/i,
    /_\d{13,}_/i, // Timestamp patterns from faker
  ];
  
  const values = [
    listing.seller_id,
    listing.item_id, 
    listing.description,
    listing.seller_name,
    listing.item_name
  ].filter(Boolean);
  
  return values.some(value => 
    testPatterns.some(pattern => pattern.test(String(value)))
  );
}

export const GET: APIRoute = async ({ url }) => {
  let db: MarketplaceDB | null = null;
  
  try {
    console.log('GET /api/listings - Starting request');
    db = new MarketplaceDB();
    console.log('GET /api/listings - Database created successfully');
    
    const searchParams = url.searchParams;
    const is_active = searchParams.get('is_active');
    const item_id = searchParams.get('item_id');
    const seller_id = searchParams.get('seller_id');
    const listing_type = searchParams.get('listing_type'); // 'buy', 'sell', or null for all

    const filters: any = {};
    if (is_active !== null) filters.is_active = is_active === 'true';
    if (item_id) filters.item_id = item_id;
    if (seller_id) filters.seller_id = seller_id;
    if (listing_type) filters.listing_type = listing_type;
    
    console.log('GET /api/listings - Applying filters:', filters);
    const listings = db.getListings(filters);
    console.log('GET /api/listings - Retrieved listings count:', listings.length);
    
    return new Response(JSON.stringify(listings), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('GET /api/listings - Error occurred:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch listings',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } finally {
    if (db) {
      try {
        db.close();
        console.log('GET /api/listings - Database connection closed');
      } catch (closeError) {
        console.error('GET /api/listings - Error closing database:', closeError);
      }
    }
  }
};

export const POST: APIRoute = async ({ request }) => {
  let db: MarketplaceDB | null = null;
  
  try {
    db = new MarketplaceDB();
    const listing = await request.json() as Omit<ShopListing, 'listing_id' | 'date_created'>;
    console.log('POST /api/listings - Received listing_type:', (listing as any).listing_type);
    
    // Protect against test data contamination in production
    if (!isTestEnvironment() && containsTestData(listing)) {
      return new Response(JSON.stringify({ error: 'Test data not allowed in production' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Generate unique listing ID (integer)
    const listing_id = Date.now(); // Use timestamp as integer ID
    
    // Ensure seller and item exist, create if needed
    const seller_name = (listing as any).seller_name || listing.seller_id;
    const stall_id = (listing as any).stall_id || null;
    db.createSeller({
      seller_id: listing.seller_id,
      seller_name: seller_name,
      stall_id: stall_id,
      is_online: true
    });

    const item_name = (listing as any).item_name || listing.item_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    db.createItem({
      item_id: listing.item_id,
      item_name: item_name,
      category: 'general'
    });

    const newListing: ShopListing = {
      ...listing,
      listing_id,
      date_created: new Date().toISOString(),
      is_active: true,
      listing_type: (listing as any).listing_type || 'sell',
      contact_info: (listing as any).contact_info || null
    };

    db.createListing(newListing);
    
    const createdListing = db.getListing(listing_id);
    
    return new Response(JSON.stringify(createdListing), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    return new Response(JSON.stringify({ error: 'Failed to create listing' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } finally {
    if (db) {
      db.close();
    }
  }
};