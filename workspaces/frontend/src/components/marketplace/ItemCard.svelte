<script lang="ts">
  /**
   * ItemCard - Individual item display component
   * Cherry-picked from reference with human-readable pricing
   */
  
  import { formatPrice, formatTotalCost } from '../../utils/price-display.js';
  
  interface Props {
    item: any;
    onPurchase: () => void;
  }
  
  let { item, onPurchase }: Props = $props();
  
  // Extract price information
  let currentPrice = $derived(item.prices?.[0]);
  let unitPrice = $derived(currentPrice ? formatPrice(currentPrice.price_diamond_blocks, currentPrice.trading_unit) : null);
  let totalCost = $derived(currentPrice ? formatTotalCost(currentPrice.price_diamond_blocks, item.stock_quantity, currentPrice.trading_unit) : null);
  
  // Format item details
  let categoryIcon = $derived.by(() => {
    switch (item.category) {
      case 'tools': return '⚒️';
      case 'armor': return '🛡️';
      case 'blocks': return '🧱';
      case 'food': return '🍖';
      case 'misc': return '📦';
      default: return '📦';
    }
  });
  
  let stockStatus = $derived.by(() => {
    if (item.stock_quantity === 0) return { text: 'Out of Stock', class: 'out-of-stock' };
    if (item.stock_quantity < 10) return { text: 'Low Stock', class: 'low-stock' };
    return { text: 'In Stock', class: 'in-stock' };
  });
  
  function handlePurchase() {
    if (item.stock_quantity === 0) {
      alert('This item is currently out of stock.');
      return;
    }
    onPurchase();
  }
</script>

<div class="item-card">
  <div class="item-header">
    <div class="item-title">
      <span class="category-icon">{categoryIcon}</span>
      <h3>{item.name}</h3>
    </div>
    <div class="stock-badge {stockStatus.class}">
      {stockStatus.text}
    </div>
  </div>
  
  <div class="item-details">
    {#if item.description}
      <p class="description">{item.description}</p>
    {/if}
    
    <div class="detail-grid">
      <div class="detail">
        <span class="detail-label">Category:</span>
        <span class="detail-value">{item.category}</span>
      </div>
      
      {#if item.server_name}
        <div class="detail">
          <span class="detail-label">Server:</span>
          <span class="detail-value">{item.server_name}</span>
        </div>
      {/if}
      
      {#if item.shop_location}
        <div class="detail">
          <span class="detail-label">Location:</span>
          <span class="detail-value">{item.shop_location}</span>
        </div>
      {/if}
      
      <div class="detail">
        <span class="detail-label">Stock:</span>
        <span class="detail-value quantity">{item.stock_quantity}</span>
      </div>
    </div>
    
    {#if item.enchantments && Object.keys(item.enchantments).length > 0}
      <div class="enchantments">
        <h4>✨ Enchantments</h4>
        <div class="enchantment-list">
          {#each Object.entries(item.enchantments) as [enchant, level]}
            <span class="enchantment">
              {enchant.replace('_', ' ')} {level}
            </span>
          {/each}
        </div>
      </div>
    {/if}
  </div>
  
  <div class="price-section">
    {#if unitPrice && totalCost}
      <div class="price-info">
        <div class="unit-price">
          <span class="price-label">Unit Price:</span>
          <span class="price-value">{unitPrice.text}</span>
        </div>
        <div class="total-cost">
          <span class="price-label">Total Cost:</span>
          <span class="price-value total">{totalCost.text}</span>
        </div>
      </div>
    {:else}
      <div class="no-price">
        <span>Price not available</span>
      </div>
    {/if}
  </div>
  
  <div class="item-actions">
    <button 
      class="purchase-btn {item.stock_quantity === 0 ? 'disabled' : ''}"
      onclick={handlePurchase}
      disabled={item.stock_quantity === 0}
    >
      {item.stock_quantity === 0 ? '❌ Out of Stock' : '💎 Purchase'}
    </button>
    
    <div class="item-meta">
      <span class="updated-date">
        Updated: {new Date(item.updated_at).toLocaleDateString()}
      </span>
    </div>
  </div>
</div>

<style>
  .item-card {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid var(--color-secondary);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .item-card:hover {
    border-color: var(--color-primary);
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(255, 215, 0, 0.1);
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .item-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .category-icon {
    font-size: 1.5rem;
  }

  .item-title h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 1.2rem;
    line-height: 1.3;
  }

  .stock-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stock-badge.in-stock {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
    border: 1px solid #4caf50;
  }

  .stock-badge.low-stock {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
    border: 1px solid #f59e0b;
  }

  .stock-badge.out-of-stock {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: 1px solid #ef4444;
  }

  .item-details {
    flex: 1;
  }

  .description {
    color: var(--color-text-secondary);
    font-style: italic;
    margin-bottom: 1rem;
    line-height: 1.5;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .detail {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-label {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .detail-value {
    color: var(--color-text-primary);
    font-weight: 500;
  }

  .detail-value.quantity {
    color: var(--color-accent);
    font-weight: bold;
  }

  .enchantments {
    background: rgba(138, 43, 226, 0.1);
    border: 1px solid rgba(138, 43, 226, 0.3);
    border-radius: var(--border-radius);
    padding: 1rem;
    margin-top: 1rem;
  }

  .enchantments h4 {
    margin: 0 0 0.75rem 0;
    color: #dda0dd;
    font-size: 0.9rem;
  }

  .enchantment-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .enchantment {
    background: rgba(138, 43, 226, 0.2);
    border: 1px solid rgba(138, 43, 226, 0.4);
    border-radius: 15px;
    padding: 0.25rem 0.75rem;
    font-size: 0.8rem;
    color: #dda0dd;
    text-transform: capitalize;
  }

  .price-section {
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: var(--border-radius);
    padding: 1rem;
  }

  .price-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .unit-price, .total-cost {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .price-label {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
  }

  .price-value {
    color: var(--color-primary);
    font-weight: bold;
  }

  .price-value.total {
    font-size: 1.1rem;
    color: #ffd700;
  }

  .no-price {
    text-align: center;
    color: var(--color-text-muted);
    font-style: italic;
  }

  .item-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .purchase-btn {
    background: var(--color-accent);
    color: white;
    border: none;
    border-radius: var(--border-radius);
    padding: 0.75rem 1.5rem;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    flex: 1;
    max-width: 200px;
  }

  .purchase-btn:hover:not(.disabled) {
    background: #45a049;
    transform: translateY(-2px);
  }

  .purchase-btn.disabled {
    background: var(--color-text-muted);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .item-meta {
    text-align: right;
  }

  .updated-date {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  @media (max-width: 480px) {
    .item-header {
      flex-direction: column;
      align-items: stretch;
    }
    
    .detail-grid {
      grid-template-columns: 1fr;
    }
    
    .item-actions {
      flex-direction: column;
      align-items: stretch;
    }
    
    .purchase-btn {
      max-width: none;
    }
  }
</style>