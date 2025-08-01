<script lang="ts">
  import type { MarketData } from '../types/marketplace.js';
  
  interface Props {
    marketData: MarketData | null;
  }
  
  let { marketData }: Props = $props();
  
  function formatPrice(price: number | null | undefined): string {
    if (!price) return 'N/A';
    if (price < 1) {
      const diamonds = (price * 9).toFixed(1);
      return `${diamonds} diamonds`;
    } else {
      const blocks = price % 1 === 0 ? price.toString() : price.toFixed(1);
      return `${blocks} DB`;
    }
  }
  
  function getActivityColor(activity: string): string {
    switch (activity) {
      case 'high': return '#4ade80'; // green
      case 'medium': return '#fbbf24'; // yellow
      case 'low': return '#fb7185'; // pink
      case 'dead': return '#6b7280'; // gray
      default: return '#6b7280';
    }
  }
  
  function getMarketSummary(data: MarketData): string {
    if (data.active_sellers === 0 && data.active_buyers === 0) {
      return 'No current market activity';
    }
    
    const parts = [];
    if (data.active_sellers > 0) {
      parts.push(`${data.active_sellers} seller${data.active_sellers > 1 ? 's' : ''}`);
    }
    if (data.active_buyers > 0) {
      parts.push(`${data.active_buyers} buyer${data.active_buyers > 1 ? 's' : ''}`);
    }
    
    return parts.join(', ');
  }
</script>

{#if marketData}
  <div class="market-context">
    <div class="market-header">
      <h4>{marketData.item_name} Market</h4>
      <div class="activity-indicator" style="background-color: {getActivityColor(marketData.market_activity)}">
        {marketData.market_activity.toUpperCase()}
      </div>
    </div>
    
    <div class="market-summary">
      {getMarketSummary(marketData)}
    </div>
    
    <div class="price-context">
      <div class="price-row">
        <div class="price-section">
          <h5>Current Offers</h5>
          <div class="price-range">
            {#if marketData.current_sell_low && marketData.current_sell_high}
              <div class="sell-range">
                <span class="label">For Sale:</span>
                <span class="range">
                  {formatPrice(marketData.current_sell_low)}
                  {#if marketData.current_sell_low !== marketData.current_sell_high}
                    - {formatPrice(marketData.current_sell_high)}
                  {/if}
                </span>
              </div>
            {/if}
            
            {#if marketData.current_buy_low && marketData.current_buy_high}
              <div class="buy-range">
                <span class="label">Wanted:</span>
                <span class="range">
                  {formatPrice(marketData.current_buy_low)}
                  {#if marketData.current_buy_low !== marketData.current_buy_high}
                    - {formatPrice(marketData.current_buy_high)}
                  {/if}
                </span>
              </div>
            {/if}
          </div>
        </div>
        
        {#if marketData.last_trade_price}
          <div class="price-section">
            <h5>Recent Trade</h5>
            <div class="last-trade">
              <span class="price">{formatPrice(marketData.last_trade_price)}</span>
              {#if marketData.last_trade_date}
                <span class="date">
                  {new Date(marketData.last_trade_date).toLocaleDateString()}
                </span>
              {/if}
            </div>
          </div>
        {/if}
      </div>
      
      {#if marketData.spread_percentage}
        <div class="spread-info">
          <span class="label">Spread:</span>
          <span class="spread">{marketData.spread_percentage}%</span>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .market-context {
    background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
    border: 1px solid #4b5563;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    color: #f9fafb;
  }
  
  .market-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  
  .market-header h4 {
    margin: 0;
    color: #f59e0b;
    font-size: 1.1rem;
  }
  
  .activity-indicator {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    color: #1f2937;
    font-size: 0.75rem;
    font-weight: bold;
  }
  
  .market-summary {
    color: #d1d5db;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }
  
  .price-context {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .price-row {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }
  
  .price-section {
    flex: 1;
    min-width: 150px;
  }
  
  .price-section h5 {
    margin: 0 0 0.5rem 0;
    color: #9ca3af;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .price-range {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .sell-range, .buy-range {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .sell-range .label {
    color: #ef4444;
  }
  
  .buy-range .label {
    color: #10b981;
  }
  
  .range {
    font-weight: bold;
    color: #f9fafb;
  }
  
  .last-trade {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .last-trade .price {
    font-weight: bold;
    color: #f59e0b;
  }
  
  .last-trade .date {
    font-size: 0.8rem;
    color: #9ca3af;
  }
  
  .spread-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.5rem;
    border-top: 1px solid #4b5563;
    font-size: 0.9rem;
  }
  
  .spread-info .label {
    color: #9ca3af;
  }
  
  .spread-info .spread {
    font-weight: bold;
    color: #f59e0b;
  }
</style>