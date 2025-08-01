/**
 * PostgREST Query Builder
 * REFACTOR: Clean, fluent API for building PostgREST queries with type safety
 */

export class PostgRESTQueryBuilder {
  private baseUrl: string;
  private table: string;
  private selectFields: string[] = [];
  private filters: Map<string, string> = new Map();
  private orderBy: string[] = [];
  private limitValue?: number;
  private offsetValue?: number;

  constructor(baseUrl: string, table: string) {
    this.baseUrl = baseUrl;
    this.table = table;
  }

  /**
   * Select specific fields
   */
  select(fields: string | string[]): this {
    if (Array.isArray(fields)) {
      this.selectFields = fields;
    } else {
      this.selectFields = [fields];
    }
    return this;
  }

  /**
   * Equal filter
   */
  eq(column: string, value: string | number | boolean): this {
    this.filters.set(column, `eq.${value}`);
    return this;
  }

  /**
   * Not equal filter
   */
  neq(column: string, value: string | number | boolean): this {
    this.filters.set(column, `neq.${value}`);
    return this;
  }

  /**
   * ILIKE filter (case-insensitive pattern matching)
   */
  ilike(column: string, pattern: string): this {
    this.filters.set(column, `ilike.${pattern}`);
    return this;
  }

  /**
   * Contains filter (for arrays/text)
   */
  contains(column: string, value: string): this {
    this.filters.set(column, `cs.${value}`);
    return this;
  }

  /**
   * Greater than filter
   */
  gt(column: string, value: number): this {
    this.filters.set(column, `gt.${value}`);
    return this;
  }

  /**
   * Greater than or equal filter
   */
  gte(column: string, value: number): this {
    this.filters.set(column, `gte.${value}`);
    return this;
  }

  /**
   * Less than filter
   */
  lt(column: string, value: number): this {
    this.filters.set(column, `lt.${value}`);
    return this;
  }

  /**
   * Less than or equal filter
   */
  lte(column: string, value: number): this {
    this.filters.set(column, `lte.${value}`);
    return this;
  }

  /**
   * In filter (value in list)
   */
  in(column: string, values: (string | number)[]): this {
    this.filters.set(column, `in.(${values.join(',')})`);
    return this;
  }

  /**
   * Is null filter
   */
  isNull(column: string): this {
    this.filters.set(column, 'is.null');
    return this;
  }

  /**
   * Is not null filter
   */
  isNotNull(column: string): this {
    this.filters.set(column, 'not.is.null');
    return this;
  }

  /**
   * Order by column
   */
  order(column: string, ascending = true): this {
    const direction = ascending ? 'asc' : 'desc';
    this.orderBy.push(`${column}.${direction}`);
    return this;
  }

  /**
   * Limit results
   */
  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  /**
   * Offset results (for pagination)
   */
  offset(count: number): this {
    this.offsetValue = count;
    return this;
  }

  /**
   * Build the complete URL
   */
  buildUrl(): string {
    const params = new URLSearchParams();

    // Add select fields
    if (this.selectFields.length > 0) {
      params.append('select', this.selectFields.join(','));
    }

    // Add filters
    for (const [column, filter] of this.filters.entries()) {
      params.append(column, filter);
    }

    // Add ordering
    if (this.orderBy.length > 0) {
      params.append('order', this.orderBy.join(','));
    }

    // Add limit
    if (this.limitValue !== undefined) {
      params.append('limit', this.limitValue.toString());
    }

    // Add offset
    if (this.offsetValue !== undefined) {
      params.append('offset', this.offsetValue.toString());
    }

    const queryString = params.toString();
    return `${this.baseUrl}/${this.table}${queryString ? '?' + queryString : ''}`;
  }

  /**
   * Get the endpoint path (without base URL)
   */
  buildEndpoint(): string {
    const url = this.buildUrl();
    return url.replace(this.baseUrl, '');
  }

  /**
   * Create a new query builder instance
   */
  static create(baseUrl: string, table: string): PostgRESTQueryBuilder {
    return new PostgRESTQueryBuilder(baseUrl, table);
  }

  /**
   * Clone this query builder for modification
   */
  clone(): PostgRESTQueryBuilder {
    const cloned = new PostgRESTQueryBuilder(this.baseUrl, this.table);
    cloned.selectFields = [...this.selectFields];
    cloned.filters = new Map(this.filters);
    cloned.orderBy = [...this.orderBy];
    cloned.limitValue = this.limitValue;
    cloned.offsetValue = this.offsetValue;
    return cloned;
  }
}

/**
 * Fluent API factory for common queries
 */
export class QueryBuilder {
  constructor(private baseUrl: string) {}

  /**
   * Query public items
   */
  publicItems(): PostgRESTQueryBuilder {
    return new PostgRESTQueryBuilder(this.baseUrl, 'public_items');
  }

  /**
   * Query with automatic available filter
   */
  availableItems(): PostgRESTQueryBuilder {
    return this.publicItems().eq('is_available', true);
  }

  /**
   * Search items by name pattern
   */
  searchItems(query: string): PostgRESTQueryBuilder {
    return this.availableItems().ilike('name', `*${query}*`);
  }

  /**
   * Filter by category
   */
  itemsByCategory(category: string): PostgRESTQueryBuilder {
    return this.availableItems().eq('category', category);
  }

  /**
   * Filter by server
   */
  itemsByServer(serverName: string): PostgRESTQueryBuilder {
    return this.availableItems().eq('server_name', serverName);
  }

  /**
   * Filter by location pattern
   */
  itemsByLocation(location: string): PostgRESTQueryBuilder {
    return this.availableItems().ilike('shop_location', `*${location}*`);
  }

  /**
   * Price range query
   */
  itemsByPriceRange(minPrice?: number, maxPrice?: number): PostgRESTQueryBuilder {
    const query = this.availableItems();
    
    if (minPrice !== undefined) {
      query.gte('price_diamonds', minPrice);
    }
    
    if (maxPrice !== undefined) {
      query.lte('price_diamonds', maxPrice);
    }
    
    return query;
  }

  /**
   * Get unique server names
   */
  serverNames(): PostgRESTQueryBuilder {
    return this.availableItems()
      .select('server_name')
      .order('server_name');
  }

  /**
   * Get locations for a specific server
   */
  serverLocations(serverName: string): PostgRESTQueryBuilder {
    return this.availableItems()
      .eq('server_name', serverName)
      .select('shop_location');
  }
}