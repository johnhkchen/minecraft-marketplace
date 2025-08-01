/**
 * Search State Management Tests
 * Verify that our search state implementation makes the failing UI tests pass
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { setupFastTests, expectFastExecution } from '../utils/fast-test-setup.js';
import { searchState, searchActions, searchStatus, performanceFeedback, userGuidance } from '../../workspaces/frontend/src/lib/search-interface-state.js';

// Setup fast tests with MSW mocking
setupFastTests();

describe('Search State Management - Making Failing Tests Pass', () => {
  
  beforeEach(() => {
    // Reset search state before each test
    searchState.set({
      searchTerm: '',
      results: [],
      isLoading: false,
      showSpinner: false,
      searchComplete: false,
      searchDuration: 0,
      showTiming: false,
      timingMessage: '',
      message: '',
      resultCount: 0,
      hasResults: true,
      emptyMessage: '',
      showSuggestions: false,
      suggestions: [],
      isSlowSearch: false,
      slowSearchMessage: '',
      showProgressBar: false,
      hasError: false,
      errorMessage: '',
      retryAvailable: false,
      fallbackResults: [],
      isOnline: true,
      offlineMessage: '',
      showOfflineIndicator: false,
      cachedResults: [],
      showSearchSuggestions: false,
      activeSuggestion: -1,
      inputValue: '',
      highlightMatches: false,
      placeholder: '',
      showHints: false,
      hints: [],
      focusState: 'unfocused',
      sortBy: 'relevance',
      showSortOptions: false,
      resultCategories: [],
      relevanceScores: [],
      showGuidance: false,
      searchTips: [],
      popularSearches: [],
      categoryLinks: []
    });
  });

  describe('🔍 Search Visual Feedback - PASSING Now', () => {
    test('should show loading spinner during search', async () => {
      const start = performance.now();
      
      // Start search - this should set loading states
      searchActions.startSearch('diamond sword');
      
      const state = get(searchState);
      
      // These should now pass with our state management
      expect(state.isLoading).toBe(true);
      expect(state.showSpinner).toBe(true);
      expect(state.message).toBe('Searching...');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('should show search progress with result count', async () => {
      const start = performance.now();
      
      // Start and complete search
      searchActions.startSearch('diamond sword');
      searchActions.completeSearch([
        { id: 1, name: 'Diamond Sword' },
        { id: 2, name: 'Diamond Pickaxe' }
      ], 150);
      
      const state = get(searchState);
      
      // These should now pass
      expect(state.message).toBe('Found 2 items');
      expect(state.resultCount).toBeGreaterThan(0);
      expect(state.searchComplete).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('should provide clear visual feedback for empty results', async () => {
      const start = performance.now();
      
      // Complete search with no results
      searchActions.completeSearch([], 100);
      
      const state = get(searchState);
      
      // These should now pass
      expect(state.hasResults).toBe(false);
      expect(state.emptyMessage).toBe('No items found. Try different keywords or browse categories.');
      expect(state.showSuggestions).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
  });

  describe('⚡ Search Performance Feedback - PASSING Now', () => {
    test('should show search timing for performance transparency', async () => {
      const start = performance.now();
      
      // Complete search with timing
      searchActions.completeSearch([{ id: 1, name: 'Test Item' }], 245);
      
      const state = get(searchState);
      const feedback = get(performanceFeedback);
      
      // These should now pass
      expect(state.searchDuration).toBeGreaterThan(0);
      expect(state.showTiming).toBe(true);
      expect(state.timingMessage).toMatch(/Found \d+ items in \d+ms/);
      expect(feedback.showTiming).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 10);
    });

    test('should warn user when search is taking longer than expected', async () => {
      const start = performance.now();
      
      // Trigger slow search handling
      searchActions.handleSlowSearch();
      
      const state = get(searchState);
      
      // These should now pass
      expect(state.isSlowSearch).toBe(true);
      expect(state.slowSearchMessage).toBe('Searching through many items... this may take a moment.');
      expect(state.showProgressBar).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
  });

  describe('🎨 Search Input Enhancement - PASSING Now', () => {
    test('should show search suggestions as user types', async () => {
      const start = performance.now();
      
      // Update suggestions based on input
      searchActions.updateSuggestions('dia');
      
      const state = get(searchState);
      
      // These should now pass
      expect(state.suggestions).toContain('diamond sword');
      expect(state.suggestions).toContain('diamond pickaxe');
      expect(state.showSearchSuggestions).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('should highlight search terms in results', async () => {
      const start = performance.now();
      
      // Complete search (which enables highlighting)
      searchActions.completeSearch([
        { name: 'Diamond Sword', highlighted: false },
        { name: 'Iron Sword', highlighted: false }
      ], 100);
      
      const state = get(searchState);
      
      // These should now pass
      expect(state.highlightMatches).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('should provide clear search input placeholder and hints', async () => {
      const start = performance.now();
      
      // Set focus state (which populates guidance)
      searchActions.setFocusState(true);
      
      const state = get(searchState);
      const guidance = get(userGuidance);
      
      // These should now pass
      expect(state.placeholder).toBe('Search for items (e.g., "diamond sword", "jungle biome")');
      expect(state.showHints).toBe(true);
      expect(state.hints).toContain('Try searching by item name, category, or biome');
      expect(guidance.placeholder).toBe('Search for items (e.g., "diamond sword", "jungle biome")');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
  });

  describe('📱 Search Error Handling - PASSING Now', () => {
    test('should gracefully handle search API errors', async () => {
      const start = performance.now();
      
      // Set some cached results first
      searchState.update(state => ({ ...state, cachedResults: [{ id: 1, name: 'Cached Item' }] }));
      
      // Trigger error handling
      searchActions.handleSearchError('Network timeout');
      
      const state = get(searchState);
      
      // These should now pass
      expect(state.hasError).toBe(true);
      expect(state.errorMessage).toBe('Search temporarily unavailable. Showing recent results.');
      expect(state.retryAvailable).toBe(true);
      expect(state.fallbackResults.length).toBeGreaterThan(0);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('should handle network connectivity issues', async () => {
      const start = performance.now();
      
      // Set offline state
      searchActions.setOfflineState(false);
      
      const state = get(searchState);
      
      // These should now pass
      expect(state.isOnline).toBe(false);
      expect(state.offlineMessage).toBe('No internet connection. Showing previously loaded items.');
      expect(state.showOfflineIndicator).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
  });

  describe('🎯 Search Results Organization - PASSING Now', () => {
    test('should organize results by relevance with clear indicators', async () => {
      const start = performance.now();
      
      // Organize results
      searchActions.organizeResults();
      
      const state = get(searchState);
      
      // These should now pass
      expect(state.showSortOptions).toBe(true);
      expect(state.resultCategories).toContain('Exact Matches');
      expect(state.resultCategories).toContain('Similar Items');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('should provide clear "no results" guidance', async () => {
      const start = performance.now();
      
      // Show no results guidance
      searchActions.showNoResultsGuidance();
      
      const state = get(searchState);
      const guidance = get(userGuidance);
      
      // These should now pass
      expect(state.showGuidance).toBe(true);
      expect(state.searchTips).toContain('Try fewer keywords');
      expect(state.searchTips).toContain('Check spelling');
      expect(state.popularSearches.length).toBeGreaterThan(0);
      expect(guidance.emptyStateGuidance.show).toBe(false); // Because hasResults is still true
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
  });

  describe('🔄 State Management Integration', () => {
    test('should handle complete search workflow', async () => {
      const start = performance.now();
      
      // Complete workflow: start -> slow warning -> complete
      searchActions.startSearch('diamond');
      expect(get(searchState).isLoading).toBe(true);
      
      // Simulate slow search
      setTimeout(() => searchActions.handleSlowSearch(), 50);
      
      // Complete search
      searchActions.completeSearch([
        { id: 1, name: 'Diamond Sword' },
        { id: 2, name: 'Diamond Block' }
      ], 1200);
      
      const finalState = get(searchState);
      
      expect(finalState.searchComplete).toBe(true);
      expect(finalState.isLoading).toBe(false);
      expect(finalState.resultCount).toBe(2);
      expect(finalState.timingMessage).toContain('Found 2 items in 1200ms');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 15);
    });

    test('should maintain performance requirements', async () => {
      const start = performance.now();
      
      // Test multiple state updates in rapid succession
      for (let i = 0; i < 10; i++) {
        searchActions.updateSuggestions(`test${i}`);
        searchActions.setFocusState(i % 2 === 0);
      }
      
      const state = get(searchState);
      expect(state.inputValue).toBe('test9');
      expect(state.focusState).toBe('unfocused');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 10);
    });
  });
});