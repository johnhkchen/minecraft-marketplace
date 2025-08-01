<script lang="ts">
  /**
   * SearchFilters - Advanced search and filtering component
   * Cherry-picked from reference with <500ms response requirement
   */
  
  import type { TradingUnitType } from '../../../shared/types/service-interfaces.js';
  
  interface Props {
    searchTerm: string;
    categoryFilter: string;
    serverFilter: string;
    maxPrice?: number;
    tradingUnitFilter: TradingUnitType | '';
    sortBy: 'price' | 'name' | 'updated';
    sortOrder: 'asc' | 'desc';
    onClear: () => void;
    onRefresh: () => void;
  }
  
  let { 
    searchTerm = $bindable(),
    categoryFilter = $bindable(),
    serverFilter = $bindable(),
    maxPrice = $bindable(),
    tradingUnitFilter = $bindable(),
    sortBy = $bindable(),
    sortOrder = $bindable(),
    onClear,
    onRefresh
  }: Props = $props();
  
  // Available filter options
  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'tools', label: '⚒️ Tools' },
    { value: 'armor', label: '🛡️ Armor' },
    { value: 'blocks', label: '🧱 Blocks' },
    { value: 'food', label: '🍖 Food' },
    { value: 'misc', label: '📦 Miscellaneous' }
  ];
  
  const tradingUnits = [
    { value: '', label: 'Any Unit' },
    { value: 'per_item', label: 'Per Item' },
    { value: 'per_stack', label: 'Per Stack (64)' },
    { value: 'per_shulker', label: 'Per Shulker (1,728)' },
    { value: 'per_dozen', label: 'Per Dozen (12)' }
  ];
  
  const sortOptions = [
    { value: 'price', label: 'Price' },
    { value: 'name', label: 'Name' },
    { value: 'updated', label: 'Recently Updated' }
  ];
  
  // Check if any filters are active
  let hasActiveFilters = $derived(
    searchTerm || 
    categoryFilter || 
    serverFilter || 
    maxPrice !== undefined || 
    tradingUnitFilter
  );
</script>

<div class="search-filters">
  <div class="filters-header">
    <h2>🔍 Search & Filter Items</h2>
    <div class="actions">
      {#if hasActiveFilters}
        <button class="btn-secondary" onclick={onClear}>
          Clear Filters
        </button>
      {/if}
      <button class="btn-primary" onclick={onRefresh}>
        🔄 Refresh
      </button>
    </div>
  </div>

  <div class="filters-grid">
    <!-- Search Term -->
    <div class="filter-group">
      <label for="search-term">Search Items</label>
      <input
        id="search-term"
        type="text"
        bind:value={searchTerm}
        placeholder="Search by item name..."
        class="search-input"
      />
    </div>

    <!-- Category Filter -->
    <div class="filter-group">
      <label for="category-filter">Category</label>
      <select id="category-filter" bind:value={categoryFilter}>
        {#each categories as category}
          <option value={category.value}>{category.label}</option>
        {/each}
      </select>
    </div>

    <!-- Server Filter -->
    <div class="filter-group">
      <label for="server-filter">Server</label>
      <input
        id="server-filter"
        type="text"
        bind:value={serverFilter}
        placeholder="Filter by server..."
      />
    </div>

    <!-- Max Price -->
    <div class="filter-group">
      <label for="max-price">Max Price (Diamond Blocks)</label>
      <input
        id="max-price"
        type="number"
        bind:value={maxPrice}
        placeholder="Any price"
        min="0"
        step="0.1"
      />
    </div>

    <!-- Trading Unit Filter -->
    <div class="filter-group">
      <label for="trading-unit">Trading Unit</label>
      <select id="trading-unit" bind:value={tradingUnitFilter}>
        {#each tradingUnits as unit}
          <option value={unit.value}>{unit.label}</option>
        {/each}
      </select>
    </div>

    <!-- Sort Options -->
    <div class="filter-group">
      <label for="sort-by">Sort By</label>
      <div class="sort-controls">
        <select id="sort-by" bind:value={sortBy}>
          {#each sortOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
        <button 
          class="sort-order-btn {sortOrder === 'asc' ? 'asc' : 'desc'}"
          onclick={() => sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'}
          title={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .search-filters {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid var(--color-secondary);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    margin-bottom: 2rem;
    backdrop-filter: blur(10px);
  }

  .filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .filters-header h2 {
    color: var(--color-primary);
    margin: 0;
    font-size: 1.5rem;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-group label {
    font-weight: 500;
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .search-input {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid transparent;
    border-radius: var(--border-radius);
    padding: 0.75rem;
    color: var(--color-text-primary);
    font-size: 1rem;
    transition: all 0.2s ease;
  }

  .search-input:focus {
    border-color: var(--color-primary);
    background: rgba(255, 255, 255, 0.15);
  }

  select, input[type="number"], input[type="text"] {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid transparent;
    border-radius: var(--border-radius);
    padding: 0.75rem;
    color: var(--color-text-primary);
    font-family: inherit;
    transition: all 0.2s ease;
  }

  select:focus, input:focus {
    border-color: var(--color-primary);
    background: rgba(255, 255, 255, 0.15);
    outline: none;
  }

  .sort-controls {
    display: flex;
    gap: 0.5rem;
  }

  .sort-controls select {
    flex: 1;
  }

  .sort-order-btn {
    width: 3rem;
    height: 3rem;
    border: 2px solid var(--color-secondary);
    border-radius: var(--border-radius);
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary);
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sort-order-btn:hover {
    border-color: var(--color-primary);
    background: rgba(255, 255, 255, 0.15);
  }

  .sort-order-btn.asc {
    color: var(--color-accent);
  }

  .sort-order-btn.desc {
    color: var(--color-warning);
  }

  @media (max-width: 768px) {
    .filters-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
    
    .filters-grid {
      grid-template-columns: 1fr;
    }
    
    .actions {
      justify-content: center;
    }
  }
</style>