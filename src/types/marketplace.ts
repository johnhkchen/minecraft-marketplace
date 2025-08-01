export interface ShopListing {
  listing_id: number; // Changed to number to match sample SQL
  seller_id: string;
  item_id: string;
  date_created: string; // ISO string for SQLite compatibility
  qty: number;
  price: number; // Price in diamond blocks (can be decimal like 0.625)
  description?: string;
  is_active?: boolean; // For soft deletes
  inventory_unit?: string; // Unit being sold (e.g., "per item", "per shulker", "per stack")
  listing_type?: 'buy' | 'sell'; // Type of listing - buy or sell
  expires_at?: string; // Optional expiration date
  contact_info?: string; // Contact information for the trader
}

export interface Seller {
  seller_id: string;
  seller_name: string;
  stall_id?: string;
  is_online?: boolean;
  last_seen?: string;
}

export interface Item {
  item_id: string;
  item_name: string;
  category?: string;
}

export interface SearchFilters {
  item_name?: string;
  max_price?: number;
  min_qty?: number;
  seller_name?: string;
  is_active?: boolean;
}

export interface Transaction {
  transaction_id: string;
  listing_id: number; // Changed to number to match listings table
  buyer_id: string;
  seller_id: string;
  qty_purchased: number;
  total_price: number;
  change_given: number;
  transaction_date: string;
  status: 'pending' | 'completed' | 'cancelled';
}

// API response types
export interface ListingWithDetails extends ShopListing {
  seller_name?: string;
  stall_id?: string;
  item_name?: string;
  item_category?: string;
  server_name?: string;
  inventory_unit?: string;
  listing_type?: 'buy' | 'sell';
  contact_info?: string;
}

// Market data types
export interface MarketData {
  item_name: string;
  current_sell_low?: number;
  current_sell_high?: number;
  current_buy_high?: number;
  current_buy_low?: number;
  last_trade_price?: number;
  last_trade_date?: string;
  total_sell_volume: number;
  total_buy_interest: number;
  market_activity: 'dead' | 'low' | 'medium' | 'high';
  active_sellers: number;
  active_buyers: number;
  spread_percentage?: number;
}