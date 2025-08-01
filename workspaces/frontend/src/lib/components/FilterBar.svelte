<!--
  Enhanced Filter Bar Component
  TDD-driven implementation for Enhanced HATEOAS Filtering
-->
<script lang="ts">
  import type { FilterState } from '../enhanced-homepage-data.js';

  // Component Props Interface (matches TDD test requirements)
  export interface FilterBarProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    showAdvancedFilters: boolean;
  }

  // Props
  export let filters: FilterState = {};
  export let onFiltersChange: (filters: FilterState) => void;
  export let showAdvancedFilters: boolean = false;

  // Local state for form inputs
  let localFilters = { ...filters };

  // Biome options for Minecraft locations
  const biomeOptions = [
    { value: 'any', label: 'Any Biome' },
    { value: 'jungle', label: '🌿 Jungle' },
    { value: 'desert', label: '🏜️ Desert' },
    { value: 'ocean', label: '🌊 Ocean' },
    { value: 'mountains', label: '⛰️ Mountains' },
    { value: 'plains', label: '🌱 Plains' },
    { value: 'nether', label: '🔥 Nether' },
    { value: 'end', label: '🌌 End' }
  ];

  // Direction options for Minecraft coordinates
  const directionOptions = [
    { value: 'any', label: 'Any Direction' },
    { value: 'north', label: '⬆️ North' },
    { value: 'south', label: '⬇️ South' },
    { value: 'east', label: '➡️ East' },
    { value: 'west', label: '⬅️ West' },
    { value: 'spawn', label: '🏠 Spawn' }
  ];

  // Verification options
  const verificationOptions = [
    { value: 'any', label: 'Any Status' },
    { value: 'verified', label: '✅ Verified Only' },
    { value: 'unverified', label: '❓ Unverified' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'price_desc', label: 'Price (High to Low)' },
    { value: 'price_asc', label: 'Price (Low to High)' },
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'recent', label: 'Recently Added' },
    { value: 'verified_first', label: 'Verified First' }
  ];

  // Handle filter changes
  function handleFilterChange() {
    onFiltersChange(localFilters);
  }

  // Reset all filters
  function resetFilters() {
    localFilters = {};
    onFiltersChange(localFilters);
  }

  // Toggle advanced filters
  function toggleAdvancedFilters() {
    showAdvancedFilters = !showAdvancedFilters;
  }

  // Update local filters when props change
  $: localFilters = { ...filters };
</script>

<div class="filter-bar" data-testid="filter-bar">
  <div class="filter-section">
    <h3>🔍 Filter Marketplace</h3>
    
    <!-- Search Input -->
    <div class="filter-group">
      <label for="search">Search Items:</label>
      <input
        id="search"
        type="text"
        bind:value={localFilters.search}
        on:input={handleFilterChange}
        placeholder="Search by item name..."
        data-testid="search-input"
      />
    </div>

    <!-- Category Filter -->
    <div class="filter-group">
      <label for="category">Category:</label>
      <select
        id="category"
        bind:value={localFilters.category}
        on:change={handleFilterChange}
        data-testid="category-select"
      >
        <option value="">All Categories</option>
        <option value="weapons">⚔️ Weapons</option>
        <option value="tools">🔧 Tools</option>
        <option value="armor">🛡️ Armor</option>
        <option value="blocks">🧱 Blocks</option>
        <option value="food">🍖 Food</option>
        <option value="misc">📦 Miscellaneous</option>
      </select>
    </div>

    <!-- Enhanced Filters Row -->
    <div class="enhanced-filters">
      <!-- Biome Filter -->
      <div class="filter-group">
        <label for="biome">Biome:</label>
        <select
          id="biome"
          bind:value={localFilters.biome}
          on:change={handleFilterChange}
          data-testid="biome-select"
        >
          {#each biomeOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <!-- Direction Filter -->
      <div class="filter-group">
        <label for="direction">Direction:</label>
        <select
          id="direction"
          bind:value={localFilters.direction}
          on:change={handleFilterChange}
          data-testid="direction-select"
        >
          {#each directionOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <!-- Verification Filter -->
      <div class="filter-group">
        <label for="verification">Verification:</label>
        <select
          id="verification"
          bind:value={localFilters.verification}
          on:change={handleFilterChange}
          data-testid="verification-select"
        >
          {#each verificationOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Advanced Filters (Price Range) -->
    {#if showAdvancedFilters}
      <div class="advanced-filters" data-testid="advanced-filters">
        <div class="filter-group">
          <label>Price Range (Diamonds):</label>
          <div class="price-range">
            <input
              type="number"
              bind:value={localFilters.priceRange?.min}
              on:input={handleFilterChange}
              placeholder="Min"
              min="0"
              data-testid="price-min-input"
            />
            <span>to</span>
            <input
              type="number"
              bind:value={localFilters.priceRange?.max}
              on:input={handleFilterChange}
              placeholder="Max"
              min="0"
              data-testid="price-max-input"
            />
            <span>💎</span>
          </div>
        </div>
      </div>
    {/if}

    <!-- Sort Options -->
    <div class="filter-group">
      <label for="sortBy">Sort By:</label>
      <select
        id="sortBy"
        bind:value={localFilters.sortBy}
        on:change={handleFilterChange}
        data-testid="sort-select"
      >
        {#each sortOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>

    <!-- Action Buttons -->
    <div class="filter-actions">
      <button
        type="button"
        on:click={toggleAdvancedFilters}
        data-testid="toggle-advanced-btn"
      >
        {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
      </button>
      
      <button
        type="button"
        on:click={resetFilters}
        data-testid="reset-filters-btn"
      >
        Reset All Filters
      </button>
    </div>
  </div>
</div>

<style>
  .filter-bar {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .filter-section h3 {
    margin: 0 0 1rem 0;
    color: #495057;
  }

  .filter-group {
    margin-bottom: 1rem;
  }

  .filter-group label {
    display: block;
    margin-bottom: 0.25rem;
    font-weight: 500;
    color: #495057;
  }

  .filter-group input,
  .filter-group select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .enhanced-filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .advanced-filters {
    background: #f1f3f4;
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }

  .price-range {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .price-range input {
    flex: 1;
    width: auto;
  }

  .filter-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .filter-actions button {
    padding: 0.5rem 1rem;
    border: 1px solid #007bff;
    background: #007bff;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .filter-actions button:hover {
    background: #0056b3;
    border-color: #0056b3;
  }

  .filter-actions button:last-child {
    background: #6c757d;
    border-color: #6c757d;
  }

  .filter-actions button:last-child:hover {
    background: #545b62;
    border-color: #545b62;
  }

  @media (max-width: 768px) {
    .enhanced-filters {
      grid-template-columns: 1fr;
    }
    
    .filter-actions {
      flex-direction: column;
    }
  }
</style>