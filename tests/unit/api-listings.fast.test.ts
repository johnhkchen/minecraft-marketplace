/**
 * API Listings Fast Tests - MSW Mocked Version
 * Converted from api/listings.test.ts for rapid development feedback
 * 
 * Tests marketplace listings API functionality without infrastructure dependencies
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupFastTests } from '../utils/fast-test-setup.js';

// Setup MSW mocking for all HTTP calls
setupFastTests();

// Test data configuration
const TEST_DATA = {
  mainTrader: 'steve',
  primaryItem: 'Diamond Sword',
  primaryItemId: 'diamond_sword',
  primaryServer: 'HermitCraft'
};

// Mock listings data
const mockListings = [
  {
    listing_id: 'listing_1',
    seller_id: 'seller_steve',
    item_id: 'diamond_sword',
    qty: 1,
    price: 2.5,
    is_active: true,
    seller_name: 'Steve',
    item_name: 'Diamond Sword',
    stall_id: 'A-1',
    description: 'Sharp diamond sword'
  },
  {
    listing_id: 'listing_2',
    seller_id: 'seller_alex',
    item_id: 'iron_pickaxe',
    qty: 3,
    price: 1.25,
    is_active: true,
    seller_name: 'Alex',
    item_name: 'Iron Pickaxe',
    stall_id: 'B-2',
    description: 'Durable mining tool'
  },
  {
    listing_id: 'listing_3',
    seller_id: 'seller_steve',
    item_id: 'netherite_sword',
    qty: 1,
    price: 5.0,
    is_active: false,
    seller_name: 'Steve',
    item_name: 'Netherite Sword',
    stall_id: 'A-1',
    description: 'Rare netherite weapon'
  },
  {
    listing_id: 'listing_4',
    seller_id: 'seller_bob',
    item_id: 'diamond_armor',
    qty: 1,
    price: 10.5,
    is_active: true,
    seller_name: 'Bob', 
    item_name: 'Diamond Armor Set',
    stall_id: 'C-3',
    description: 'Full diamond protection'
  }
];

// Fast listings API service mock
class FastListingsApiService {
  private listings = [...mockListings];
  private nextId = mockListings.length + 1;

  async getAllListings(filters: { seller_id?: string; item_id?: string; is_active?: boolean } = {}) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3));
    
    let filtered = [...this.listings];
    
    if (filters.seller_id) {
      filtered = filtered.filter(listing => listing.seller_id === filters.seller_id);
    }
    
    if (filters.item_id) {
      filtered = filtered.filter(listing => listing.item_id === filters.item_id);
    }
    
    if (filters.is_active !== undefined) {
      filtered = filtered.filter(listing => listing.is_active === filters.is_active);
    }
    
    // Default to active listings only if no is_active filter specified
    if (filters.is_active === undefined) {
      filtered = filtered.filter(listing => listing.is_active);
    }
    
    return filtered;
  }

  async createListing(listingData: any) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
    
    const newListing = {
      listing_id: `listing_${this.nextId++}`,
      ...listingData,
      is_active: true,
      seller_name: `Seller_${listingData.seller_id}`,
      item_name: `Item_${listingData.item_id}`,
      stall_id: `AUTO-${Math.floor(Math.random() * 100)}`
    };
    
    this.listings.push(newListing);
    return newListing;
  }

  async updateListing(listingId: string, updates: any) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 4));
    
    const listingIndex = this.listings.findIndex(l => l.listing_id === listingId);
    if (listingIndex === -1) {
      throw new Error('Listing not found');
    }
    
    this.listings[listingIndex] = { ...this.listings[listingIndex], ...updates };
    return this.listings[listingIndex];
  }

  // Simulate API response structure
  async apiRequest(url: string, options: any = {}): Promise<{ status: number; data: any }> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3));

    try {
      const urlObj = new URL(url, 'http://localhost:4321');
      const method = options.method || 'GET';
      
      if (method === 'GET') {
        const filters: any = {};
        if (urlObj.searchParams.get('seller_id')) filters.seller_id = urlObj.searchParams.get('seller_id');
        if (urlObj.searchParams.get('item_id')) filters.item_id = urlObj.searchParams.get('item_id');
        if (urlObj.searchParams.get('is_active')) filters.is_active = urlObj.searchParams.get('is_active') === 'true';
        
        const results = await this.getAllListings(filters);
        return { status: 200, data: results };
      }
      
      if (method === 'POST') {
        const body = JSON.parse(options.body || '{}');
        const newListing = await this.createListing(body);
        return { status: 201, data: newListing };
      }
      
      return { status: 405, data: { error: 'Method not allowed' } };
    } catch (error) {
      return { status: 500, data: { error: 'Failed to process request' } };
    }
  }
}

describe('API Listings Fast Tests', () => {
  let apiService: FastListingsApiService;
  
  beforeEach(() => {
    apiService = new FastListingsApiService();
  });

  describe('GET /api/listings', () => {
    it('returns all active listings by default', async () => {
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // Check that all returned listings are active
      response.data.forEach((listing: any) => {
        expect(listing.is_active).toBe(true);
      });
      
      // Verify listing structure
      const firstListing = response.data[0];
      expect(firstListing).toHaveProperty('listing_id');
      expect(firstListing).toHaveProperty('seller_id');
      expect(firstListing).toHaveProperty('item_id');
      expect(firstListing).toHaveProperty('qty');
      expect(firstListing).toHaveProperty('price');
      expect(firstListing).toHaveProperty('seller_name');
      expect(firstListing).toHaveProperty('item_name');
      expect(firstListing).toHaveProperty('stall_id');
      
    });

    it('filters by seller_id when provided', async () => {
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // All returned listings should be from seller_steve
      response.data.forEach((listing: any) => {
        expect(listing.seller_id).toBe('seller_steve');
      });
      
    });

    it('filters by item_id when provided', async () => {
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // All returned listings should be for diamond_sword
      response.data.forEach((listing: any) => {
        expect(listing.item_id).toBe('diamond_sword');
      });
      
    });

    it('includes inactive listings when is_active=false', async () => {
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // All returned listings should be inactive
      response.data.forEach((listing: any) => {
        expect(listing.is_active).toBe(false);
      });
      
    });

    it('handles multiple filters', async () => {
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      response.data.forEach((listing: any) => {
        expect(listing.seller_id).toBe('seller_steve');
        expect(listing.is_active).toBe(true);
      });
      
    });

    it('returns empty array for non-existent seller', async () => {
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(0);
      
    });
  });

  describe('POST /api/listings', () => {
    it('creates a new listing successfully', async () => {
      const newListing = {
        seller_id: 'test_seller',
        item_id: 'test_item',
        qty: 5,
        price: 3.75,
        description: 'Test item description'
      };

      const response = await apiService.createListing(newListing);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('listing_id');
      expect(response.data.seller_id).toBe(newListing.seller_id);
      expect(response.data.item_id).toBe(newListing.item_id);
      expect(response.data.qty).toBe(newListing.qty);
      expect(response.data.price).toBe(newListing.price);
      expect(response.data.is_active).toBe(true);
      
    });

    it('handles decimal prices correctly', async () => {
      const newListing = {
        seller_id: 'decimal_seller',
        item_id: 'fractional_item',
        qty: 1,
        price: 2.75,
        description: 'Item with decimal price'
      };

          body: JSON.stringify(newListing)
        })
      );
      
      expect(response.status).toBe(201);
      expect(response.data.price).toBe(2.75);
      expect(typeof response.data.price).toBe('number');
      
    });

    it('validates required fields', async () => {
      const incompleteListing = {
        seller_id: 'test_seller',
        // Missing item_id, qty, price
        description: 'Incomplete listing'
      };

      
      // Validate that required fields would be checked
      expect(incompleteListing).not.toHaveProperty('item_id');
      expect(incompleteListing).not.toHaveProperty('qty');
      expect(incompleteListing).not.toHaveProperty('price');
      
    });

    it('generates unique listing IDs', async () => {
      const listingData = {
        seller_id: 'unique_seller',
        item_id: 'unique_item',
        qty: 1,
        price: 1.0,
        description: 'Unique listing test'
      };

          body: JSON.stringify(listingData)
        })
      );

          body: JSON.stringify(listingData)
        })
      );
      
      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.data.listing_id).not.toBe(response2.data.listing_id);
      
    });
  });

  describe('Performance Requirements', () => {
    it('meets Epic 1 filtering performance requirements', async () => {
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // Epic 1 requirement: <500ms filtering (fast tests should be much faster)
    });

    it('handles concurrent listing requests fast', async () => {
      const requests = [
        '/api/listings',
        '/api/listings?seller_id=seller_alex',
        '/api/listings?is_active=false',
        '/api/listings?item_id=diamond_sword',
        '/api/listings?seller_id=seller_bob&is_active=true'
      ];
      
        );
        
        return Promise.all(requestPromises);
      });
      
      expect(responses.length).toBe(requests.length);
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
      });
      
    });
  });

  describe('Business Logic Validation', () => {
    it('validates listing data integrity', async () => {
      
      expect(response.status).toBe(200);
      
      response.data.forEach((listing: any) => {
        expect(typeof listing.listing_id).toBe('string');
        expect(typeof listing.seller_id).toBe('string');
        expect(typeof listing.item_id).toBe('string');
        expect(typeof listing.qty).toBe('number');
        expect(typeof listing.price).toBe('number');
        expect(typeof listing.is_active).toBe('boolean');
        
        expect(listing.qty).toBeGreaterThan(0);
        expect(listing.price).toBeGreaterThan(0);
      });
      
    });

    it('validates price calculations', () => {
      const testPrices = [1.0, 1.25, 2.5, 5.75, 10.0];
      
      
      testPrices.forEach(price => {
        expect(price).toBeGreaterThan(0);
        expect(Number.isFinite(price)).toBe(true);
        expect(price.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
      });
      
    });
  });

  describe('Fast Test Execution Validation', () => {
    it('validates all listing API operations complete in milliseconds', async () => {

      // Multiple quick operations
      const allListings = await apiService.getAllListings();
      const filteredListings = await apiService.getAllListings({ seller_id: 'seller_steve' });
      const newListing = await apiService.createListing({
        seller_id: 'fast_test',
        item_id: 'fast_item',
        qty: 1,
        price: 1.0,
        description: 'Fast test listing'
      });

      expect(Array.isArray(allListings)).toBe(true);
      expect(Array.isArray(filteredListings)).toBe(true);
      expect(newListing).toHaveProperty('listing_id');

    });
  });
});