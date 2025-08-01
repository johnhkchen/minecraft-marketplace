/**
 * PostgreSQL Item Repository Implementation
 * Foundation-first: Implements the ItemRepository interface
 */

import { 
  Item, 
  ItemRepository, 
  ItemCategory, 
  CreateItemRequest,
  SearchItemsRequest 
} from '@shared/types/service-interfaces';

export interface DatabaseConnection {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
}

export class PostgreSQLItemRepository implements ItemRepository {
  constructor(private db: DatabaseConnection) {}

  async save(item: Item): Promise<Item> {
    const sql = `
      INSERT INTO items (
        id, owner_id, name, description, category, minecraft_id, 
        stock_quantity, is_available, server_name, shop_location,
        enchantments, item_attributes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING *
    `;
    
    const params = [
      item.id,
      item.ownerId,
      item.name,
      item.description,
      item.category,
      item.minecraftId,
      item.stockQuantity,
      item.isAvailable,
      item.serverName,
      item.shopLocation,
      JSON.stringify(item.enchantments || {}),
      JSON.stringify(item.itemAttributes || {})
    ];

    const result = await this.db.queryOne(sql, params);
    return this.mapRowToItem(result);
  }

  async findById(id: string): Promise<Item | null> {
    const sql = 'SELECT * FROM items WHERE id = $1';
    const result = await this.db.queryOne(sql, [id]);
    return result ? this.mapRowToItem(result) : null;
  }

  async findAll(criteria?: Partial<Item>): Promise<Item[]> {
    let sql = 'SELECT * FROM items WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (criteria?.category) {
      sql += ` AND category = $${paramIndex++}`;
      params.push(criteria.category);
    }

    if (criteria?.isAvailable !== undefined) {
      sql += ` AND is_available = $${paramIndex++}`;
      params.push(criteria.isAvailable);
    }

    if (criteria?.ownerId) {
      sql += ` AND owner_id = $${paramIndex++}`;
      params.push(criteria.ownerId);
    }

    if (criteria?.serverName) {
      sql += ` AND server_name = $${paramIndex++}`;
      params.push(criteria.serverName);
    }

    sql += ' ORDER BY created_at DESC';
    
    const results = await this.db.query(sql, params);
    return results.map(row => this.mapRowToItem(row));
  }

  async update(id: string, updates: Partial<Item>): Promise<Item> {
    const setParts: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      setParts.push(`name = $${paramIndex++}`);
      params.push(updates.name);
    }

    if (updates.description !== undefined) {
      setParts.push(`description = $${paramIndex++}`);
      params.push(updates.description);
    }

    if (updates.stockQuantity !== undefined) {
      setParts.push(`stock_quantity = $${paramIndex++}`);
      params.push(updates.stockQuantity);
    }

    if (updates.isAvailable !== undefined) {
      setParts.push(`is_available = $${paramIndex++}`);
      params.push(updates.isAvailable);
    }

    if (updates.enchantments !== undefined) {
      setParts.push(`enchantments = $${paramIndex++}`);
      params.push(JSON.stringify(updates.enchantments));
    }

    if (setParts.length === 0) {
      throw new Error('No valid updates provided');
    }

    const sql = `
      UPDATE items 
      SET ${setParts.join(', ')}, updated_at = now()
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    params.push(id);

    const result = await this.db.queryOne(sql, params);
    if (!result) {
      throw new Error(`Item with id ${id} not found`);
    }
    
    return this.mapRowToItem(result);
  }

  async delete(id: string): Promise<void> {
    const sql = 'DELETE FROM items WHERE id = $1';
    await this.db.query(sql, [id]);
  }

  // ItemRepository specific methods
  async findByOwnerId(ownerId: string): Promise<Item[]> {
    const sql = 'SELECT * FROM items WHERE owner_id = $1 ORDER BY created_at DESC';
    const results = await this.db.query(sql, [ownerId]);
    return results.map(row => this.mapRowToItem(row));
  }

  async findByCategory(category: ItemCategory): Promise<Item[]> {
    const sql = 'SELECT * FROM items WHERE category = $1 AND is_available = true ORDER BY created_at DESC';
    const results = await this.db.query(sql, [category]);
    return results.map(row => this.mapRowToItem(row));
  }

  async findByMinecraftId(minecraftId: string): Promise<Item[]> {
    const sql = 'SELECT * FROM items WHERE minecraft_id = $1 AND is_available = true ORDER BY created_at DESC';
    const results = await this.db.query(sql, [minecraftId]);
    return results.map(row => this.mapRowToItem(row));
  }

  async searchItems(query: string): Promise<Item[]> {
    const sql = `
      SELECT * FROM items 
      WHERE (
        name ILIKE $1 OR 
        description ILIKE $1 OR 
        minecraft_id ILIKE $1
      ) AND is_available = true
      ORDER BY created_at DESC
      LIMIT 100
    `;
    const searchTerm = `%${query}%`;
    const results = await this.db.query(sql, [searchTerm]);
    return results.map(row => this.mapRowToItem(row));
  }

  async findAvailable(): Promise<Item[]> {
    const sql = 'SELECT * FROM items WHERE is_available = true ORDER BY created_at DESC';
    const results = await this.db.query(sql);
    return results.map(row => this.mapRowToItem(row));
  }

  // Helper method to map database rows to Item objects
  private mapRowToItem(row: any): Item {
    return {
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      description: row.description,
      processedDescription: row.processed_description,
      category: row.category as ItemCategory,
      minecraftId: row.minecraft_id,
      enchantments: row.enchantments || {},
      itemAttributes: row.item_attributes || {},
      stockQuantity: row.stock_quantity,
      isAvailable: row.is_available,
      serverName: row.server_name,
      shopLocation: row.shop_location,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}