import type { APIRoute } from 'astro';
import { MarketplaceDB } from '../../lib/database.js';
import type { Transaction } from '../../types/marketplace.js';

export const GET: APIRoute = async ({ url }) => {
  let db: MarketplaceDB | null = null;
  
  try {
    db = new MarketplaceDB();
    const searchParams = url.searchParams;
    const seller_id = searchParams.get('seller_id');
    const buyer_id = searchParams.get('buyer_id');
    const status = searchParams.get('status');

    const filters: any = {};
    if (seller_id) filters.seller_id = seller_id;
    if (buyer_id) filters.buyer_id = buyer_id;
    if (status) filters.status = status;

    const transactions = db.getTransactions(filters);
    
    return new Response(JSON.stringify(transactions), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch transactions' }), {
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

export const POST: APIRoute = async ({ request }) => {
  let db: MarketplaceDB | null = null;
  
  try {
    db = new MarketplaceDB();
    const transactionData = await request.json() as Omit<Transaction, 'transaction_id' | 'transaction_date'>;
    
    // Generate unique transaction ID
    const transaction_id = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const transaction: Transaction = {
      ...transactionData,
      transaction_id,
      transaction_date: new Date().toISOString()
    };

    db.createTransaction(transaction);
    
    return new Response(JSON.stringify(transaction), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return new Response(JSON.stringify({ error: 'Failed to create transaction' }), {
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