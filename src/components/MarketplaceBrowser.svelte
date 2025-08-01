<script lang="ts">
  import type { ListingWithDetails, SearchFilters } from '../types/marketplace.js';
  import MinecraftItemIcon from './MinecraftItemIcon.svelte';
  import { formatPrice, formatTotalCost, formatAveragePrice } from '../lib/price-display.js';
  import { marketplaceApi } from '../lib/api/marketplace.js';
  import { onMount } from 'svelte';
  
  interface Props {
    onPurchase: (listing: ListingWithDetails) => void;
  }
  
  let { onPurchase }: Props = $props();
  
  // API-driven state instead of prop-driven
  let listings = $state<ListingWithDetails[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  
  let searchTerm = $state('');
  let maxPrice = $state<number | undefined>(undefined);
  let sellerFilter = $state('');
  let listingType = $state<'all' | 'buy' | 'sell'>('all');
  
  let filters = $derived<SearchFilters>({
    item_name: searchTerm.trim() || undefined,
    max_price: maxPrice,
    seller_name: sellerFilter.trim() || undefined,
    is_active: true
  });

  // Load initial data on component mount
  onMount(async () => {
    await loadListings();
  });

  // Reactive effect to reload data when filters change
  $effect(async () => {
    if (!loading) { // Don't trigger during initial load
      await loadListings();
    }
  });

  async function loadListings() {
    try {
      loading = true;
      error = null;
      listings = await marketplaceApi.fetchListings(filters);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load listings';
      console.error('Failed to load listings:', err);
    } finally {
      loading = false;
    }
  }
  
  let filteredListings = $derived.by(() => {
    return listings.filter(listing => {
      if (listing.is_active === false) return false;
      
      // Filter by listing type
      if (listingType !== 'all' && listing.listing_type !== listingType) {
        return false;
      }
      
      if (filters.item_name && !listing.item_name?.toLowerCase().includes(filters.item_name.toLowerCase())) {
        return false;
      }
      
      if (filters.max_price && listing.price > filters.max_price) {
        return false;
      }
      
      if (filters.seller_name && !listing.seller_name?.toLowerCase().includes(filters.seller_name.toLowerCase())) {
        return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by unit price ascending (cheapest first)
      // Put 0-price items (make offer) at the end
      if (a.price === 0 && b.price === 0) return 0;
      if (a.price === 0) return 1;
      if (b.price === 0) return -1;
      return a.price - b.price;
    });
  });
  
  let totalListings = $derived(filteredListings.length);
  let uniqueItems = $derived(new Set(filteredListings.map(l => l.item_name)).size);
  let averagePrice = $derived.by(() => {
    if (filteredListings.length === 0) return formatAveragePrice(0);
    const total = filteredListings.reduce((sum, l) => sum + l.price, 0);
    const avg = total / filteredListings.length;
    return formatAveragePrice(avg);
  });
  
  function getPerUnitPrice(listing: ListingWithDetails): string {
    // Handle bidding items
    if (listing.price === 0) {
      return "Make an offer";
    }
    
    // Show the per-unit price in natural language
    const pricePerUnit = listing.price;
    const unit = listing.inventory_unit || 'per item';
    
    if (pricePerUnit < 1) {
      const diamonds = (pricePerUnit * 9).toFixed(1);
      return `${diamonds} diamonds ${unit}`;
    } else {
      const blocks = pricePerUnit % 1 === 0 ? pricePerUnit.toString() : pricePerUnit.toFixed(1);
      return `${blocks} diamond blocks ${unit}`;
    }
  }

  function handlePurchase(listing: ListingWithDetails) {
    const unitPrice = formatPrice(listing.price, listing.inventory_unit);
    const totalCost = formatTotalCost(listing.price, listing.qty, listing.inventory_unit);
    const unitText = listing.inventory_unit?.replace('per ', '') || 'item';
    if (confirm(`Purchase ${listing.qty} ${unitText}${listing.qty !== 1 ? 's' : ''} of ${listing.item_name}\n\nPer Unit: ${getPerUnitPrice(listing)}\nRate: ${unitPrice.fullText}\nTotal Cost: ${totalCost.fullText}\n\nFrom: ${listing.seller_name} at stall ${listing.stall_id}`)) {
      onPurchase(listing);
    }
  }
</script>

<div class="marketplace-browser">
  <div class="search-controls">
    <h2>Find Items to Buy</h2>
    <p class="search-help">Browse available items from community members</p>
    
    {#if loading}
      <div class="loading-indicator">
        <p>🔄 Loading marketplace data...</p>
      </div>
    {:else if error}
      <div class="error-message">
        <p>❌ Error: {error}</p>
        <button onclick={loadListings} class="retry-btn">🔄 Retry</button>
      </div>
    {:else}
      <div class="market-status">
        <span class="status-highlight">{totalListings}</span> items available from 
        <span class="status-highlight">{uniqueItems}</span> different types
      </div>
    {/if}
    
    <div class="search-filters">
      <div class="primary-search">
        <label for="search" class="search-label">What are you looking for?</label>
        <input 
          id="search"
          type="text" 
          bind:value={searchTerm}
          placeholder="Type item name (e.g., diamond sword, oak wood)"
          class="search-input"
        />
      </div>
      
      <details class="advanced-filters">
        <summary>More filters</summary>
        <div class="filter-grid">
          <div class="filter-group">
            <label for="listing-type">Show me:</label>
            <select id="listing-type" bind:value={listingType}>
              <option value="all">Everything</option>
              <option value="sell">Items for sale</option>
              <option value="buy">Items wanted</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="maxPrice">Max price:</label>
            <input 
              id="maxPrice"
              type="number" 
              bind:value={maxPrice}
              placeholder="Any price"
              min="1"
            />
            <small>in diamond blocks</small>
          </div>
          
          <div class="filter-group">
            <label for="sellerFilter">From seller:</label>
            <input 
              id="sellerFilter"
              type="text" 
              bind:value={sellerFilter}
              placeholder="Seller name"
            />
          </div>
        </div>
      </details>
    </div>
  </div>
  
  <div class="listings-grid">
    {#if loading}
      <div class="loading-grid">
        <p>🔄 Loading listings...</p>
      </div>
    {:else if error}
      <div class="error-grid">
        <p>❌ Failed to load listings</p>
        <button onclick={loadListings} class="retry-btn">🔄 Retry</button>
      </div>
    {:else}
      {#each filteredListings as listing (listing.listing_id)}
      <article class="item-card {listing.listing_type || 'sell'}" role="article">
        <header class="item-header">
          <div class="item-info">
            <MinecraftItemIcon itemId={listing.item_id} size="medium" />
            <div class="item-details">
              <h3 class="item-name">{listing.item_name}</h3>
              <div class="availability-badge {listing.listing_type || 'sell'}">
                {listing.listing_type === 'buy' ? 'Someone wants this' : 'Available to buy'}
              </div>
            </div>
          </div>
          <div class="price-display">
            <div class="price-main">{getPerUnitPrice(listing)}</div>
            <div class="price-context">per {listing.inventory_unit?.replace('per ', '') || 'item'}</div>
          </div>
        </header>
        
        <div class="item-details">
          <div class="key-info">
            <div class="quantity-info">
              <span class="quantity-label">
                {listing.listing_type === 'buy' ? 'Wants' : 'Available'}:
              </span>
              <span class="quantity-value">
                {listing.qty} {listing.inventory_unit?.replace('per ', '') || 'item'}{listing.qty !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div class="seller-info">
              <span class="seller-label">
                {listing.listing_type === 'buy' ? 'Buyer' : 'Seller'}:
              </span>
              <span class="seller-name">{listing.seller_name}</span>
              {#if listing.stall_id}
                <span class="stall-info">at {listing.stall_id}</span>
              {/if}
            </div>
          </div>
          
          {#if listing.description}
            <div class="item-description">
              <p>{listing.description}</p>
            </div>
          {/if}
          
          {#if listing.contact_info}
            <div class="contact-info">
              <span class="contact-label">Contact:</span> {listing.contact_info}
            </div>
          {/if}
        </div>
        
        <footer class="item-actions">
          <div class="action-info">
            <div class="total-cost">
              <span class="cost-label">Total cost:</span>
              <span class="cost-value">{formatTotalCost(listing.price, listing.qty).text}</span>
            </div>
            <div class="listing-age">
              Listed {new Date(listing.date_created).toLocaleDateString()}
            </div>
          </div>
          
          <button 
            class="action-button {listing.listing_type === 'buy' ? 'contact-action' : 'buy-action'}"
            onclick={() => handlePurchase(listing)}
            type="button"
          >
            {#if listing.listing_type === 'buy'}
              💬 Contact {listing.seller_name}
            {:else}
              🛒 Buy Now
            {/if}
          </button>
        </footer>
      </article>
      {:else}
        <div class="no-results">
          <p>No listings found matching your criteria.</p>
          <p>Try adjusting your search filters.</p>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .marketplace-browser {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: 'Courier New', monospace;
  }
  
  .search-controls {
    background: #f5e6d3;
    padding: 1.5rem;
    border: 2px solid #8b5a3c;
    border-radius: 8px;
    margin-bottom: 2rem;
  }
  
  h2 {
    text-align: center;
    color: #8b5a3c;
    margin-bottom: 1rem;
  }
  
  .stats {
    display: flex;
    gap: 2rem;
    justify-content: center;
    margin-bottom: 1.5rem;
    font-weight: bold;
    color: #5d4037;
  }
  
  .filters {
    display: grid;
    grid-template-columns: 1fr 200px 200px;
    gap: 1rem;
    align-items: end;
  }
  
  .filter-group label {
    display: block;
    margin-bottom: 0.25rem;
    font-weight: bold;
    color: #5d4037;
  }
  
  .checkbox-label {
    display: flex !important;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .filter-group label {
    font-size: 0.9rem;
    color: #ccc;
    font-weight: 500;
  }
  
  .filter-group input,
  .filter-group select {
    padding: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-family: inherit;
  }
  
  .filter-group input:focus,
  .filter-group select:focus {
    outline: none;
    border-color: #ffd700;
    background: rgba(255, 255, 255, 0.15);
  }
  
  .filter-group small {
    color: #888;
    font-size: 0.8rem;
  }
  
  .listing-type-select {
    font-weight: 500;
  }
  
  .listings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }
  
  .listing-card {
    border: 2px solid #8b5a3c;
    border-radius: 8px;
    background: white;
    overflow: hidden;
    transition: transform 0.2s;
  }
  
  /* Sell listings - green theme */
  .listing-card.sell {
    border: 2px solid #10b981;
    background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  }
  
  .listing-card.sell:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    border-color: #059669;
  }
  
  .listing-card.sell .listing-header {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }
  
  /* Buy listings - blue theme */
  .listing-card.buy {
    border: 2px solid #3b82f6;
    background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
  }
  
  .listing-card.buy:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
    border-color: #2563eb;
  }
  
  .listing-card.buy .listing-header {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  }
  
  .listing-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  .listing-header {
    background: #8b5a3c;
    color: white;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .item-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }
  
  .listing-header h3 {
    margin: 0;
    font-size: 1.2rem;
    flex: 1;
  }
  
  .listing-type-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: rgba(255, 255, 255, 0.95);
  }
  
  .price {
    font-weight: bold;
    font-size: 1.1rem;
  }
  
  .item-details {
    padding: 1.5rem;
  }
  
  .key-info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .quantity-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .quantity-label {
    color: #ccc;
    font-size: 0.9rem;
  }
  
  .quantity-value {
    color: #ffd700;
    font-weight: bold;
    font-size: 1.1rem;
  }
  
  .seller-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .seller-label {
    color: #ccc;
    font-size: 0.9rem;
  }
  
  .seller-name {
    color: #81c784;
    font-weight: 500;
  }
  
  .stall-info {
    color: #999;
    font-size: 0.85rem;
  }
  
  .item-description {
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    margin: 1rem 0;
    border-left: 3px solid rgba(255, 215, 0, 0.3);
  }
  
  .item-description p {
    margin: 0;
    color: #e0e0e0;
    font-style: italic;
  }
  
  .contact-info {
    padding: 0.75rem;
    background: rgba(33, 150, 243, 0.1);
    border-radius: 6px;
    font-size: 0.9rem;
    color: #e0e0e0;
    margin-top: 1rem;
  }
  
  .contact-label {
    color: #64b5f6;
    font-weight: 500;
  }
  
  .item-actions {
    padding: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.1);
  }
  
  .action-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .total-cost {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .cost-label {
    color: #ccc;
    font-size: 0.9rem;
  }
  
  .cost-value {
    color: #ffd700;
    font-weight: bold;
    font-size: 1.1rem;
  }
  
  .listing-age {
    color: #999;
    font-size: 0.8rem;
  }
  
  .action-button {
    padding: 1rem 2rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;
    color: white;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  }
  
  .buy-action {
    background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
  }
  
  .buy-action:hover {
    background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
  }
  
  .contact-action {
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
  }
  
  .contact-action:hover {
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
  }
  
  .listed-time {
    font-size: 0.8rem;
    color: #666;
  }
  
  .no-results, .loading-grid, .error-grid {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem;
    color: #666;
  }
  
  .loading-indicator, .error-message {
    text-align: center;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .loading-indicator {
    background: #e3f2fd;
    border: 1px solid #2196f3;
    border-radius: 4px;
    color: #1976d2;
  }
  
  .error-message {
    background: #ffebee;
    border: 1px solid #f44336;
    border-radius: 4px;
    color: #c62828;
  }
  
  .retry-btn {
    background: #2196f3;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    margin-left: 1rem;
    font-family: inherit;
  }
  
  .retry-btn:hover {
    background: #1976d2;
  }
  
  @media (max-width: 768px) {
    .filters {
      grid-template-columns: 1fr;
    }
    
    .listings-grid {
      grid-template-columns: 1fr;
    }
  }
</style>