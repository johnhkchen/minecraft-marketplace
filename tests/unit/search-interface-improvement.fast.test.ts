/**
 * Search Interface Improvement Tests - Updated for GREEN state
 * TDD approach using our implemented state management
 * All tests now pass by using the state management we built
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { setupFastTests, expectFastExecution } from '../utils/fast-test-setup.js';
import { searchState, searchActions, searchStatus, performanceFeedback, userGuidance } from '../../workspaces/frontend/src/lib/search-interface-state.js';

// Setup fast tests with MSW mocking
setupFastTests();

describe('Search Interface Improvement - TDD UI/UX Focus (ALL PASSING)', () => {
  
  beforeEach(() => {
    // Reset search state before each test
    searchState.set({
      searchTerm: '', results: [], isLoading: false, showSpinner: false, searchComplete: false,
      searchDuration: 0, showTiming: false, timingMessage: '', message: '', resultCount: 0,
      hasResults: true, emptyMessage: '', showSuggestions: false, suggestions: [],
      isSlowSearch: false, slowSearchMessage: '', showProgressBar: false,
      hasError: false, errorMessage: '', retryAvailable: false, fallbackResults: [],
      isOnline: true, offlineMessage: '', showOfflineIndicator: false, cachedResults: [],
      showSearchSuggestions: false, activeSuggestion: -1, inputValue: '',
      highlightMatches: false, placeholder: '', showHints: false, hints: [], focusState: 'unfocused',
      sortBy: 'relevance', showSortOptions: false, resultCategories: [], relevanceScores: [],
      showGuidance: false, searchTips: [], popularSearches: [], categoryLinks: []
    });
  });
  
  describe('🔍 Search Visual Feedback (PASSING with state management)', () => {
    test('should show loading spinner during search', async () => {
      const start = performance.now();
      
      // Use our implemented state management
      searchActions.startSearch('diamond sword');
      const state = get(searchState);
      
      // These now pass with our implementation
      expect(state.isLoading).toBe(true);
      expect(state.showSpinner).toBe(true);
      expect(state.searchTerm).toBe('diamond sword');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('should show search progress with result count', async () => {
      const start = performance.now();
      
      // Start and complete search with our state management
      searchActions.startSearch('diamond sword');
      searchActions.completeSearch([
        { id: 1, name: 'Diamond Sword' },
        { id: 2, name: 'Diamond Pickaxe' }
      ], 150);
      
      const state = get(searchState);
      
      // These now pass
      expect(state.message).toBe('Found 2 items');
      expect(state.resultCount).toBeGreaterThan(0);
      expect(state.searchComplete).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('should provide clear visual feedback for empty results', async () => {
      const start = performance.now();
      
      // Complete search with no results using our state management
      searchActions.completeSearch([], 100);
      
      const state = get(searchState);
      
      // These now pass
      expect(state.hasResults).toBe(false);
      expect(state.emptyMessage).toBe('No items found. Try different keywords or browse categories.');
      expect(state.showSuggestions).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
  });

  describe('⚡ Search Performance Feedback (PASSING with state management)', () => {
    test('should show search timing for performance transparency', async () => {
      const start = performance.now();
      
      // Complete search with timing using our state management
      searchActions.completeSearch([{ id: 1, name: 'Test Item' }], 245);
      
      const state = get(searchState);
      const feedback = get(performanceFeedback);
      
      // These now pass
      expect(state.searchDuration).toBeGreaterThan(0);
      expect(state.showTiming).toBe(true);
      expect(state.timingMessage).toMatch(/Found \d+ items in \d+ms/);
      expect(feedback.showTiming).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 10);
    });

    test('should warn user when search is taking longer than expected', async () => {
      const start = performance.now();
      
      // Trigger slow search handling using our state management
      searchActions.handleSlowSearch();
      
      const state = get(searchState);
      
      // These now pass
      expect(state.isSlowSearch).toBe(true);
      expect(state.slowSearchMessage).toBe('Searching through many items... this may take a moment.');
      expect(state.showProgressBar).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
  });

  describe('🎨 Search Input Enhancement (PASSING with state management)', () => {
    test('should show search suggestions as user types', async () => {
      const start = performance.now();
      
      // Update suggestions using our state management
      searchActions.updateSuggestions('dia');
      
      const state = get(searchState);
      
      // These now pass
      expect(state.suggestions).toContain('diamond sword');
      expect(state.suggestions).toContain('diamond pickaxe');
      expect(state.showSearchSuggestions).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('should highlight search terms in results', async () => {
      const start = performance.now();
      
      // Complete search (which enables highlighting) using our state management
      searchActions.completeSearch([
        { name: 'Diamond Sword', highlighted: false },
        { name: 'Iron Sword', highlighted: false }
      ], 100);
      
      const state = get(searchState);
      
      // This now passes
      expect(state.highlightMatches).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('should provide clear search input placeholder and hints', async () => {
      const start = performance.now();
      
      // Set focus state using our state management
      searchActions.setFocusState(true);
      
      const state = get(searchState);
      const guidance = get(userGuidance);
      
      // These now pass
      expect(state.placeholder).toBe('Search for items (e.g., "diamond sword", "jungle biome")');
      expect(state.showHints).toBe(true);
      expect(state.hints).toContain('Try searching by item name, category, or biome');
      expect(guidance.placeholder).toBe('Search for items (e.g., "diamond sword", "jungle biome")');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
  });

  describe('📱 Search Error Handling (PASSING with state management)', () => {
    test('should gracefully handle search API errors', async () => {
      const start = performance.now();
      
      // Set some cached results first, then trigger error using our state management
      searchState.update(state => ({ ...state, cachedResults: [{ id: 1, name: 'Cached Item' }] }));
      searchActions.handleSearchError('Network timeout');
      
      const state = get(searchState);
      
      // These now pass
      expect(state.hasError).toBe(true);
      expect(state.errorMessage).toBe('Search temporarily unavailable. Showing recent results.');
      expect(state.retryAvailable).toBe(true);
      expect(state.fallbackResults.length).toBeGreaterThan(0);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('should handle network connectivity issues', async () => {
      const start = performance.now();
      
      // Set offline state using our state management
      searchActions.setOfflineState(false);
      
      const state = get(searchState);
      
      // These now pass
      expect(state.isOnline).toBe(false);
      expect(state.offlineMessage).toBe('No internet connection. Showing previously loaded items.');
      expect(state.showOfflineIndicator).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
  });

  describe('🎯 Search Results Organization (PASSING with state management)', () => {
    test('should organize results by relevance with clear indicators', async () => {
      const start = performance.now();
      
      // Organize results using our state management
      searchActions.organizeResults();
      
      const state = get(searchState);
      
      // These now pass
      expect(state.showSortOptions).toBe(true);
      expect(state.resultCategories).toContain('Exact Matches');
      expect(state.resultCategories).toContain('Similar Items');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });

    test('should provide clear "no results" guidance', async () => {
      const start = performance.now();
      
      // Show no results guidance using our state management
      searchActions.showNoResultsGuidance();
      
      const state = get(searchState);
      
      // These now pass
      expect(state.showGuidance).toBe(true);
      expect(state.searchTips).toContain('Try fewer keywords');
      expect(state.searchTips).toContain('Check spelling');
      expect(state.popularSearches.length).toBeGreaterThan(0);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 5);
    });
  });

  describe('🎉 Integration Tests (PASSING with state management)', () => {
    test('should handle complete search workflow', async () => {
      const start = performance.now();
      
      // Complete workflow: start -> complete -> organize
      searchActions.startSearch('diamond');
      expect(get(searchState).isLoading).toBe(true);
      
      searchActions.completeSearch([
        { id: 1, name: 'Diamond Sword' },
        { id: 2, name: 'Diamond Block' }
      ], 1200);
      
      searchActions.organizeResults();
      
      const finalState = get(searchState);
      
      expect(finalState.searchComplete).toBe(true);
      expect(finalState.isLoading).toBe(false);
      expect(finalState.resultCount).toBe(2);
      expect(finalState.timingMessage).toContain('Found 2 items in 1200ms');
      expect(finalState.showSortOptions).toBe(true);
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 15);
    });

    test('should maintain performance requirements', async () => {
      const start = performance.now();
      
      // Test multiple rapid state updates
      for (let i = 0; i < 5; i++) {
        searchActions.updateSuggestions(`test${i}`);
        searchActions.setFocusState(i % 2 === 0);
      }
      
      const state = get(searchState);
      expect(state.inputValue).toBe('test4');
      // The last iteration is i=4, so 4 % 2 === 0 is true, so focused
      expect(state.focusState).toBe('focused');
      
      const timeMs = performance.now() - start;
      expectFastExecution(timeMs, 10);
    });
  });
});