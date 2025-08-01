<script lang="ts">
  import type { ListingWithDetails, ShopListing, MarketData } from '../types/marketplace.js';
  import type { HomepageData } from '../lib/homepage-data.js';
  import ListingForm from './ListingForm.svelte';
  import MarketplaceBrowser from './MarketplaceBrowser.svelte';
  import MarketContext from './MarketContext.svelte';
  import { formatPriceRange, formatPrice, formatTotalCost } from '../lib/price-display.js';
  
  // Homepage data passed from Astro
  interface Props {
    homepageData?: HomepageData;
  }
  
  let { homepageData }: Props = $props();
  
  let listings = $state<ListingWithDetails[]>([]);
  let currentView = $state<'browse' | 'sell'>('browse');
  let loading = $state(false);
  let error = $state<string | null>(null);
  let marketOverview = $state<MarketData[]>([]);
  let selectedItemMarket = $state<MarketData | null>(null);
  
  // Load listings from API
  async function loadListings() {
    console.log('🔄 Loading listings...');
    loading = true;
    error = null;
    try {
      const response = await fetch('/api/listings?is_active=true');
      console.log('📡 API response status:', response.status);
      if (!response.ok) throw new Error('Failed to fetch listings');
      const data = await response.json();
      console.log('📦 Received listings:', data.length);
      listings = data;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load listings';
      console.error('❌ Error loading listings:', e);
    } finally {
      loading = false;
      console.log('✅ Listings load complete. Total:', listings.length);
    }
  }
  
  // Load market overview data
  async function loadMarketOverview() {
    try {
      const response = await fetch('/api/market-data');
      if (!response.ok) throw new Error('Failed to fetch market data');
      const data = await response.json();
      marketOverview = data;
    } catch (e) {
      console.error('Error loading market overview:', e);
    }
  }

  // Load listings on component mount (only if no homepage data provided)
  $effect(() => {
    if (!homepageData) {
      loadListings();
      loadMarketOverview();
    }
  });
  
  async function handleNewListing(newListingData: {
    seller_name: string;
    stall_id: string;
    item_name: string;
    qty: number;
    price: number;
    description?: string;
    inventory_unit?: string;
    listing_type?: 'buy' | 'sell';
  }) {
    try {
      // Convert form data to API format
      const apiData = {
        seller_id: newListingData.seller_name.toLowerCase().replace(/\s+/g, '_'),
        item_id: newListingData.item_name.toLowerCase().replace(/\s+/g, '_'),
        qty: newListingData.qty,
        price: newListingData.price,
        description: newListingData.description,
        inventory_unit: newListingData.inventory_unit,
        listing_type: newListingData.listing_type || 'sell',
        // Additional data for seller/item creation
        seller_name: newListingData.seller_name,
        stall_id: newListingData.stall_id,
        item_name: newListingData.item_name
      };
      
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      });
      
      if (!response.ok) throw new Error('Failed to create listing');
      
      // Reload listings to show the new one
      await loadListings();
      currentView = 'browse';
      
      const listingTypeText = newListingData.listing_type === 'buy' ? 'buy request' : 'listing';
      alert(`Successfully created ${listingTypeText} for ${newListingData.qty} ${newListingData.inventory_unit?.replace('per ', '') || 'item'}${newListingData.qty !== 1 ? 's' : ''} of ${newListingData.item_name}!`);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create listing';
      console.error('Error creating listing:', e);
    }
  }
  
  async function handlePurchase(listing: ListingWithDetails) {
    if (listing.listing_type === 'buy') {
      // This is a buy listing - show contact information
      const contactInfo = listing.contact_info || 'No contact information provided';
      const message = `Contact ${listing.seller_name} to sell your ${listing.item_name}:\n\n` +
        `They want: ${listing.qty} ${listing.inventory_unit?.replace('per ', '') || 'item'}${listing.qty !== 1 ? 's' : ''}\n` +
        `Offering: ${formatPrice(listing.price, listing.inventory_unit).fullText}\n\n` +
        `Contact: ${contactInfo}`;
      
      alert(message);
      return;
    }
    
    // This is a sell listing - handle purchase
    try {
      // Create a transaction record
      const transactionData = {
        listing_id: listing.listing_id,
        buyer_id: 'anonymous_buyer', // In real app, get from auth
        seller_id: listing.seller_id,
        qty_purchased: listing.qty,
        total_price: listing.qty * listing.price,
        change_given: 0, // Calculate based on payment
        status: 'pending' as const
      };
      
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData)
      });
      
      if (!response.ok) throw new Error('Failed to create transaction');
      
      const unitPrice = formatPrice(listing.price, listing.inventory_unit);
      const totalCost = formatTotalCost(listing.price, listing.qty, listing.inventory_unit);
      const unitText = listing.inventory_unit?.replace('per ', '') || 'item';
      alert(`Purchase intent signaled!\n\n${listing.qty}x ${unitText} ${listing.item_name}\nUnit: ${unitPrice.fullText}\nTotal: ${totalCost.fullText}\n\nHead to ${listing.seller_name} at stall ${listing.stall_id} in the redstone mall to complete the transaction!`);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to signal purchase';
      console.error('Error creating transaction:', e);
    }
  }
  
  let totalListings = $derived(homepageData?.marketStats.totalItems || listings.filter(l => l.is_active !== false).length);
  
  let uniqueItems = $derived(homepageData?.categories.length || new Set(listings.filter(l => l.is_active !== false).map(l => l.item_name)).size);
  
  let activeShops = $derived(homepageData?.marketStats.activeShops || 0);
  
  let priceRange = $derived.by(() => {
    if (homepageData?.featuredItems?.length) {
      const prices = homepageData.featuredItems.map(item => item.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return formatPriceRange(min, max);
    }
    const activePrices = listings.filter(l => l.is_active !== false).map(l => l.price);
    if (activePrices.length === 0) return formatPriceRange(0, 0);
    const min = Math.min(...activePrices);
    const max = Math.max(...activePrices);
    return formatPriceRange(min, max);
  });
</script>

<div class="minecraft-marketplace">
  <header class="marketplace-header">
    <h1>Minecraft Item Marketplace</h1>
    <p class="subtitle">Buy and sell Minecraft items with your community</p>
    <div class="quick-actions">
      <button class="primary-action browse-action" onclick={() => currentView = 'browse'}>
        🔍 Browse Items
      </button>
      <button class="primary-action sell-action" onclick={() => currentView = 'sell'}>
        💰 Sell Items
      </button>
    </div>
    
    <div class="market-summary">
      <p class="market-status">
        <span class="highlight">{totalListings}</span> items for sale from 
        <span class="highlight">{activeShops}</span> shops
      </p>
    </div>
    
    {#if homepageData?.featuredItems?.length}
      <div class="market-overview">
        <h3>🌟 Featured Items</h3>
        <div class="market-items">
          {#each homepageData.featuredItems.slice(0, 4) as item}
            <div class="market-item">
              <span class="item-name">{item.name}</span>
              <span class="category-badge">{item.category}</span>
              <span class="market-info">
                <span class="shop-name">{item.shopName}</span>
                | <span class="price-display">{item.priceDisplay}</span>
                | <span class="stock-info">{item.stockQuantity} in stock</span>
              </span>
            </div>
          {/each}
        </div>
      </div>
    {:else if marketOverview.length > 0}
      <div class="market-overview">
        <h3>Market Activity</h3>
        <div class="market-items">
          {#each marketOverview.slice(0, 5) as item}
            <div class="market-item">
              <span class="item-name">{item.item_name}</span>
              <span class="activity-badge {item.market_activity}">{item.market_activity}</span>
              <span class="market-info">
                <span class="sell-info">{item.active_sellers}S</span>/<span class="buy-info">{item.active_buyers}B</span>
                {#if item.current_sell_low && item.current_buy_high}
                  | <span class="buy-price">{formatPrice(item.current_buy_high, 'per item').text}</span> - <span class="sell-price">{formatPrice(item.current_sell_low, 'per item').text}</span>
                {/if}
              </span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
    
    <!-- Navigation moved to quick actions above -->
  </header>
  
  <div class="marketplace-content">
    {#if error}
      <div class="error-message">
        <p>❌ {error}</p>
        <button onclick={() => loadListings()}>Retry</button>
      </div>
    {:else if loading && listings.length === 0}
      <div class="loading-message">
        <p>🔄 Loading marketplace...</p>
      </div>
    {:else if currentView === 'browse'}
      <MarketplaceBrowser 
        onPurchase={handlePurchase}
      />
    {:else}
      <ListingForm 
        onSubmit={handleNewListing}
      />
    {/if}
  </div>
  
  <footer class="marketplace-footer">
    <div class="footer-main">
      <p>💎 All prices in diamonds</p>
      <p>Need help? <a href="#help">Contact support</a></p>
    </div>
    <div class="footer-tech">
      <details>
        <summary>Technical details</summary>
        <div class="tech-info">
          <span>Built with Astro, Svelte, and PostgreSQL</span>
          <span>Deployed with Docker</span>
        </div>
      </details>
    </div>
  </footer>
</div>

<style>
  .minecraft-marketplace {
    min-height: 100vh;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    color: white;
  }
  
  .marketplace-header {
    background: rgba(0, 0, 0, 0.3);
    padding: 2rem;
    text-align: center;
    border-bottom: 2px solid #8b5a3c;
  }
  
  h1 {
    font-size: 2.5rem;
    margin: 0;
    color: #ffd700;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }
  
  .subtitle {
    font-size: 1.2rem;
    margin: 0.5rem 0 1rem 0;
    color: #cccccc;
  }
  
  .quick-actions {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin: 2rem 0;
    flex-wrap: wrap;
  }
  
  .primary-action {
    padding: 1.25rem 2.5rem;
    font-size: 1.3rem;
    font-weight: bold;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: inherit;
    color: white;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  .browse-action {
    background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  }
  
  .browse-action:hover {
    background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(76, 175, 80, 0.3);
  }
  
  .sell-action {
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  }
  
  .sell-action:hover {
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(33, 150, 243, 0.3);
  }
  
  @keyframes pulse {
    0% { box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3); }
    50% { box-shadow: 0 2px 12px rgba(16, 185, 129, 0.6); }
    100% { box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3); }
  }
  
  .market-summary {
    margin: 1.5rem 0;
    text-align: center;
  }
  
  .market-status {
    font-size: 1.1rem;
    color: #e0e0e0;
    margin: 0;
  }
  
  .highlight {
    color: #ffd700;
    font-weight: bold;
    font-size: 1.2em;
  }
  
  .market-overview {
    margin: 2rem 0;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    padding: 1.5rem;
  }
  
  .market-overview h3 {
    margin: 0 0 1rem 0;
    color: #ffd700;
    font-size: 1.2rem;
  }
  
  .market-items {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .market-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .item-name {
    flex: 1;
    font-weight: bold;
  }
  
  .activity-badge, .category-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: bold;
    text-transform: uppercase;
  }
  
  .category-badge {
    background: #8b5a3c;
    color: white;
  }
  
  .activity-badge.high {
    background: #10b981;
    color: white;
  }
  
  .activity-badge.medium {
    background: #f59e0b;
    color: white;
  }
  
  .activity-badge.low {
    background: #ef4444;
    color: white;
  }
  
  .activity-badge.dead {
    background: #6b7280;
    color: white;
  }
  
  .market-info {
    color: #9ca3af;
    font-size: 0.8rem;
  }
  
  .sell-info {
    color: #10b981;
    font-weight: bold;
  }
  
  .buy-info {
    color: #3b82f6;
    font-weight: bold;
  }
  
  .sell-price {
    color: #10b981;
    font-weight: 500;
  }
  
  .buy-price {
    color: #3b82f6;
    font-weight: 500;
  }
  
  .shop-name {
    color: #ffd700;
    font-weight: 500;
  }
  
  .price-display {
    color: #10b981;
    font-weight: bold;
  }
  
  .stock-info {
    color: #9ca3af;
    font-style: italic;
  }
  
  .navigation {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
  
  .nav-button {
    padding: 1rem 2rem;
    background: #8b5a3c;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: inherit;
  }
  
  .nav-button:hover {
    background: #a0693d;
    transform: translateY(-2px);
  }
  
  .nav-button.active {
    background: #4caf50;
    box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
  }
  
  .marketplace-content {
    padding: 2rem;
    min-height: 60vh;
  }
  
  .marketplace-footer {
    background: rgba(0, 0, 0, 0.2);
    padding: 1.5rem;
    text-align: center;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin-top: 2rem;
  }
  
  .footer-main {
    margin-bottom: 1rem;
  }
  
  .footer-main p {
    margin: 0.5rem 0;
    color: #cccccc;
  }
  
  .footer-main a {
    color: #ffd700;
    text-decoration: none;
  }
  
  .footer-main a:hover {
    text-decoration: underline;
  }
  
  .footer-tech details {
    display: inline-block;
  }
  
  .footer-tech summary {
    color: #999;
    font-size: 0.8rem;
    cursor: pointer;
    padding: 0.25rem;
  }
  
  .footer-tech summary:hover {
    color: #ffd700;
  }
  
  .tech-info {
    margin-top: 0.5rem;
    font-size: 0.7rem;
    color: #888;
  }
  
  .tech-info span {
    display: block;
    margin: 0.2rem 0;
  }
  
  .loading-message, .error-message {
    text-align: center;
    padding: 3rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    margin: 2rem auto;
    max-width: 400px;
  }
  
  .loading-message p {
    font-size: 1.2rem;
    color: #ffd700;
  }
  
  .error-message p {
    font-size: 1.2rem;
    color: #ff6b6b;
    margin-bottom: 1rem;
  }
  
  .error-message button {
    padding: 0.75rem 1.5rem;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    font-family: inherit;
  }
  
  .error-message button:hover {
    background: #45a049;
  }
  
  @media (max-width: 768px) {
    .market-stats {
      flex-direction: column;
      gap: 1rem;
      align-items: center;
    }
    
    .stat {
      min-width: 200px;
    }
    
    .server-info {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .navigation {
      flex-direction: column;
      align-items: center;
    }
    
    .nav-button {
      width: 100%;
      max-width: 300px;
    }
    
    .footer-tech {
      gap: 0.5rem;
    }
    
    .footer-tech span {
      font-size: 0.7rem;
      padding: 0.2rem 0.4rem;
    }
    
    h1 {
      font-size: 2rem;
    }
  }
</style>