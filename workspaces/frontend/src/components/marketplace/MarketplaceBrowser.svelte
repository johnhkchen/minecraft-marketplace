<script lang="ts">
  /**
   * MarketplaceBrowser - Main marketplace interface
   * Cherry-picked and adapted from reference implementation
   * Following GAMEPLAN foundation-first approach with API integration
   */
  
  import { formatPrice, formatTotalCost, formatAveragePrice, formatPriceRange } from '../../utils/price-display.js';
  import type { Item, Price, TradingUnitType } from '../../../shared/types/service-interfaces.js';
  import ItemCard from './ItemCard.svelte';
  import SearchFilters from './SearchFilters.svelte';
  
  // Component props
  interface Props {
    initialItems?: any[];
    apiBaseUrl: string;
  }
  
  let { initialItems = [], apiBaseUrl }: Props = $props();
  
  // Reactive state
  let items = $state<any[]>(initialItems);
  let loading = $state(false);
  let error = $state<string | null>(null);
  
  // Search and filter state
  let searchTerm = $state('');
  let categoryFilter = $state<string>('');
  let serverFilter = $state<string>('');
  let maxPrice = $state<number | undefined>(undefined);
  let tradingUnitFilter = $state<TradingUnitType | ''>('');
  let sortBy = $state<'price' | 'name' | 'updated'>('price');
  let sortOrder = $state<'asc' | 'desc'>('asc');
  
  // Filtered and sorted items
  let filteredItems = $derived.by(() => {
    let filtered = items.filter(item => {
      // Search term filter
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (categoryFilter && item.category !== categoryFilter) {
        return false;
      }
      
      // Server filter
      if (serverFilter && item.server_name !== serverFilter) {
        return false;
      }
      
      // Price filter (using current price)
      if (maxPrice && item.prices?.[0]?.price_diamond_blocks > maxPrice) {
        return false;
      }
      
      // Trading unit filter
      if (tradingUnitFilter && item.prices?.[0]?.trading_unit !== tradingUnitFilter) {
        return false;
      }
      
      // Only show available items
      return item.is_available;
    });
    
    // Sort items
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'price':
          aValue = a.prices?.[0]?.price_diamond_blocks || 0;
          bValue = b.prices?.[0]?.price_diamond_blocks || 0;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'updated':
          aValue = new Date(a.updated_at);
          bValue = new Date(b.updated_at);
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return filtered;
  });
  
  // Market statistics
  let marketStats = $derived.by(() => {
    const availableItems = items.filter(item => item.is_available);
    const prices = availableItems
      .map(item => item.prices?.[0]?.price_diamond_blocks)
      .filter(price => price > 0);
    
    if (prices.length === 0) {
      return {
        totalItems: 0,
        averagePrice: formatAveragePrice(0),
        priceRange: formatPriceRange(0, 0),
        uniqueCategories: 0
      };
    }
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const categories = new Set(availableItems.map(item => item.category));
    
    return {
      totalItems: filteredItems.length,
      averagePrice: formatAveragePrice(avgPrice),
      priceRange: formatPriceRange(minPrice, maxPrice),
      uniqueCategories: categories.size
    };
  });
  
  // Load items from API
  async function loadItems() {
    loading = true;
    error = null;
    
    try {
      const response = await fetch(`${apiBaseUrl}/items?select=*,prices(*)&is_available=eq.true&order=updated_at.desc`);
      
      if (!response.ok) {
        throw new Error(`Failed to load items: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      items = data;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load marketplace data';
      console.error('Error loading items:', e);
    } finally {
      loading = false;
    }
  }
  
  // Handle item purchase
  function handlePurchase(item: any) {
    const price = item.prices?.[0];
    if (!price) {
      alert('Price information not available');
      return;
    }
    
    const unitPrice = formatPrice(price.price_diamond_blocks, price.trading_unit);
    const totalCost = formatTotalCost(price.price_diamond_blocks, item.stock_quantity, price.trading_unit);
    
    const message = `Purchase ${item.stock_quantity} ${item.name}?\n\n` +
      `Unit Price: ${unitPrice.fullText}\n` +
      `Total Cost: ${totalCost.fullText}\n` +
      `Server: ${item.server_name || 'Unknown'}\n` +
      `Shop: ${item.shop_location || 'Unknown'}`;
    
    if (confirm(message)) {
      // TODO: Implement actual purchase logic with API call
      alert('Purchase functionality coming soon! This will integrate with Discord for transaction coordination.');
    }
  }
  
  // Clear all filters
  function clearFilters() {
    searchTerm = '';
    categoryFilter = '';
    serverFilter = '';
    maxPrice = undefined;
    tradingUnitFilter = '';
  }
  
  // Refresh data
  function refresh() {
    loadItems();
  }
</script>

<div class="marketplace-browser">
  <!-- User-centered heading -->
  <header class="browser-header">
    <h2>Find Items to Buy</h2>
    <p class="header-description">Browse available items from community members</p>
  </header>

  <!-- Primary search -->
  <div class="primary-search">
    <label for="main-search">What are you looking for?</label>
    <input 
      id="main-search" 
      type="text" 
      placeholder="Search for diamond sword, oak wood, etc."
      bind:value={searchTerm}
    />
    <p class="search-guidance">Try searching for popular items like "diamond sword" or "oak wood"</p>
  </div>

  <!-- More filters (progressive disclosure) -->
  <details class="advanced-filters">
    <summary>More filters</summary>
    <div class="filters-content">
      <label>Show me: <input type="text" placeholder="Category filter" /></label>
      <label>Max price: <input type="number" placeholder="in diamond blocks" /></label>
      <label>From seller: <input type="text" placeholder="Seller name" /></label>
    </div>
  </details>

  <!-- Market Statistics Header -->
  <div class="market-stats">
    <div class="stat-card">
      <div class="stat-value">{marketStats.totalItems}</div>
      <div class="stat-label">Available Items</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{marketStats.uniqueCategories}</div>
      <div class="stat-label">Categories</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{marketStats.averagePrice.shortText}</div>
      <div class="stat-label">Avg Price</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{marketStats.priceRange.shortText}</div>
      <div class="stat-label">Price Range</div>
    </div>
  </div>

  <!-- Search and Filters -->
  <SearchFilters
    bind:searchTerm
    bind:categoryFilter
    bind:serverFilter
    bind:maxPrice
    bind:tradingUnitFilter
    bind:sortBy
    bind:sortOrder
    onClear={clearFilters}
    onRefresh={refresh}
  />

  <!-- Loading State -->
  {#if loading}
    <div class="loading-state">
      <div class="loading"></div>
      <p>Loading marketplace data...</p>
    </div>
  {/if}

  <!-- Error State -->
  {#if error}
    <div class="error-state">
      <h3>⚠️ Error Loading Data</h3>
      <p>{error}</p>
      <button class="btn-primary" onclick={refresh}>
        Try Again
      </button>
    </div>
  {/if}

  <!-- Items Grid with HATEOAS structure -->
  {#if !loading && !error}
    <div class="items-grid">
      {#each filteredItems as item (item.id)}
        <article role="article" class="item-card">
          <div class="item-status">
            {#if item.is_available}
              <span class="status-badge available">Available to buy</span>
            {:else}
              <span class="status-badge wanted">Someone wants this</span>
            {/if}
          </div>
          <ItemCard 
            {item} 
            onPurchase={() => handlePurchase(item)}
          />
          <div class="item-actions">
            <button class="buy-action" onclick={() => handlePurchase(item)}>
              Buy Now
            </button>
            <button class="contact-action">
              Contact Seller
            </button>
          </div>
        </article>
      {:else}
        <div class="no-results">
          <h3>No items found</h3>
          <p>Try adjusting your search filters or check back later for new listings.</p>
          <button class="btn-secondary" onclick={clearFilters}>
            Clear Filters
          </button>
        </div>
      {/each}
    </div>
  {/if}

  <footer class="browser-footer">
    <p>Browse with confidence - all items verified by the community</p>
  </footer>
</div>

<style>
  .marketplace-browser {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1rem;
  }

  .market-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid var(--color-secondary);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    text-align: center;
    transition: all 0.2s ease;
  }

  .stat-card:hover {
    border-color: var(--color-primary);
    transform: translateY(-2px);
  }

  .stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: var(--color-primary);
    margin-bottom: 0.5rem;
  }

  .stat-label {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem;
    color: var(--color-text-secondary);
  }

  .error-state {
    background: rgba(239, 68, 68, 0.1);
    border: 2px solid var(--color-danger);
    border-radius: var(--border-radius);
    padding: 2rem;
    text-align: center;
    margin: 2rem 0;
  }

  .error-state h3 {
    color: var(--color-danger);
    margin-bottom: 1rem;
  }

  .error-state p {
    color: var(--color-text-secondary);
    margin-bottom: 1.5rem;
  }

  .no-results {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: var(--border-radius);
    border: 2px dashed rgba(255, 255, 255, 0.2);
  }

  .no-results h3 {
    color: var(--color-text-secondary);
    margin-bottom: 1rem;
  }

  .no-results p {
    color: var(--color-text-muted);
    margin-bottom: 1.5rem;
  }

  @media (max-width: 768px) {
    .marketplace-browser {
      padding: 0.5rem;
    }
    
    .market-stats {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .items-grid {
      grid-template-columns: 1fr;
    }
  }
</style>