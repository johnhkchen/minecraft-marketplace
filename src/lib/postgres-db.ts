// PostgreSQL database service for Minecraft Marketplace
// Replaces SQLite implementation with PostgreSQL following 000_consolidated_specification.md
// Uses existing MarketplaceDB functionality as reference

import { Pool, Client } from 'pg';
import type { 
  Item, ItemPrice, PublicItem, PrivateItem, 
  UserSession, UserRole, CurrencyUnit, ItemCategory,
  TradeHistory, MarketData, MarketReference, MarketActivity,
  CommunityReport, ReportType, ReportStatus
} from '@/types';

export class PostgresDB {
  private pool: Pool;
  private isTest: boolean;

  constructor(connectionString?: string) {
    this.isTest = process.env.NODE_ENV === 'test';
    
    // Use provided connection string or environment variable
    const dbUrl = connectionString || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Create connection pool
    this.pool = new Pool({
      connectionString: dbUrl,
      max: this.isTest ? 5 : 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection on startup (don't await to avoid blocking constructor)
    this.testConnection().catch(() => {
      // Silently catch errors in test environment to prevent unhandled rejections
      // Actual connection errors will be caught when queries are attempted
    });
  }

  private async testConnection() {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      // Only log success in non-test environments
      if (!this.isTest) {
        console.log('✅ PostgreSQL connection established successfully');
      }
    } catch (error) {
      // Only log errors in non-test environments to avoid test pollution
      if (!this.isTest) {
        console.error('❌ PostgreSQL connection failed:', error);
      }
      throw error;
    }
  }

  async close() {
    await this.pool.end();
  }

  // =============================================================================
  // USER OPERATIONS
  // =============================================================================

  async createUser(user: {
    username: string;
    email: string;
    password_hash: string;
    shop_name?: string;
    discord_contact?: string;
    role?: UserRole;
  }) {
    const query = `
      INSERT INTO users (username, email, password_hash, shop_name, discord_contact, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await this.pool.query(query, [
      user.username,
      user.email, 
      user.password_hash,
      user.shop_name || null,
      user.discord_contact || null,
      user.role || 'user'
    ]);
    
    return result.rows[0];
  }

  async getUserByEmail(email: string) {
    const query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
    const result = await this.pool.query(query, [email]);
    return result.rows[0] || null;
  }

  async getUserById(id: number) {
    const query = 'SELECT * FROM users WHERE id = $1 AND is_active = true';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // =============================================================================
  // ITEM OPERATIONS (following existing MarketplaceDB patterns)
  // =============================================================================

  async createItem(item: {
    name: string;
    description?: string;
    category: ItemCategory;
    stock_quantity: number;
    user_id: number;
    price: {
      amount: number;
      currency_unit: CurrencyUnit;
      diamond_equivalent: number;
      notes?: string;
    };
  }): Promise<PrivateItem> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert item
      const itemQuery = `
        INSERT INTO items (name, description, category, stock_quantity, user_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const itemResult = await client.query(itemQuery, [
        item.name,
        item.description || null,
        item.category,
        item.stock_quantity,
        item.user_id
      ]);
      
      const newItem = itemResult.rows[0];
      
      // Insert price
      const priceQuery = `
        INSERT INTO item_prices (item_id, amount, currency_unit, diamond_equivalent, notes, is_current)
        VALUES ($1, $2, $3, $4, $5, true)
      `;
      
      await client.query(priceQuery, [
        newItem.id,
        item.price.amount,
        item.price.currency_unit,
        item.price.diamond_equivalent,
        item.price.notes || null
      ]);
      
      await client.query('COMMIT');
      return newItem;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getItems(filters?: {
    category?: ItemCategory;
    search?: string;
    available_only?: boolean;
    user_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<PublicItem[]> {
    let query = `
      SELECT 
        i.*,
        u.username as seller_name,
        u.shop_name,
        ip.amount as current_price_amount,
        ip.currency_unit as current_price_unit,
        ip.diamond_equivalent as current_price_diamonds
      FROM items i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN item_prices ip ON i.id = ip.item_id AND ip.is_current = true
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 0;
    
    if (filters?.category) {
      query += ` AND i.category = $${++paramCount}`;
      params.push(filters.category);
    }
    
    if (filters?.search) {
      query += ` AND (i.name ILIKE $${++paramCount} OR i.description ILIKE $${++paramCount})`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
      paramCount++; // Account for two parameters
    }
    
    if (filters?.available_only) {
      query += ` AND i.is_available = true AND i.stock_quantity > 0`;
    }
    
    if (filters?.user_id) {
      query += ` AND i.user_id = $${++paramCount}`;
      params.push(filters.user_id);
    }
    
    query += ` ORDER BY i.created_at DESC`;
    
    if (filters?.limit) {
      query += ` LIMIT $${++paramCount}`;
      params.push(filters.limit);
    }
    
    if (filters?.offset) {
      query += ` OFFSET $${++paramCount}`;
      params.push(filters.offset);
    }
    
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getItem(id: number): Promise<PublicItem | null> {
    const query = `
      SELECT 
        i.*,
        u.username as seller_name,
        u.shop_name,
        ip.amount as current_price_amount,
        ip.currency_unit as current_price_unit,
        ip.diamond_equivalent as current_price_diamonds
      FROM items i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN item_prices ip ON i.id = ip.item_id AND ip.is_current = true
      WHERE i.id = $1
    `;
    
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // =============================================================================
  // MARKET DATA OPERATIONS (from existing codebase)
  // =============================================================================

  async getMarketData(itemId: number): Promise<MarketData | null> {
    const query = `
      SELECT 
        i.name as item_name,
        mr.current_sell_low,
        mr.current_sell_high,
        mr.current_buy_high,
        mr.current_buy_low,
        mr.last_trade_price,
        mr.last_trade_date,
        mr.total_sell_volume,
        mr.total_buy_interest,
        mr.market_activity,
        mr.active_sellers,
        mr.active_buyers,
        mr.spread_percentage
      FROM items i
      LEFT JOIN market_references mr ON i.id = mr.item_id
      WHERE i.id = $1
    `;
    
    const result = await this.pool.query(query, [itemId]);
    return result.rows[0] || null;
  }

  async getMarketOverview(): Promise<MarketData[]> {
    const query = `
      SELECT 
        i.name as item_name,
        mr.current_sell_low,
        mr.current_sell_high,
        mr.current_buy_high,
        mr.current_buy_low,
        mr.last_trade_price,
        mr.last_trade_date,
        mr.total_sell_volume,
        mr.total_buy_interest,
        mr.market_activity,
        mr.active_sellers,
        mr.active_buyers,
        mr.spread_percentage
      FROM items i
      JOIN market_references mr ON i.id = mr.item_id
      WHERE mr.market_activity != 'dead'
      ORDER BY 
        CASE mr.market_activity
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
          ELSE 4
        END,
        (mr.active_sellers + mr.active_buyers) DESC
    `;
    
    const result = await this.pool.query(query);
    return result.rows;
  }

  async recordTrade(trade: {
    item_id: number;
    buyer_id?: number;
    seller_id?: number;
    qty_traded: number;
    price_per_unit: number;
    currency_unit: CurrencyUnit;
    total_value: number;
    diamond_equivalent_total: number;
    trade_source?: string;
    notes?: string;
  }) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert trade history
      const tradeQuery = `
        INSERT INTO trade_history (
          item_id, buyer_id, seller_id, qty_traded, 
          price_per_unit, currency_unit, total_value, 
          diamond_equivalent_total, trade_source, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const result = await client.query(tradeQuery, [
        trade.item_id,
        trade.buyer_id || null,
        trade.seller_id || null,
        trade.qty_traded,
        trade.price_per_unit,
        trade.currency_unit,
        trade.total_value,
        trade.diamond_equivalent_total,
        trade.trade_source || 'marketplace',
        trade.notes || null
      ]);
      
      // Update market references
      await this.updateMarketReferences(client, trade.item_id);
      
      await client.query('COMMIT');
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async updateMarketReferences(client: any, itemId: number) {
    // Update market reference data based on current item prices and recent trades
    const updateQuery = `
      INSERT INTO market_references (
        item_id, 
        current_sell_low, current_sell_high,
        current_buy_high, current_buy_low,
        last_trade_price, last_trade_date,
        total_sell_volume, total_buy_interest,
        market_activity, active_sellers, active_buyers,
        last_updated
      )
      SELECT 
        $1,
        MIN(CASE WHEN ip.diamond_equivalent > 0 THEN ip.diamond_equivalent END),
        MAX(CASE WHEN ip.diamond_equivalent > 0 THEN ip.diamond_equivalent END),
        MAX(CASE WHEN ip.diamond_equivalent > 0 THEN ip.diamond_equivalent END),
        MIN(CASE WHEN ip.diamond_equivalent > 0 THEN ip.diamond_equivalent END),
        MAX(th.last_price),
        MAX(th.last_date),
        COALESCE(SUM(i.stock_quantity), 0),
        COALESCE(COUNT(DISTINCT i.user_id), 0),
        CASE 
          WHEN COUNT(ip.id) >= 5 THEN 'high'::market_activity
          WHEN COUNT(ip.id) >= 3 THEN 'medium'::market_activity
          WHEN COUNT(ip.id) >= 1 THEN 'low'::market_activity
          ELSE 'dead'::market_activity
        END,
        COUNT(DISTINCT i.user_id),
        COUNT(DISTINCT i.user_id),
        CURRENT_TIMESTAMP
      FROM items i
      LEFT JOIN item_prices ip ON i.id = ip.item_id AND ip.is_current = true
      LEFT JOIN (
        SELECT 
          item_id,
          diamond_equivalent_total / qty_traded as last_price,
          created_at as last_date
        FROM trade_history 
        WHERE item_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      ) th ON i.id = th.item_id
      WHERE i.id = $1
      GROUP BY i.id
      ON CONFLICT (item_id) DO UPDATE SET
        current_sell_low = EXCLUDED.current_sell_low,
        current_sell_high = EXCLUDED.current_sell_high,
        current_buy_high = EXCLUDED.current_buy_high,
        current_buy_low = EXCLUDED.current_buy_low,
        last_trade_price = EXCLUDED.last_trade_price,
        last_trade_date = EXCLUDED.last_trade_date,
        total_sell_volume = EXCLUDED.total_sell_volume,
        total_buy_interest = EXCLUDED.total_buy_interest,
        market_activity = EXCLUDED.market_activity,
        active_sellers = EXCLUDED.active_sellers,
        active_buyers = EXCLUDED.active_buyers,
        last_updated = EXCLUDED.last_updated
    `;
    
    await client.query(updateQuery, [itemId]);
  }

  // =============================================================================
  // SEARCH OPERATIONS
  // =============================================================================

  async searchItems(query: string, limit: number = 20): Promise<PublicItem[]> {
    const searchQuery = `
      SELECT 
        i.*,
        u.username as seller_name,
        u.shop_name,
        ip.amount as current_price_amount,
        ip.currency_unit as current_price_unit,
        ip.diamond_equivalent as current_price_diamonds,
        ts_rank(to_tsvector('english', i.name || ' ' || COALESCE(i.description, '')), plainto_tsquery('english', $1)) as rank
      FROM items i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN item_prices ip ON i.id = ip.item_id AND ip.is_current = true
      WHERE 
        i.is_available = true 
        AND to_tsvector('english', i.name || ' ' || COALESCE(i.description, '')) @@ plainto_tsquery('english', $1)
      ORDER BY rank DESC, i.created_at DESC
      LIMIT $2
    `;
    
    const result = await this.pool.query(searchQuery, [query, limit]);
    return result.rows;
  }
}