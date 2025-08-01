/**
 * Search Interface State Management
 * Implements the UI/UX improvements defined in failing tests
 * Focus on visual feedback, loading states, and user guidance
 */

import { writable, derived } from 'svelte/store';

export interface SearchState {
  // Core search functionality
  searchTerm: string;
  results: any[];
  
  // Loading and progress feedback
  isLoading: boolean;
  showSpinner: boolean;
  searchComplete: boolean;
  
  // Performance feedback
  searchDuration: number;
  showTiming: boolean;
  timingMessage: string;
  
  // Progress and result feedback
  message: string;
  resultCount: number;
  
  // Empty state handling
  hasResults: boolean;
  emptyMessage: string;
  showSuggestions: boolean;
  suggestions: string[];
  
  // Slow search handling
  isSlowSearch: boolean;
  slowSearchMessage: string;
  showProgressBar: boolean;
  
  // Error handling
  hasError: boolean;
  errorMessage: string;
  retryAvailable: boolean;
  fallbackResults: any[];
  
  // Connectivity
  isOnline: boolean;
  offlineMessage: string;
  showOfflineIndicator: boolean;
  cachedResults: any[];
  
  // Input enhancement
  showSearchSuggestions: boolean;
  activeSuggestion: number;
  inputValue: string;
  
  // Search highlighting
  highlightMatches: boolean;
  
  // Input guidance
  placeholder: string;
  showHints: boolean;
  hints: string[];
  focusState: 'focused' | 'unfocused';
  
  // Results organization
  sortBy: string;
  showSortOptions: boolean;
  resultCategories: string[];
  relevanceScores: number[];
  
  // No results guidance
  showGuidance: boolean;
  searchTips: string[];
  popularSearches: string[];
  categoryLinks: string[];
}

// Create the search store with initial values that match our failing tests
export const searchState = writable<SearchState>({
  // Core search functionality
  searchTerm: '',
  results: [],
  
  // Loading and progress feedback (initially false - tests expect these to become true)
  isLoading: false,
  showSpinner: false,
  searchComplete: false,
  
  // Performance feedback (initially empty - tests expect these to be populated)
  searchDuration: 0,
  showTiming: false,
  timingMessage: '',
  
  // Progress and result feedback (initially empty)
  message: '',
  resultCount: 0,
  
  // Empty state handling (initially incorrect - tests expect proper messages)
  hasResults: true,
  emptyMessage: '',
  showSuggestions: false,
  suggestions: [],
  
  // Slow search handling (initially disabled)
  isSlowSearch: false,
  slowSearchMessage: '',
  showProgressBar: false,
  
  // Error handling (initially no error)
  hasError: false,
  errorMessage: '',
  retryAvailable: false,
  fallbackResults: [],
  
  // Connectivity (initially online)
  isOnline: true,
  offlineMessage: '',
  showOfflineIndicator: false,
  cachedResults: [],
  
  // Input enhancement (initially empty)
  showSearchSuggestions: false,
  activeSuggestion: -1,
  inputValue: '',
  
  // Search highlighting (initially disabled)
  highlightMatches: false,
  
  // Input guidance (initially empty - tests expect helpful content)
  placeholder: '',
  showHints: false,
  hints: [],
  focusState: 'unfocused',
  
  // Results organization (initially minimal)
  sortBy: 'relevance',
  showSortOptions: false,
  resultCategories: [],
  relevanceScores: [],
  
  // No results guidance (initially disabled)
  showGuidance: false,
  searchTips: [],
  popularSearches: [],
  categoryLinks: []
});

// Actions to update search state - these will make our tests pass
export const searchActions = {
  // Start search with proper loading state
  startSearch(searchTerm: string) {
    searchState.update(state => ({
      ...state,
      searchTerm,
      isLoading: true,
      showSpinner: true,
      searchComplete: false,
      message: 'Searching...',
      hasError: false,
      showTiming: false  // Will be set to true when search completes
    }));
  },
  
  // Complete search with results
  completeSearch(results: any[], duration: number) {
    searchState.update(state => ({
      ...state,
      results,
      resultCount: results.length,
      searchDuration: duration,
      isLoading: false,
      showSpinner: false,
      searchComplete: true,
      hasResults: results.length > 0,
      message: results.length > 0 ? `Found ${results.length} items` : '',
      showTiming: true,  // Enable timing display when search completes
      timingMessage: `Found ${results.length} items in ${duration}ms`,
      
      // Handle empty results
      emptyMessage: results.length === 0 ? 'No items found. Try different keywords or browse categories.' : '',
      showSuggestions: results.length === 0,
      
      // Enable result highlighting
      highlightMatches: true
    }));
  },
  
  // Handle slow search
  handleSlowSearch() {
    searchState.update(state => ({
      ...state,
      isSlowSearch: true,
      slowSearchMessage: 'Searching through many items... this may take a moment.',
      showProgressBar: true
    }));
  },
  
  // Handle search error
  handleSearchError(error: string) {
    searchState.update(state => ({
      ...state,
      hasError: true,
      errorMessage: 'Search temporarily unavailable. Showing recent results.',
      retryAvailable: true,
      isLoading: false,
      showSpinner: false,
      fallbackResults: [...state.cachedResults]
    }));
  },
  
  // Handle offline state
  setOfflineState(isOnline: boolean) {
    searchState.update(state => ({
      ...state,
      isOnline,
      offlineMessage: isOnline ? '' : 'No internet connection. Showing previously loaded items.',
      showOfflineIndicator: !isOnline
    }));
  },
  
  // Update search suggestions
  updateSuggestions(inputValue: string) {
    const suggestions = inputValue.length >= 2 ? [
      'diamond sword',
      'diamond pickaxe',
      'diamond armor',
      'jungle items',
      'nether items'
    ].filter(s => s.includes(inputValue.toLowerCase())) : [];
    
    searchState.update(state => ({
      ...state,
      inputValue,
      suggestions,
      showSearchSuggestions: suggestions.length > 0
    }));
  },
  
  // Set input focus state
  setFocusState(focused: boolean) {
    searchState.update(state => ({
      ...state,
      focusState: focused ? 'focused' : 'unfocused',
      placeholder: 'Search for items (e.g., "diamond sword", "jungle biome")',
      showHints: focused,
      hints: focused ? [
        'Try searching by item name, category, or biome',
        'Use quotes for exact matches',
        'Combine keywords for better results'
      ] : []
    }));
  },
  
  // Set up results organization
  organizeResults() {
    searchState.update(state => ({
      ...state,
      showSortOptions: true,
      resultCategories: ['Exact Matches', 'Similar Items', 'Related Items']
    }));
  },
  
  // Show no results guidance
  showNoResultsGuidance() {
    searchState.update(state => ({
      ...state,
      showGuidance: true,
      searchTips: [
        'Try fewer keywords',
        'Check spelling',
        'Use more general terms',
        'Browse categories instead'
      ],
      popularSearches: ['diamond sword', 'iron tools', 'jungle wood'],
      categoryLinks: ['weapons', 'tools', 'armor', 'blocks']
    }));
  }
};

// Derived stores for computed values
export const searchStatus = derived(searchState, $state => {
  if ($state.isLoading) return 'searching';
  if ($state.hasError) return 'error';
  if ($state.resultCount === 0 && $state.searchComplete) return 'empty';
  if ($state.searchComplete) return 'complete';
  return 'idle';
});

export const performanceFeedback = derived(searchState, $state => ({
  showTiming: $state.showTiming,
  timingMessage: $state.timingMessage,
  isSlowSearch: $state.isSlowSearch,
  duration: $state.searchDuration
}));

export const userGuidance = derived(searchState, $state => ({
  placeholder: $state.placeholder || 'Search for items (e.g., "diamond sword", "jungle biome")',
  showHints: $state.showHints,
  hints: $state.hints,
  suggestions: $state.suggestions,
  showSuggestions: $state.showSearchSuggestions,
  emptyStateGuidance: {
    show: $state.showGuidance && !$state.hasResults,
    tips: $state.searchTips,
    popularSearches: $state.popularSearches
  }
}));