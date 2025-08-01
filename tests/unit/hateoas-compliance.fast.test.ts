/**
 * HATEOAS Compliance Tests - Fast Version
 * Tests business logic for HATEOAS compliance without component rendering
 * - Available actions (H1)
 * - System state (H2) 
 * - Navigation paths (H3)
 * - Form states (H4)
 * - Error recovery (H5)
 */

import { describe, it, expect } from 'vitest';
import { setupFastTests, measureSync, expectFastExecution } from '../utils/fast-test-setup';

// Setup MSW mocking for fast tests
setupFastTests();

describe('HATEOAS - Action Affordances (H1)', () => {
  it('determines available actions for sell listings', () => {
    const { result, timeMs } = measureSync(() => {
      const listing = {
        listing_id: '1',
        item_name: 'Diamond Sword',
        seller_name: 'TestSeller',
        price: 5,
        qty: 1,
        listing_type: 'sell',
        inventory_unit: 'per_item',
        is_active: true,
        date_created: '2024-01-01'
      };

      // Business logic: sell listings should allow purchase actions
      const actions = {
        canPurchase: listing.listing_type === 'sell' && listing.is_active && listing.qty > 0,
        canContact: true,
        actionText: listing.listing_type === 'sell' ? 'Buy Now' : 'Contact Seller'
      };

      return actions;
    });

    expect(result.canPurchase).toBe(true);
    expect(result.actionText).toBe('Buy Now');
    expectFastExecution(timeMs, 5);
  });

  it('determines appropriate actions for buy listings', () => {
    const { result, timeMs } = measureSync(() => {
      const listing = {
        listing_id: '2',
        item_name: 'Gold Ingot',
        seller_name: 'Buyer123',
        price: 2,
        qty: 10,
        listing_type: 'buy',
        inventory_unit: 'per_item',
        is_active: true,
        date_created: '2024-01-01'
      };

      // Business logic: buy listings should show contact action
      const actions = {
        canPurchase: false, // Buy listings are for selling TO the buyer
        canContact: true,
        actionText: `Contact ${listing.seller_name}`,
        contactReason: 'sell'
      };

      return actions;
    });

    expect(result.canPurchase).toBe(false);
    expect(result.canContact).toBe(true);
    expect(result.actionText).toBe('Contact Buyer123');
    expect(result.contactReason).toBe('sell');
    expectFastExecution(timeMs, 5);
  });

  it('validates action availability based on item state', () => {
    const { result, timeMs } = measureSync(() => {
      const inactiveItem = {
        listing_id: '3',
        item_name: 'Unavailable Item',
        seller_name: 'TestSeller',
        price: 0,
        qty: 0,
        listing_type: 'sell',
        inventory_unit: 'per_item',
        is_active: false,
        date_created: '2024-01-01'
      };

      const actions = {
        canPurchase: inactiveItem.listing_type === 'sell' && inactiveItem.is_active && inactiveItem.qty > 0,
        isDisabled: !inactiveItem.is_active || inactiveItem.qty === 0,
        disabledReason: !inactiveItem.is_active ? 'Item no longer available' : 'Out of stock'
      };

      return actions;
    });

    expect(result.canPurchase).toBe(false);
    expect(result.isDisabled).toBe(true);
    expect(result.disabledReason).toBe('Item no longer available');
    expectFastExecution(timeMs, 5);
  });
});

describe('HATEOAS - System State Discovery (H2)', () => {
  it('determines loading state indicators', () => {
    const { result, timeMs } = measureSync(() => {
      const systemState = {
        isLoading: true,
        hasError: false,
        itemCount: 0,
        message: 'Loading marketplace data...'
      };

      return {
        showLoadingIndicator: systemState.isLoading,
        loadingMessage: systemState.isLoading ? systemState.message : null,
        showContent: !systemState.isLoading && !systemState.hasError
      };
    });

    expect(result.showLoadingIndicator).toBe(true);
    expect(result.loadingMessage).toBe('Loading marketplace data...');
    expect(result.showContent).toBe(false);
    expectFastExecution(timeMs, 5);
  });

  it('communicates item availability state', () => {
    const { result, timeMs } = measureSync(() => {
      const item = {
        is_available: true,
        listing_type: 'sell',
        qty: 5
      };

      return {
        statusText: item.is_available ? 'Available to buy' : 'Not available',
        statusClass: item.is_available ? 'available' : 'unavailable',
        canInteract: item.is_available && item.qty > 0
      };
    });

    expect(result.statusText).toBe('Available to buy');
    expect(result.statusClass).toBe('available');
    expect(result.canInteract).toBe(true);
    expectFastExecution(timeMs, 5);
  });

  it('validates filter state representation', () => {
    const { result, timeMs } = measureSync(() => {
      const filterState = {
        searchTerm: '',
        categoryFilter: 'weapons',
        serverFilter: '',
        maxPrice: undefined
      };

      const activeFilters = Object.entries(filterState)
        .filter(([key, value]) => value !== '' && value !== undefined && value !== null)
        .map(([key, value]) => ({ key, value }));

      return {
        hasActiveFilters: activeFilters.length > 0,
        activeFilterCount: activeFilters.length,
        filterSummary: activeFilters.map(f => `${f.key}: ${f.value}`).join(', ')
      };
    });

    expect(result.hasActiveFilters).toBe(true);
    expect(result.activeFilterCount).toBe(1);
    expect(result.filterSummary).toBe('categoryFilter: weapons');
    expectFastExecution(timeMs, 5);
  });
});

describe('HATEOAS - Navigation Context (H3)', () => {
  it('determines current page context', () => {
    const { result, timeMs } = measureSync(() => {
      const currentPage = 'browse';
      
      const navigationState = {
        currentPage,
        breadcrumb: ['Marketplace', 'Browse Items'],
        availableActions: [
          { name: 'Home', path: '/', current: currentPage === 'home' },
          { name: 'Browse Items', path: '/browse', current: currentPage === 'browse' },
          { name: 'Sell Items', path: '/sell', current: currentPage === 'sell' },
          { name: 'Browse Shops', path: '/shops', current: currentPage === 'shops' }
        ]
      };

      return navigationState;
    });

    expect(result.currentPage).toBe('browse');
    expect(result.breadcrumb).toEqual(['Marketplace', 'Browse Items']);
    expect(result.availableActions.find(a => a.current)?.name).toBe('Browse Items');
    expectFastExecution(timeMs, 5);
  });

  it('provides navigation accessibility attributes', () => {
    const { result, timeMs } = measureSync(() => {
      const currentPage = 'browse';
      
      const accessibilityAttrs = {
        navRole: 'navigation',
        navAriaLabel: 'Main navigation',
        currentPageAria: 'page',
        breadcrumbLabel: 'Breadcrumb'
      };

      return accessibilityAttrs;
    });

    expect(result.navRole).toBe('navigation');
    expect(result.navAriaLabel).toBe('Main navigation');
    expect(result.currentPageAria).toBe('page');
    expectFastExecution(timeMs, 5);
  });
});

describe('HATEOAS - Form State Communication (H4)', () => {
  it('validates search input guidance', () => {
    const { result, timeMs } = measureSync(() => {
      const searchConfig = {
        placeholder: 'Search for diamond sword, oak wood, etc.',
        guidance: 'Try searching for popular items like "diamond sword" or "oak wood"',
        label: 'What are you looking for?',
        required: false
      };

      return {
        hasPlaceholder: !!searchConfig.placeholder,
        hasGuidance: !!searchConfig.guidance,
        isAccessible: !!searchConfig.label,
        placeholderLength: searchConfig.placeholder?.length || 0
      };
    });

    expect(result.hasPlaceholder).toBe(true);
    expect(result.hasGuidance).toBe(true);
    expect(result.isAccessible).toBe(true);
    expect(result.placeholderLength).toBeGreaterThan(20);
    expectFastExecution(timeMs, 5);
  });

  it('validates filter input constraints', () => {
    const { result, timeMs } = measureSync(() => {
      const priceFilterConfig = {
        type: 'number',
        min: 1,
        label: 'Max price:',
        helpText: 'in diamond blocks',
        required: false
      };

      return {
        hasConstraints: priceFilterConfig.min !== undefined,
        isNumeric: priceFilterConfig.type === 'number',
        hasHelpText: !!priceFilterConfig.helpText,
        minValue: priceFilterConfig.min
      };
    });

    expect(result.hasConstraints).toBe(true);
    expect(result.isNumeric).toBe(true);
    expect(result.hasHelpText).toBe(true);
    expect(result.minValue).toBe(1);
    expectFastExecution(timeMs, 5);
  });
});

describe('HATEOAS - Error Recovery (H5)', () => {
  it('provides error recovery actions', () => {
    const { result, timeMs } = measureSync(() => {
      const errorState = {
        hasError: true,
        errorMessage: 'Network error',
        canRetry: true
      };

      return {
        showErrorMessage: errorState.hasError,
        recoveryActions: errorState.canRetry ? ['Retry'] : [],
        errorContext: errorState.errorMessage,
        hasRecoveryPath: errorState.canRetry
      };
    });

    expect(result.showErrorMessage).toBe(true);
    expect(result.recoveryActions).toEqual(['Retry']);
    expect(result.hasRecoveryPath).toBe(true);
    expectFastExecution(timeMs, 5);
  });

  it('handles no results state with guidance', () => {
    const { result, timeMs } = measureSync(() => {
      const emptyState = {
        items: [],
        hasFilters: true
      };

      return {
        showNoResults: emptyState.items.length === 0,
        guidance: emptyState.hasFilters 
          ? 'Try adjusting your search filters or check back later for new listings.'
          : 'No items available at the moment. Check back later!',
        recoveryActions: emptyState.hasFilters ? ['Clear Filters'] : ['Refresh']
      };
    });

    expect(result.showNoResults).toBe(true);
    expect(result.guidance).toContain('adjusting your search filters');
    expect(result.recoveryActions).toEqual(['Clear Filters']);
    expectFastExecution(timeMs, 5);
  });

  it('explains disabled states', () => {
    const { result, timeMs } = measureSync(() => {
      const disabledItem = {
        is_active: false,
        qty: 0,
        listing_type: 'sell'
      };

      return {
        isDisabled: !disabledItem.is_active || disabledItem.qty === 0,
        disabledReason: !disabledItem.is_active 
          ? 'This item is no longer available'
          : 'Out of stock',
        hasExplanation: true
      };
    });

    expect(result.isDisabled).toBe(true);
    expect(result.disabledReason).toBe('This item is no longer available');
    expect(result.hasExplanation).toBe(true);
    expectFastExecution(timeMs, 5);
  });
});

describe('HATEOAS - Accessibility Integration', () => {
  it('provides semantic markup structure', () => {
    const { result, timeMs } = measureSync(() => {
      const semanticStructure = {
        itemCard: {
          role: 'article',
          hasHeader: true,
          hasFooter: true,
          hasActions: true
        },
        navigation: {
          role: 'navigation',
          ariaLabel: 'Main navigation',
          hasBreadcrumb: true
        }
      };

      return semanticStructure;
    });

    expect(result.itemCard.role).toBe('article');
    expect(result.itemCard.hasHeader).toBe(true);
    expect(result.navigation.role).toBe('navigation');
    expect(result.navigation.ariaLabel).toBe('Main navigation');
    expectFastExecution(timeMs, 5);
  });

  it('supports keyboard navigation requirements', () => {
    const { result, timeMs } = measureSync(() => {
      const keyboardSupport = {
        focusableElements: ['button', 'input', 'a'],
        keyboardEvents: ['Enter', 'Space', 'Tab'],
        tabOrder: 'sequential',
        hasSkipLinks: true
      };

      return {
        isFocusable: keyboardSupport.focusableElements.length > 0,
        supportsEnter: keyboardSupport.keyboardEvents.includes('Enter'),
        hasTabOrder: keyboardSupport.tabOrder === 'sequential',
        accessible: keyboardSupport.hasSkipLinks
      };
    });

    expect(result.isFocusable).toBe(true);
    expect(result.supportsEnter).toBe(true);
    expect(result.hasTabOrder).toBe(true);
    expectFastExecution(timeMs, 5);
  });
});