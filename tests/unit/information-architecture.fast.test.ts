/**
 * Information Architecture Tests
 * Tests the redesigned information architecture focusing on:
 * - Clear information hierarchy (IA1-IA5)
 * - User-centered language (CS1-CS4)
 * - Scannable layouts
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MinecraftMarketplace from '../../workspaces/frontend/src/components/MinecraftMarketplace.svelte';
import MarketplaceBrowser from '../../workspaces/frontend/src/components/marketplace/MarketplaceBrowser.svelte';

describe('Information Architecture - Homepage', () => {
  it('displays clear site purpose within 5 seconds (IA1)', () => {
    render(MinecraftMarketplace, {
      props: {
        homepageData: {
          marketStats: { totalItems: 42, activeShops: 8 },
          categories: [],
          featuredItems: []
        }
      }
    });

    // Primary heading should immediately communicate purpose
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Minecraft Item Marketplace');
    
    // Subtitle should explain the value proposition clearly
    expect(screen.getByText('Buy and sell Minecraft items with your community')).toBeInTheDocument();
  });

  it('prioritizes user actions over system details (IA1)', () => {
    render(MinecraftMarketplace, {
      props: {
        homepageData: {
          marketStats: { totalItems: 42, activeShops: 8 },
          categories: [],
          featuredItems: []
        }
      }
    });

    // Primary actions should be prominent
    const browseButton = screen.getByRole('button', { name: /browse items/i });
    const sellButton = screen.getByRole('button', { name: /sell items/i });
    
    expect(browseButton).toBeVisible();
    expect(sellButton).toBeVisible();
    expect(browseButton).toHaveClass('primary-action');
    expect(sellButton).toHaveClass('primary-action');
  });

  it('eliminates technical jargon from primary interface (CS1)', () => {
    render(MinecraftMarketplace, {
      props: {
        homepageData: {
          marketStats: { totalItems: 42, activeShops: 8 },
          categories: [],
          featuredItems: []
        }
      }
    });

    // Technical jargon should not appear in main interface
    expect(screen.queryByText(/nasdaq/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/terminal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/astro ssr/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/postgresql/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/postgrest/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/port 2888/i)).not.toBeInTheDocument();
  });

  it('uses user-centered language throughout (CS1)', () => {
    render(MinecraftMarketplace, {
      props: {
        homepageData: {
          marketStats: { totalItems: 42, activeShops: 8 },
          categories: [],
          featuredItems: []
        }
      }
    });

    // Language should focus on user value, not system internals
    expect(screen.getByText(/42 items for sale/i)).toBeInTheDocument();
    expect(screen.getByText(/8 shops/i)).toBeInTheDocument();
    
    // Action buttons use clear, actionable language
    expect(screen.getByRole('button', { name: /browse items/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sell items/i })).toBeInTheDocument();
  });

  it('moves technical details to progressive disclosure (CS3)', () => {
    render(MinecraftMarketplace, {
      props: {
        homepageData: {
          marketStats: { totalItems: 42, activeShops: 8 },
          categories: [],
          featuredItems: []
        }
      }
    });

    // Technical details should be in footer, behind disclosure
    const technicalDisclosure = screen.getByText('Technical details');
    expect(technicalDisclosure).toBeInTheDocument();
    expect(technicalDisclosure.tagName.toLowerCase()).toBe('summary');
  });

  it('establishes clear visual hierarchy (IA4)', () => {
    render(MinecraftMarketplace, {
      props: {
        homepageData: {
          marketStats: { totalItems: 42, activeShops: 8 },
          categories: [],
          featuredItems: []
        }
      }
    });

    // Visual hierarchy: Title > Subtitle > Actions > Status
    const title = screen.getByRole('heading', { level: 1 });
    const subtitle = screen.getByText('Buy and sell Minecraft items with your community');
    const browseAction = screen.getByRole('button', { name: /browse items/i });
    
    expect(title).toBeInTheDocument();
    expect(subtitle).toBeInTheDocument();
    expect(browseAction).toBeInTheDocument();
  });
});

describe('Information Architecture - Browse Interface', () => {
  const mockOnPurchase = () => {};

  it('uses clear, task-oriented heading (IA1)', () => {
    render(MarketplaceBrowser, {
      props: { onPurchase: mockOnPurchase }
    });

    // Heading should be task-focused, not system-focused
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Find Items to Buy');
    expect(screen.getByText('Browse available items from community members')).toBeInTheDocument();
  });

  it('prioritizes search over advanced filters (IA1)', () => {
    render(MarketplaceBrowser, {
      props: { onPurchase: mockOnPurchase }
    });

    // Primary search should be prominent
    const searchInput = screen.getByLabelText('What are you looking for?');
    expect(searchInput).toBeVisible();
    expect(searchInput).toHaveClass('search-input');

    // Advanced filters should be behind disclosure
    const advancedFilters = screen.getByText('More filters');
    expect(advancedFilters.tagName.toLowerCase()).toBe('summary');
  });

  it('uses plain language for search guidance (CS1)', () => {
    render(MarketplaceBrowser, {
      props: { onPurchase: mockOnPurchase }
    });

    // Search placeholder uses examples, not technical terms
    const searchInput = screen.getByPlaceholderText(/diamond sword, oak wood/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('simplifies filter language (CS1)', () => {
    render(MarketplaceBrowser, {
      props: { onPurchase: mockOnPurchase }
    });

    // Filter labels use plain language
    expect(screen.getByLabelText('Show me:')).toBeInTheDocument();
    expect(screen.getByLabelText('Max price:')).toBeInTheDocument();
    expect(screen.getByLabelText('From seller:')).toBeInTheDocument();
  });
});

describe('Information Architecture - Performance Metrics', () => {
  it('meets scannable layout requirements (IA4)', () => {
    const { container } = render(MinecraftMarketplace, {
      props: {
        homepageData: {
          marketStats: { totalItems: 42, activeShops: 8 },
          categories: [],
          featuredItems: []
        }
      }
    });

    // Test visual hierarchy through CSS classes
    const primaryActions = container.querySelectorAll('.primary-action');
    expect(primaryActions).toHaveLength(2);

    const highlights = container.querySelectorAll('.highlight');
    expect(highlights.length).toBeGreaterThan(0);
  });

  it('maintains consistent terminology (CS4)', () => {
    render(MinecraftMarketplace, {
      props: {
        homepageData: {
          marketStats: { totalItems: 42, activeShops: 8 },
          categories: [],
          featuredItems: []
        }
      }
    });

    // Consistent use of "items" not "listings"
    expect(screen.getByText(/items for sale/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /browse items/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sell items/i })).toBeInTheDocument();
  });

  it('provides business value context (CS2)', () => {
    render(MinecraftMarketplace, {
      props: {
        homepageData: {
          marketStats: { totalItems: 42, activeShops: 8 },
          categories: [],
          featuredItems: []
        }
      }
    });

    // Business value information is prioritized
    expect(screen.getByText(/42 items for sale from 8 shops/i)).toBeInTheDocument();
    expect(screen.getByText(/all prices in diamonds/i)).toBeInTheDocument();
  });
});

describe('Content Strategy Validation', () => {
  it('eliminates all technical jargon from user interface', () => {
    render(MinecraftMarketplace, {
      props: {
        homepageData: {
          marketStats: { totalItems: 42, activeShops: 8 },
          categories: [],
          featuredItems: []
        }
      }
    });

    // Comprehensive jargon elimination test
    const prohibitedTerms = [
      'nasdaq', 'terminal', 'ssr', 'postgresql', 'postgrest', 
      'astro', 'svelte', 'docker', 'nginx', 'clearinghouse',
      'foundation-first', 'architecture'
    ];

    prohibitedTerms.forEach(term => {
      expect(screen.queryByText(new RegExp(term, 'i'))).not.toBeInTheDocument();
    });
  });

  it('uses consistent user-friendly terminology', () => {
    render(MinecraftMarketplace, {
      props: {
        homepageData: {
          marketStats: { totalItems: 42, activeShops: 8 },
          categories: [],
          featuredItems: []
        }
      }
    });

    // Preferred terminology should be used consistently
    const preferredTerms = [
      'marketplace', 'items', 'buy', 'sell', 'shops', 'community'
    ];

    preferredTerms.forEach(term => {
      expect(screen.getByText(new RegExp(term, 'i'))).toBeInTheDocument();
    });
  });
});