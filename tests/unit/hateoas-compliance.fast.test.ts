/**
 * HATEOAS Compliance Tests
 * Tests that interface elements clearly communicate:
 * - Available actions (H1)
 * - System state (H2) 
 * - Navigation paths (H3)
 * - Form states (H4)
 * - Error recovery (H5)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import MarketplaceBrowser from '../../workspaces/frontend/src/components/marketplace/MarketplaceBrowser.svelte';
import Navigation from '../../workspaces/frontend/src/components/Navigation.svelte';

// Mock API responses
vi.mock('../../workspaces/frontend/src/lib/api/marketplace.js', () => ({
  marketplaceApi: {
    fetchListings: vi.fn(() => Promise.resolve([
      {
        listing_id: '1',
        item_name: 'Diamond Sword',
        seller_name: 'TestSeller',
        price: 5,
        qty: 1,
        listing_type: 'sell',
        inventory_unit: 'per item',
        is_active: true,
        date_created: '2024-01-01',
        actions: {
          canPurchase: true,
          canAddToWatchlist: false,
          canContactSeller: true
        }
      }
    ]))
  }
}));

describe('HATEOAS - Action Affordances (H1)', () => {
  const mockOnPurchase = vi.fn();

  it('clearly shows available actions for each item', async () => {
    render(MarketplaceBrowser, {
      props: { onPurchase: mockOnPurchase }
    });

    await waitFor(() => {
      expect(screen.getByText('Diamond Sword')).toBeInTheDocument();
    });

    // Buy action should be clearly visible and actionable
    const buyButton = screen.getByRole('button', { name: /buy now/i });
    expect(buyButton).toBeVisible();
    expect(buyButton).toHaveClass('buy-action');
    expect(buyButton).not.toBeDisabled();
  });

  it('shows appropriate action text based on listing type', async () => {
    // Mock a buy listing (someone wants to buy)
    vi.mocked(require('../../workspaces/frontend/src/lib/api/marketplace.js').marketplaceApi.fetchListings)
      .mockResolvedValueOnce([{
        listing_id: '2',
        item_name: 'Gold Ingot',
        seller_name: 'Buyer123',
        price: 2,
        qty: 10,
        listing_type: 'buy',
        inventory_unit: 'per item',
        is_active: true,
        date_created: '2024-01-01'
      }]);

    render(MarketplaceBrowser, {
      props: { onPurchase: mockOnPurchase }
    });

    await waitFor(() => {
      expect(screen.getByText('Gold Ingot')).toBeInTheDocument();
    });

    // Contact action for buy listings
    const contactButton = screen.getByRole('button', { name: /contact buyer123/i });
    expect(contactButton).toBeVisible();
    expect(contactButton).toHaveClass('contact-action');
  });

  it('indicates action outcomes clearly', async () => {
    render(MarketplaceBrowser, {
      props: { onPurchase: mockOnPurchase }
    });

    await waitFor(() => {
      expect(screen.getByText('Diamond Sword')).toBeInTheDocument();
    });

    // Action buttons should indicate what will happen
    const buyButton = screen.getByRole('button', { name: /buy now/i });
    expect(buyButton.title || buyButton.getAttribute('aria-label')).toBeTruthy();
  });
});

describe('HATEOAS - System State Discovery (H2)', () => {
  it('shows loading state clearly', () => {
    render(MarketplaceBrowser, {
      props: { onPurchase: () => {} }
    });

    // Loading indicator should be visible and descriptive
    expect(screen.getByText(/loading marketplace data/i)).toBeInTheDocument();
  });

  it('communicates item availability state', async () => {
    render(MarketplaceBrowser, {
      props: { onPurchase: () => {} }
    });

    await waitFor(() => {
      expect(screen.getByText('Diamond Sword')).toBeInTheDocument();
    });

    // Availability should be clearly communicated
    expect(screen.getByText('Available to buy')).toBeInTheDocument();
  });

  it('shows current filter state', () => {
    render(MarketplaceBrowser, {
      props: { onPurchase: () => {} }
    });

    // Current search/filter state should be visible
    const searchInput = screen.getByLabelText('What are you looking for?');
    expect(searchInput.value).toBe('');
    expect(searchInput).toBeVisible();
  });

  it('displays market status information', async () => {
    render(MarketplaceBrowser, {
      props: { onPurchase: () => {} }
    });

    await waitFor(() => {
      // Market status should show relevant information
      expect(screen.getAllByText(/available/i).length).toBeGreaterThan(0);
    });
  });
});

describe('HATEOAS - Navigation Context (H3)', () => {
  const mockOnNavigate = vi.fn();

  it('shows current location in navigation', () => {
    render(Navigation, {
      props: { 
        currentPage: 'browse',
        onNavigate: mockOnNavigate
      }
    });

    // Current page should be highlighted
    const browseButton = screen.getByRole('button', { name: /browse items/i });
    expect(browseButton).toHaveClass('active');
    expect(browseButton).toHaveAttribute('aria-current', 'page');
  });

  it('provides breadcrumb trail', () => {
    render(Navigation, {
      props: { 
        currentPage: 'browse',
        onNavigate: mockOnNavigate
      }
    });

    // Breadcrumb should show current location
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Browse Items')).toBeInTheDocument();
  });

  it('indicates possible next steps', () => {
    render(Navigation, {
      props: { 
        currentPage: 'browse',
        onNavigate: mockOnNavigate
      }
    });

    // All navigation options should be visible
    expect(screen.getByRole('button', { name: /home/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /sell items/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /my account/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /help/i })).toBeVisible();
  });

  it('provides descriptive tooltips for navigation', () => {
    render(Navigation, {
      props: { 
        currentPage: 'home',
        onNavigate: mockOnNavigate
      }
    });

    // Navigation items should have helpful descriptions
    const browseButton = screen.getByRole('button', { name: /browse items/i });
    expect(browseButton).toHaveAttribute('title', 'Find items to buy');
  });
});

describe('HATEOAS - Form State Communication (H4)', () => {
  it('shows search input state and guidance', () => {
    render(MarketplaceBrowser, {
      props: { onPurchase: () => {} }
    });

    const searchInput = screen.getByLabelText('What are you looking for?');
    
    // Input should provide clear guidance
    expect(searchInput).toHaveAttribute('placeholder', 'Type item name (e.g., diamond sword, oak wood)');
    expect(searchInput).toBeVisible();
  });

  it('validates filter inputs appropriately', async () => {
    const user = userEvent.setup();
    render(MarketplaceBrowser, {
      props: { onPurchase: () => {} }
    });

    // Open advanced filters
    const moreFiltersButton = screen.getByText('More filters');
    await user.click(moreFiltersButton);

    const priceInput = screen.getByLabelText('Max price:');
    
    // Price input should have appropriate constraints
    expect(priceInput).toHaveAttribute('min', '1');
    expect(priceInput).toHaveAttribute('type', 'number');
  });

  it('provides helpful context for form fields', async () => {
    const user = userEvent.setup();
    render(MarketplaceBrowser, {
      props: { onPurchase: () => {} }
    });

    // Open advanced filters
    const moreFiltersButton = screen.getByText('More filters');
    await user.click(moreFiltersButton);

    // Context should be provided for complex fields
    expect(screen.getByText('in diamond blocks')).toBeInTheDocument();
  });
});

describe('HATEOAS - Error Recovery (H5)', () => {
  it('provides clear error messages with recovery actions', async () => {
    // Mock API failure
    vi.mocked(require('../../workspaces/frontend/src/lib/api/marketplace.js').marketplaceApi.fetchListings)
      .mockRejectedValueOnce(new Error('Network error'));

    render(MarketplaceBrowser, {
      props: { onPurchase: () => {} }
    });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    // Error should provide recovery action
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeVisible();
    expect(retryButton).toHaveClass('retry-btn');
  });

  it('shows no results state with helpful guidance', async () => {
    // Mock empty results
    vi.mocked(require('../../workspaces/frontend/src/lib/api/marketplace.js').marketplaceApi.fetchListings)
      .mockResolvedValueOnce([]);

    render(MarketplaceBrowser, {
      props: { onPurchase: () => {} }
    });

    await waitFor(() => {
      expect(screen.getByText(/no listings found/i)).toBeInTheDocument();
    });

    // Should provide guidance for next steps
    expect(screen.getByText(/try adjusting your search filters/i)).toBeInTheDocument();
  });

  it('handles disabled states with explanations', async () => {
    // Mock item with no available actions
    vi.mocked(require('../../workspaces/frontend/src/lib/api/marketplace.js').marketplaceApi.fetchListings)
      .mockResolvedValueOnce([{
        listing_id: '3',
        item_name: 'Unavailable Item',
        seller_name: 'TestSeller',
        price: 0,
        qty: 0,
        listing_type: 'sell',
        inventory_unit: 'per item',
        is_active: false,
        date_created: '2024-01-01'
      }]);

    render(MarketplaceBrowser, {
      props: { onPurchase: () => {} }
    });

    await waitFor(() => {
      expect(screen.getByText('Unavailable Item')).toBeInTheDocument();
    });

    // Unavailable items should show appropriate state
    // This test would need specific handling for inactive items
  });
});

describe('HATEOAS - Accessibility Integration', () => {
  it('provides appropriate ARIA labels and roles', () => {
    render(Navigation, {
      props: { 
        currentPage: 'browse',
        onNavigate: () => {}
      }
    });

    // Navigation should have proper ARIA attributes
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');

    const breadcrumb = screen.getByLabelText('Breadcrumb');
    expect(breadcrumb).toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    const mockOnNavigate = vi.fn();

    render(Navigation, {
      props: { 
        currentPage: 'home',
        onNavigate: mockOnNavigate
      }
    });

    const browseButton = screen.getByRole('button', { name: /browse items/i });
    
    // Should be focusable and activatable via keyboard
    await user.tab();
    expect(browseButton).toHaveFocus();
    
    await user.keyboard('{Enter}');
    expect(mockOnNavigate).toHaveBeenCalledWith('browse');
  });

  it('provides semantic markup for item cards', async () => {
    render(MarketplaceBrowser, {
      props: { onPurchase: () => {} }
    });

    await waitFor(() => {
      expect(screen.getByText('Diamond Sword')).toBeInTheDocument();
    });

    // Item cards should use semantic HTML
    const itemCard = screen.getByRole('article');
    expect(itemCard).toBeInTheDocument();
    
    const itemHeader = itemCard.querySelector('header');
    expect(itemHeader).toBeInTheDocument();
    
    const itemFooter = itemCard.querySelector('footer');
    expect(itemFooter).toBeInTheDocument();
  });
});