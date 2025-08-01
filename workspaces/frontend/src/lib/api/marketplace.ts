/**
 * MarketplaceApiService - Frontend API client
 * Lightweight wrapper around PostgREST API calls
 * Based on existing test requirements and MSW mock patterns
 */

export interface ListingWithDetails {
  listing_id: number;
  seller_id: string;
  item_id: string;
  date_created: string;
  qty: number;
  price: number;
  description: string;
  is_active: boolean;
  inventory_unit: string;
  listing_type: string;
  item_name: string;
  seller_name: string;
  stall_id: string;
}

export interface ItemListing {
  id: string;
  name: string;
  category: string;
  server_name?: string;
  price_diamonds: number;
  trading_unit: string;
  stock_quantity: number;
  owner_id: string;
  created_at: string;
}

/**
 * Simple API client for PostgREST endpoints
 * Follows existing test patterns and MSW mock expectations
 */
export class MarketplaceApiService {
  constructor(private baseUrl: string) {}

  /**
   * Filter items by server name
   * Expected by server-location-filtering.fast.test.ts
   */
  async filterByServer(serverName: string): Promise<ItemListing[]> {
    const response = await fetch(`${this.baseUrl}/items?server_name=eq.${encodeURIComponent(serverName)}`);
    if (!response.ok) {
      throw new Error(`Filter by server failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Filter items by category
   * Expected by test patterns
   */
  async filterByCategory(category: string): Promise<ItemListing[]> {
    const response = await fetch(`${this.baseUrl}/items?category=eq.${encodeURIComponent(category)}`);
    if (!response.ok) {
      throw new Error(`Filter by category failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Search items with query
   * Expected by test patterns
   */
  async searchItems(query: string): Promise<ItemListing[]> {
    const response = await fetch(`${this.baseUrl}/items?name=ilike.*${encodeURIComponent(query)}*`);
    if (!response.ok) {
      throw new Error(`Search items failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get listings with details
   * Expected by MarketplaceBrowser tests
   */
  async getListings(): Promise<ListingWithDetails[]> {
    const response = await fetch(`${this.baseUrl}/listings_with_details`);
    if (!response.ok) {
      throw new Error(`Get listings failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get listings with details
   * Expected by MarketplaceBrowser tests
   */
  async fetchListings(): Promise<ListingWithDetails[]> {
    const response = await fetch(`${this.baseUrl}/listings_with_details`);
    if (!response.ok) {
      throw new Error(`Fetch listings failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Filter by location
   * Expected by server-location-filtering tests
   */
  async filterByLocation(location: string): Promise<ItemListing[]> {
    const response = await fetch(`${this.baseUrl}/items?location=eq.${encodeURIComponent(location)}`);
    if (!response.ok) {
      throw new Error(`Filter by location failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Filter by price range
   * Expected by filtering tests
   */
  async filterByPriceRange(minPrice: number, maxPrice: number): Promise<ItemListing[]> {
    const response = await fetch(`${this.baseUrl}/items?price_diamonds=gte.${minPrice}&price_diamonds=lte.${maxPrice}`);
    if (!response.ok) {
      throw new Error(`Filter by price range failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Filter by dimension
   * Expected by dimension filtering tests
   */
  async filterByDimension(dimension: string): Promise<ItemListing[]> {
    const response = await fetch(`${this.baseUrl}/items?dimension=eq.${encodeURIComponent(dimension)}`);
    if (!response.ok) {
      throw new Error(`Filter by dimension failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get unique server list
   * Expected by server dropdown tests
   */
  async getUniqueServers(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/items?select=server_name&distinct=server_name`);
    if (!response.ok) {
      throw new Error(`Get unique servers failed: ${response.statusText}`);
    }
    const items = await response.json();
    return items.map((item: any) => item.server_name).filter(Boolean);
  }

  /**
   * Get shop locations within server
   * Expected by location tests
   */
  async getShopLocations(serverName: string): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/items?server_name=eq.${encodeURIComponent(serverName)}&select=location&distinct=location`);
    if (!response.ok) {
      throw new Error(`Get shop locations failed: ${response.statusText}`);
    }
    const items = await response.json();
    return items.map((item: any) => item.location).filter(Boolean);
  }

  /**
   * Create new item listing
   */
  async createItem(item: Omit<ItemListing, 'id' | 'created_at'>): Promise<ItemListing> {
    const response = await fetch(`${this.baseUrl}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(item)
    });

    if (!response.ok) {
      throw new Error(`Create item failed: ${response.statusText}`);
    }

    const items = await response.json();
    return items[0];
  }
}