<script lang="ts">
  import type { HomepageData } from '../lib/homepage-data.js';
  import { loadHomepageData } from '../lib/homepage-data.js';
  
  interface Props {
    homepageData?: HomepageData;
  }
  
  let { homepageData }: Props = $props();
  let currentData = $state(homepageData);
  let loading = $state(false);
  
  async function navigateToPage(page: number) {
    if (loading || page === currentData?.pagination.currentPage) return;
    
    loading = true;
    try {
      // Load new data without any scrolling animation
      const newData = await loadHomepageData(page);
      currentData = newData;
    } catch (error) {
      console.error('Failed to load page:', error);
    } finally {
      loading = false;
    }
  }
  
  // Use currentData with fallback to original homepageData
  const displayData = $derived(currentData || homepageData);
</script>

<div class="minecraft-marketplace">
  <header class="marketplace-header">
    <h1>Minecraft Item Marketplace</h1>
    <p class="subtitle">Buy and sell Minecraft items with your community</p>
    <div class="quick-actions">
      <button class="primary-action browse-action">
        🔍 Browse Items
      </button>
      <button class="primary-action sell-action">
        💰 Sell Items
      </button>
    </div>
    
    {#if displayData}
      <div class="market-summary">
        <p class="market-status">
          <span class="highlight">{displayData.marketStats.totalItems}</span> items for sale from 
          <span class="highlight">{displayData.marketStats.activeShops}</span> shops
        </p>
      </div>
      
      <div class="market-overview">
        <h3>🌟 Featured Items</h3>
        <div class="market-items">
          {#each displayData.featuredItems as item}
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

      <!-- All Items with Pagination -->
      <div class="all-items-section">
        <h3>📦 All Marketplace Items</h3>
        <div class="pagination-info">
          <p data-testid="current-page">Showing {displayData.allItems.length} of {displayData.pagination.totalItems} items 
             (Page {displayData.pagination.currentPage} of {displayData.pagination.totalPages})</p>
        </div>
        
        {#if loading}
          <div class="loading-overlay">
            <p>🔄 Loading items...</p>
          </div>
        {/if}
        
        <div class="items-grid" class:loading={loading}>
          {#each displayData.allItems as item}
            <div class="item-card">
              <div class="item-header">
                <span class="item-name">{item.name}</span>
                <span class="category-badge">{item.category}</span>
              </div>
              <div class="item-details">
                <p class="item-description">{item.description}</p>
                <div class="item-info">
                  <span class="price-display">{item.priceDisplay}</span>
                </div>
                <div class="shop-info">
                  <span class="shop-name">{item.shopName}</span>
                  <span class="stock-info">{item.stockQuantity} in stock</span>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Pagination Controls -->
        <div class="pagination-controls">
          {#if displayData.pagination.currentPage > 1}
            <button 
              class="pagination-btn" 
              disabled={loading}
              onclick={(e) => {
                e.preventDefault();
                navigateToPage(displayData.pagination.currentPage - 1);
              }}
            >
              {loading ? '⏳' : '←'} Previous
            </button>
          {/if}
          
          {#each Array(Math.min(5, displayData.pagination.totalPages)) as _, i}
            {@const pageNum = i + 1}
            <button 
              class="pagination-btn {pageNum === displayData.pagination.currentPage ? 'active' : ''}"
              disabled={loading || pageNum === displayData.pagination.currentPage}
              onclick={(e) => {
                e.preventDefault();
                navigateToPage(pageNum);
              }}
            >
              {pageNum}
            </button>
          {/each}
          
          {#if displayData.pagination.currentPage < displayData.pagination.totalPages}
            <button 
              class="pagination-btn" 
              disabled={loading}
              onclick={(e) => {
                e.preventDefault();
                navigateToPage(displayData.pagination.currentPage + 1);
              }}
            >
              Next {loading ? '⏳' : '→'}
            </button>
          {/if}
        </div>
      </div>
    {:else}
      <div class="loading-message">
        <p>🔄 Loading marketplace...</p>
      </div>
    {/if}
  </header>
  
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
  
  .category-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: bold;
    text-transform: uppercase;
    background: #8b5a3c;
    color: white;
  }
  
  .market-info {
    color: #9ca3af;
    font-size: 0.8rem;
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
  
  .loading-message {
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
  
  /* All Items Section */
  .all-items-section {
    margin: 3rem 0;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    padding: 2rem;
  }

  .all-items-section h3 {
    margin: 0 0 1.5rem 0;
    color: #ffd700;
    font-size: 1.3rem;
    text-align: center;
  }

  .pagination-info {
    text-align: center;
    margin-bottom: 1.5rem;
    color: #cccccc;
    font-size: 0.9rem;
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .item-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 1.2rem;
    border: 1px solid rgba(255, 215, 0, 0.2);
    transition: all 0.3s ease;
  }

  .item-card:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 215, 0, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.8rem;
  }

  .item-card .item-name {
    font-weight: bold;
    color: #ffd700;
    font-size: 1.1rem;
  }

  .item-description {
    color: #cccccc;
    font-size: 0.9rem;
    margin: 0.5rem 0;
    line-height: 1.4;
  }

  .item-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0.8rem 0;
  }


  .shop-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.8rem;
    font-size: 0.85rem;
  }

  /* Pagination Controls */
  .pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .pagination-btn {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    color: #cccccc;
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
  }

  .pagination-btn:hover {
    background: rgba(255, 215, 0, 0.2);
    color: #ffd700;
    border-color: rgba(255, 215, 0, 0.6);
  }

  .pagination-btn.active {
    background: rgba(255, 215, 0, 0.3);
    color: #ffd700;
    border-color: #ffd700;
    font-weight: bold;
  }

  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .loading-overlay {
    text-align: center;
    padding: 2rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    margin: 1rem 0;
  }

  .loading-overlay p {
    color: #ffd700;
    font-size: 1.1rem;
    margin: 0;
  }

  .items-grid {
    transition: opacity 0.15s ease;
  }

  .items-grid.loading {
    opacity: 0.6;
    pointer-events: none;
  }

  .pagination-controls {
    transition: opacity 0.15s ease;
  }

  .pagination-controls:has(.pagination-btn:disabled) {
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    .quick-actions {
      flex-direction: column;
      gap: 1rem;
      align-items: center;
    }
    
    .primary-action {
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

    .items-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .item-info {
      justify-content: flex-start;
    }

    .pagination-controls {
      gap: 0.3rem;
    }

    .pagination-btn {
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
    }
  }
</style>