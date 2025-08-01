<!--
  Enhanced Search Interface - UI/UX Focused Improvements
  Implements the failing test requirements with visual feedback and loading states
  Focus on user experience over complex technical features
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { searchState, searchActions, searchStatus, performanceFeedback, userGuidance } from '../../lib/search-interface-state.js';
  
  interface Props {
    onSearch?: (term: string, filters: any) => Promise<any[]>;
  }
  
  let { onSearch }: Props = $props();
  
  // Reactive state from our stores
  let searchTerm = '';
  let showSuggestions = false;
  let suggestions: string[] = [];
  
  // Handle search input changes
  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    searchTerm = target.value;
    
    // Update suggestions as user types
    searchActions.updateSuggestions(searchTerm);
    
    // Subscribe to suggestions
    userGuidance.subscribe(guidance => {
      suggestions = guidance.suggestions;
      showSuggestions = guidance.showSuggestions && searchTerm.length >= 2;
    });
  }
  
  // Handle search submission
  async function handleSearch() {
    if (!searchTerm.trim()) return;
    
    // Start search with loading state
    searchActions.startSearch(searchTerm);
    
    // Set up slow search warning after 1 second
    const slowSearchTimer = setTimeout(() => {
      searchActions.handleSlowSearch();
    }, 1000);
    
    try {
      const startTime = Date.now();
      
      // Call the search function if provided, otherwise use mock data
      const results = onSearch 
        ? await onSearch(searchTerm, {})
        : mockSearchResults(searchTerm);
      
      const duration = Date.now() - startTime;
      clearTimeout(slowSearchTimer);
      
      // Complete search with results
      searchActions.completeSearch(results, duration);
      
      // If no results, show guidance
      if (results.length === 0) {
        searchActions.showNoResultsGuidance();
      } else {
        searchActions.organizeResults();
      }
      
    } catch (error) {
      clearTimeout(slowSearchTimer);
      searchActions.handleSearchError(error.message);
    }
  }
  
  // Mock search results for demonstration
  function mockSearchResults(term: string): any[] {
    const allItems = [
      { id: 1, name: 'Diamond Sword', category: 'weapons', biome: 'jungle' },
      { id: 2, name: 'Diamond Pickaxe', category: 'tools', biome: 'mountain' },
      { id: 3, name: 'Diamond Armor', category: 'armor', biome: 'desert' },
      { id: 4, name: 'Iron Sword', category: 'weapons', biome: 'forest' },
      { id: 5, name: 'Jungle Wood', category: 'blocks', biome: 'jungle' }
    ];
    
    // Simple search logic
    return allItems.filter(item => 
      item.name.toLowerCase().includes(term.toLowerCase()) ||
      item.category.toLowerCase().includes(term.toLowerCase()) ||
      item.biome.toLowerCase().includes(term.toLowerCase())
    );
  }
  
  // Handle input focus
  function handleFocus() {
    searchActions.setFocusState(true);
  }
  
  function handleBlur() {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => {
      searchActions.setFocusState(false);
      showSuggestions = false;
    }, 200);
  }
  
  // Handle suggestion selection
  function selectSuggestion(suggestion: string) {
    searchTerm = suggestion;
    showSuggestions = false;
    handleSearch();
  }
  
  // Check network connectivity
  onMount(() => {
    function updateOnlineStatus() {
      searchActions.setOfflineState(navigator.onLine);
    }
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  });
</script>

<div class="enhanced-search-interface">
  <div class="search-header">
    <h2>🔍 Enhanced Search</h2>
    
    <!-- Offline indicator -->
    {#if !$searchState.isOnline}
      <div class="offline-indicator">
        ⚠️ {$searchState.offlineMessage}
      </div>
    {/if}
  </div>

  <!-- Search input with suggestions -->
  <div class="search-input-container">
    <div class="input-wrapper">
      <input
        type="text"
        bind:value={searchTerm}
        placeholder={$userGuidance.placeholder}
        class="search-input"
        on:input={handleSearchInput}
        on:focus={handleFocus}
        on:blur={handleBlur}
        on:keydown={(e) => e.key === 'Enter' && handleSearch()}
        data-testid="search-input"
      />
      
      <!-- Loading spinner -->
      {#if $searchState.showSpinner}
        <div class="loading-spinner" data-testid="loading-spinner">
          ⚪ Searching...
        </div>
      {/if}
      
      <!-- Search button -->
      <button 
        class="search-button" 
        onclick={handleSearch}
        disabled={$searchState.isLoading}
        data-testid="search-button"
      >
        {$searchState.isLoading ? '⏳' : '🔍'}
      </button>
    </div>
    
    <!-- Search suggestions dropdown -->
    {#if showSuggestions && suggestions.length > 0}
      <div class="suggestions-dropdown" data-testid="suggestions">
        {#each suggestions as suggestion}
          <button 
            class="suggestion-item"
            onclick={() => selectSuggestion(suggestion)}
          >
            {suggestion}
          </button>
        {/each}
      </div>
    {/if}
    
    <!-- Input hints when focused -->
    {#if $userGuidance.showHints}
      <div class="search-hints">
        {#each $userGuidance.hints as hint}
          <div class="hint">{hint}</div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Search status and feedback -->
  <div class="search-feedback">
    <!-- Progress message -->
    {#if $searchState.message}
      <div class="search-message" data-testid="search-message">
        {$searchState.message}
      </div>
    {/if}
    
    <!-- Performance feedback -->
    {#if $performanceFeedback.showTiming}
      <div class="timing-feedback" data-testid="timing-feedback">
        {$performanceFeedback.timingMessage}
      </div>
    {/if}
    
    <!-- Slow search warning -->
    {#if $searchState.isSlowSearch}
      <div class="slow-search-warning">
        {$searchState.slowSearchMessage}
        {#if $searchState.showProgressBar}
          <div class="progress-bar">
            <div class="progress-bar-fill"></div>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- Error handling -->
    {#if $searchState.hasError}
      <div class="error-message" data-testid="error-message">
        ❌ {$searchState.errorMessage}
        {#if $searchState.retryAvailable}
          <button class="retry-button" onclick={handleSearch}>
            🔄 Retry Search
          </button>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Search results -->
  {#if $searchState.searchComplete}
    <div class="search-results" data-testid="search-results">
      {#if $searchState.hasResults}
        <!-- Results with highlighting -->
        <div class="results-header">
          <span>Found {$searchState.resultCount} items</span>
          
          {#if $searchState.showSortOptions}
            <div class="sort-options">
              <label>Sort by:</label>
              <select>
                <option value="relevance">Relevance</option>
                <option value="price">Price</option>
                <option value="name">Name</option>
              </select>
            </div>
          {/if}
        </div>
        
        <!-- Organized results by category -->
        {#if $searchState.resultCategories.length > 0}
          {#each $searchState.resultCategories as category}
            <div class="result-category">
              <h4>{category}</h4>
            </div>
          {/each}
        {/if}
        
        <!-- Actual results list -->
        <div class="results-list" data-testid="results-list">
          {#each $searchState.results as item}
            <div class="result-item" data-testid="result-item">
              <h4>{item.name}</h4>
              <span class="category">{item.category}</span>
              <span class="biome">{item.biome}</span>
            </div>
          {/each}
        </div>
        
      {:else}
        <!-- Empty results state -->
        <div class="empty-results" data-testid="empty-results">
          <div class="empty-message">
            {$searchState.emptyMessage}
          </div>
          
          {#if $searchState.showGuidance}
            <div class="search-guidance">
              <h4>Try these suggestions:</h4>
              <ul>
                {#each $userGuidance.emptyStateGuidance.tips as tip}
                  <li>{tip}</li>
                {/each}
              </ul>
              
              {#if $userGuidance.emptyStateGuidance.popularSearches.length > 0}
                <div class="popular-searches">
                  <h5>Popular searches:</h5>
                  {#each $userGuidance.emptyStateGuidance.popularSearches as search}
                    <button 
                      class="popular-search"
                      onclick={() => selectSuggestion(search)}
                    >
                      {search}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .enhanced-search-interface {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
  }

  .search-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .offline-indicator {
    background: #ff9800;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .search-input-container {
    position: relative;
    margin-bottom: 1rem;
  }

  .input-wrapper {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .search-input {
    flex: 1;
    padding: 0.75rem;
    border: 2px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #007bff;
  }

  .loading-spinner {
    position: absolute;
    right: 60px;
    top: 50%;
    transform: translateY(-50%);
    color: #007bff;
    font-size: 0.9rem;
  }

  .search-button {
    padding: 0.75rem 1rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  .search-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .suggestions-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    z-index: 10;
  }

  .suggestion-item {
    display: block;
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
  }

  .suggestion-item:hover {
    background: #f5f5f5;
  }

  .search-hints {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #666;
  }

  .hint {
    margin-bottom: 0.25rem;
  }

  .search-feedback {
    margin-bottom: 1rem;
  }

  .search-message {
    color: #007bff;
    font-weight: 500;
  }

  .timing-feedback {
    font-size: 0.9rem;
    color: #28a745;
    margin-top: 0.25rem;
  }

  .slow-search-warning {
    color: #ff9800;
    margin-top: 0.5rem;
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    background: #f0f0f0;
    border-radius: 2px;
    margin-top: 0.5rem;
    overflow: hidden;
  }

  .progress-bar-fill {
    width: 30%;
    height: 100%;
    background: #ff9800;
    animation: progress 2s infinite;
  }

  @keyframes progress {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(400%); }
  }

  .error-message {
    color: #dc3545;
    background: #f8d7da;
    padding: 0.75rem;
    border-radius: 4px;
    margin-top: 0.5rem;
  }

  .retry-button {
    margin-left: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #ddd;
  }

  .sort-options {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .result-category {
    margin-bottom: 1rem;
  }

  .result-category h4 {
    color: #007bff;
    margin-bottom: 0.5rem;
  }

  .results-list {
    display: grid;
    gap: 1rem;
  }

  .result-item {
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #f9f9f9;
  }

  .result-item h4 {
    margin: 0 0 0.5rem 0;
  }

  .category, .biome {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background: #007bff;
    color: white;
    border-radius: 12px;
    font-size: 0.8rem;
    margin-right: 0.5rem;
  }

  .empty-results {
    text-align: center;
    padding: 2rem;
  }

  .empty-message {
    font-size: 1.1rem;
    color: #666;
    margin-bottom: 1rem;
  }

  .search-guidance {
    text-align: left;
    max-width: 400px;
    margin: 0 auto;
  }

  .popular-searches {
    margin-top: 1rem;
  }

  .popular-search {
    display: inline-block;
    margin: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .popular-search:hover {
    background: #0056b3;
  }
</style>