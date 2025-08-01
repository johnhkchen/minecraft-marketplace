/**
 * PostgreSQL Price Repository Implementation
 * Foundation-first: Implements the PriceRepository interface
 */

import { 
  Price, 
  PriceRepository, 
  TradingUnitType 
} from '@shared/types/service-interfaces';
import { DatabaseConnection } from './postgresql-item-repository';

export class PostgreSQLPriceRepository implements PriceRepository {
  constructor(private db: DatabaseConnection) {}

  async save(price: Price): Promise<Price> {
    const sql = `
      INSERT INTO prices (
        id, item_id, price_diamond_blocks, trading_unit, 
        is_current, source, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      ) RETURNING *
    `;
    
    const params = [
      price.id,
      price.itemId,
      price.priceDiamonds,
      price.tradingUnit,
      price.isCurrent,
      price.source,
      price.createdBy
    ];

    const result = await this.db.queryOne(sql, params);
    return this.mapRowToPrice(result);
  }

  async findById(id: string): Promise<Price | null> {
    const sql = 'SELECT * FROM prices WHERE id = $1';
    const result = await this.db.queryOne(sql, [id]);
    return result ? this.mapRowToPrice(result) : null;
  }

  async findAll(criteria?: Partial<Price>): Promise<Price[]> {
    let sql = 'SELECT * FROM prices WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (criteria?.itemId) {
      sql += ` AND item_id = $${paramIndex++}`;
      params.push(criteria.itemId);
    }

    if (criteria?.isCurrent !== undefined) {
      sql += ` AND is_current = $${paramIndex++}`;
      params.push(criteria.isCurrent);
    }

    if (criteria?.tradingUnit) {
      sql += ` AND trading_unit = $${paramIndex++}`;
      params.push(criteria.tradingUnit);
    }

    if (criteria?.createdBy) {
      sql += ` AND created_by = $${paramIndex++}`;
      params.push(criteria.createdBy);
    }

    sql += ' ORDER BY created_at DESC';
    
    const results = await this.db.query(sql, params);
    return results.map(row => this.mapRowToPrice(row));
  }

  async update(id: string, updates: Partial<Price>): Promise<Price> {
    const setParts: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updates.priceDiamonds !== undefined) {
      setParts.push(`price_diamond_blocks = $${paramIndex++}`);
      params.push(updates.priceDiamonds);
    }

    if (updates.tradingUnit !== undefined) {
      setParts.push(`trading_unit = $${paramIndex++}`);
      params.push(updates.tradingUnit);
    }

    if (updates.isCurrent !== undefined) {
      setParts.push(`is_current = $${paramIndex++}`);
      params.push(updates.isCurrent);
    }

    if (setParts.length === 0) {
      throw new Error('No valid updates provided');
    }

    const sql = `
      UPDATE prices 
      SET ${setParts.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    params.push(id);

    const result = await this.db.queryOne(sql, params);
    if (!result) {
      throw new Error(`Price with id ${id} not found`);
    }
    
    return this.mapRowToPrice(result);
  }

  async delete(id: string): Promise<void> {
    const sql = 'DELETE FROM prices WHERE id = $1';
    await this.db.query(sql, [id]);
  }

  // PriceRepository specific methods
  async findByItemId(itemId: string): Promise<Price[]> {
    const sql = 'SELECT * FROM prices WHERE item_id = $1 ORDER BY created_at DESC';
    const results = await this.db.query(sql, [itemId]);
    return results.map(row => this.mapRowToPrice(row));
  }

  async findCurrentPrices(): Promise<Price[]> {
    const sql = 'SELECT * FROM prices WHERE is_current = true ORDER BY created_at DESC';
    const results = await this.db.query(sql);
    return results.map(row => this.mapRowToPrice(row));
  }

  async updateCurrentPrice(itemId: string, newPrice: Price): Promise<void> {
    // Start transaction to ensure atomicity
    await this.db.query('BEGIN');
    
    try {
      // Mark all existing prices as not current
      await this.db.query(
        'UPDATE prices SET is_current = false WHERE item_id = $1',
        [itemId]
      );
      
      // Insert new current price
      await this.save({ ...newPrice, isCurrent: true });
      
      await this.db.query('COMMIT');
    } catch (error) {
      await this.db.query('ROLLBACK');
      throw error;
    }
  }

  // Helper method to map database rows to Price objects
  private mapRowToPrice(row: any): Price {
    return {
      id: row.id,
      itemId: row.item_id,
      priceDiamonds: parseFloat(row.price_diamond_blocks),
      tradingUnit: row.trading_unit as TradingUnitType,
      isCurrent: row.is_current,
      source: row.source,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at)
    };
  }
}