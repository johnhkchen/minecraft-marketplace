<!--
  Enhanced Pricing Display - UI/UX Focused Improvements
  Implements the pricing improvements with diamond symbols and trading unit clarity
  Focus on making prices immediately understandable to Minecraft players
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { pricingState, pricingActions, priceDisplay, priceValidation, tradingUnitHelpers } from '../../lib/pricing-display-state.js';
  
  interface Props {
    price: number;
    tradingUnit?: 'per_item' | 'per_stack' | 'per_shulker' | 'per_dozen';
    averagePrice?: number;
    previousPrice?: number;
    itemCategory?: string;
    showContext?: boolean;
    showSuggestions?: boolean;
    isInput?: boolean;
  }
  
  let { 
    price, 
    tradingUnit = 'per_item', 
    averagePrice, 
    previousPrice, 
    itemCategory = '',
    showContext = false,
    showSuggestions = false,
    isInput = false
  }: Props = $props();
  
  // Initialize pricing state when component mounts or props change
  onMount(() => {
    updatePricing();
  });
  
  $: if (price !== undefined) {
    updatePricing();
  }
  
  function updatePricing() {
    // Set basic price
    pricingActions.setPrice(price, tradingUnit);
    
    // Add context if provided
    if (showContext && averagePrice) {
      pricingActions.setPriceContext(price, averagePrice, previousPrice);
    }
    
    // Add suggestions if requested
    if (showSuggestions && itemCategory) {
      pricingActions.setPriceSuggestions(itemCategory);
    }
  }
  
  // Handle price input changes (for shop owners setting prices)
  function handlePriceInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const newPrice = parseFloat(target.value) || 0;
    pricingActions.setPrice(newPrice, tradingUnit);
  }
  
  // Handle trading unit changes
  function handleTradingUnitChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newUnit = target.value as 'per_item' | 'per_stack' | 'per_shulker' | 'per_dozen';
    pricingActions.setPrice(price, newUnit);
  }
</script>

<div class="enhanced-pricing-display">
  {#if isInput}
    <!-- Price Input Mode for Shop Owners -->
    <div class="price-input-section">
      <h4>💰 Set Your Price</h4>
      
      <div class="price-input-controls">
        <div class="price-input-wrapper">
          <label for="price-input">Price:</label>
          <input 
            id="price-input"
            type="number" 
            step="0.1" 
            min="0"
            value={price}
            on:input={handlePriceInput}
            class="price-input"
            data-testid="price-input"
          />
          
          <select on:change={handleTradingUnitChange} class="trading-unit-select">
            <option value="per_item">🔹 Per Item</option>
            <option value="per_stack">📦 Per Stack (64)</option>
            <option value="per_shulker">🟪 Per Shulker (1,728)</option>
            <option value="per_dozen">📦 Per Dozen (12)</option>
          </select>
        </div>
        
        <!-- Live Preview -->
        {#if $pricingState.showsPreview}
          <div class="price-preview" data-testid="price-preview">
            <strong>Preview:</strong> {$pricingState.previewText}
          </div>
        {/if}
        
        <!-- Price Validation -->
        {#if $priceValidation.showWarning}
          <div class="price-warning" data-testid="price-warning">
            ⚠️ {$priceValidation.warningMessage}
          </div>
        {/if}
        
        <!-- Price Suggestions -->
        {#if showSuggestions && $pricingState.showsSuggestions}
          <div class="price-suggestions" data-testid="price-suggestions">
            <div class="suggestion-text">{$pricingState.suggestion}</div>
            {#if $pricingState.suggestedRange}
              <div class="suggested-range">
                Recommended: 💎 {$pricingState.suggestedRange.min} - {$pricingState.suggestedRange.max}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Price Display Mode for Buyers -->
    <div class="price-display-section">
      <!-- Main Price Display -->
      <div class="main-price" data-testid="main-price">
        <span class="price-value">{$priceDisplay.formatted}</span>
        <span class="trading-unit">
          {$tradingUnitHelpers.icon} {$tradingUnitHelpers.display}
        </span>
      </div>
      
      <!-- Large Price Block Display -->
      {#if $pricingState.showAsBlocks}
        <div class="block-display" data-testid="block-display">
          <div class="block-price">{$pricingState.blockDisplay}</div>
          {#if $pricingState.remainingDiamonds > 0}
            <div class="mixed-display">{$pricingState.displayText}</div>
          {/if}
        </div>
      {/if}
      
      <!-- Individual Price Comparison -->
      {#if $pricingState.showBothPrices}
        <div class="price-comparison" data-testid="price-comparison">
          <span class="individual-price">{$pricingState.comparisonText}</span>
        </div>
      {/if}
      
      <!-- Price Context and Trends -->
      {#if showContext}
        <div class="price-context" data-testid="price-context">
          <!-- Deal Indicator -->
          {#if $pricingState.showComparison}
            <div class="deal-indicator" data-testid="deal-indicator">
              {$pricingState.dealIndicator}
            </div>
          {/if}
          
          <!-- Price Trend -->
          {#if $pricingState.showsTrend}
            <div class="price-trend" data-testid="price-trend">
              {$pricingState.trendIndicator} Price trend: {$pricingState.trendDirection}
            </div>
          {/if}
          
          <!-- Price Warning -->
          {#if $pricingState.showWarning}
            <div class="price-warning extreme" data-testid="extreme-price-warning">
              ⚠️ This price is {$pricingState.warningType.replace('_', ' ')}
            </div>
          {/if}
        </div>
      {/if}
      
      <!-- Special Price Handling -->
      {#if price === 0}
        <div class="free-item" data-testid="free-item">
          {$pricingState.zeroDisplay}
        </div>
      {:else if price < 1}
        <div class="low-price" data-testid="low-price">
          Very affordable: {$pricingState.lowPriceDisplay}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .enhanced-pricing-display {
    font-family: 'Minecraft', monospace, sans-serif;
    background: linear-gradient(145deg, #2c3e50, #34495e);
    color: #ecf0f1;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  }
  
  /* Price Input Mode Styles */
  .price-input-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .price-input-section h4 {
    margin: 0;
    color: #f1c40f;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  }
  
  .price-input-controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .price-input-wrapper {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .price-input {
    padding: 0.5rem;
    border: 2px solid #3498db;
    border-radius: 4px;
    background: #34495e;
    color: #ecf0f1;
    font-size: 1rem;
    min-width: 100px;
  }
  
  .price-input:focus {
    outline: none;
    border-color: #f1c40f;
    box-shadow: 0 0 5px rgba(241, 196, 15, 0.5);
  }
  
  .trading-unit-select {
    padding: 0.5rem;
    border: 2px solid #3498db;
    border-radius: 4px;
    background: #34495e;
    color: #ecf0f1;
    font-size: 1rem;
  }
  
  .price-preview {
    padding: 0.5rem;
    background: rgba(52, 152, 219, 0.2);
    border-left: 4px solid #3498db;
    border-radius: 4px;
    font-style: italic;
  }
  
  .price-suggestions {
    padding: 0.75rem;
    background: rgba(46, 204, 113, 0.2);
    border-left: 4px solid #2ecc71;
    border-radius: 4px;
  }
  
  .suggestion-text {
    font-weight: bold;
    margin-bottom: 0.25rem;
  }
  
  .suggested-range {
    font-size: 0.9rem;
    opacity: 0.9;
  }
  
  /* Price Display Mode Styles */
  .price-display-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .main-price {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  
  .price-value {
    font-size: 1.5em;
    font-weight: bold;
    color: #f1c40f;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
    padding: 0.25rem 0.5rem;
    background: rgba(241, 196, 15, 0.1);
    border-radius: 6px;
    border: 2px solid rgba(241, 196, 15, 0.3);
  }
  
  .trading-unit {
    font-size: 0.9em;
    color: #95a5a6;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  .block-display {
    padding: 0.5rem;
    background: rgba(155, 89, 182, 0.2);
    border-left: 4px solid #9b59b6;
    border-radius: 4px;
  }
  
  .block-price {
    font-size: 1.1em;
    font-weight: bold;
    color: #9b59b6;
  }
  
  .mixed-display {
    font-size: 0.9em;
    margin-top: 0.25rem;
    opacity: 0.9;
  }
  
  .price-comparison {
    font-size: 0.9em;
    color: #3498db;
    font-style: italic;
  }
  
  .price-context {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(0,0,0,0.2);
    border-radius: 6px;
  }
  
  .deal-indicator {
    font-weight: bold;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    display: inline-block;
    width: fit-content;
  }
  
  .deal-indicator:contains("🟢") {
    background: rgba(46, 204, 113, 0.3);
    color: #2ecc71;
  }
  
  .deal-indicator:contains("🔴") {
    background: rgba(231, 76, 60, 0.3);
    color: #e74c3c;
  }
  
  .deal-indicator:contains("🟡") {
    background: rgba(241, 196, 15, 0.3);
    color: #f1c40f;
  }
  
  .price-trend {
    font-size: 0.9em;
    color: #95a5a6;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  .price-warning {
    padding: 0.5rem;
    background: rgba(230, 126, 34, 0.3);
    border-left: 4px solid #e67e22;
    border-radius: 4px;
    color: #e67e22;
    font-weight: bold;
  }
  
  .price-warning.extreme {
    background: rgba(231, 76, 60, 0.3);
    border-left-color: #e74c3c;
    color: #e74c3c;
  }
  
  .free-item {
    font-size: 1.2em;
    font-weight: bold;
    color: #2ecc71;
    text-align: center;
    padding: 0.5rem;
    background: rgba(46, 204, 113, 0.2);
    border-radius: 6px;
  }
  
  .low-price {
    font-size: 0.9em;
    color: #3498db;
    text-align: center;
    font-style: italic;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .enhanced-pricing-display {
      padding: 0.75rem;
    }
    
    .main-price {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    .price-value {
      font-size: 1.3em;
    }
    
    .price-input-wrapper {
      flex-direction: column;
      align-items: stretch;
    }
    
    .price-context {
      padding: 0.5rem;
    }
  }
  
  /* Minecraft-style hover effects */
  .price-input:hover, .trading-unit-select:hover {
    border-color: #f39c12;
    transform: translateY(-1px);
    transition: all 0.2s ease;
  }
  
  .main-price:hover .price-value {
    transform: scale(1.05);
    transition: transform 0.2s ease;
  }
  
  /* Animation for price changes */
  .price-value {
    transition: all 0.3s ease;
  }
  
  /* Scannable list formatting */
  .enhanced-pricing-display.in-list {
    padding: 0.5rem;
    margin: 0.25rem 0;
    background: linear-gradient(90deg, #2c3e50, #34495e);
  }
  
  .enhanced-pricing-display.in-list .main-price {
    justify-content: space-between;
  }
  
  .enhanced-pricing-display.in-list .price-value {
    font-size: 1.2em;
  }
</style>