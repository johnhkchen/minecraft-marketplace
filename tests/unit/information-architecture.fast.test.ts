/**
 * Information Architecture Tests - Fast Version
 * Tests information architecture business logic without component rendering:
 * - Clear information hierarchy (IA1-IA5)
 * - User-centered language (CS1-CS4)
 * - Scannable layouts
 */

import { describe, it, expect } from 'vitest';
import { setupFastTests, measureSync, expectFastExecution } from '../utils/fast-test-setup';
import fs from 'fs';
import path from 'path';

// Setup MSW mocking for fast tests
setupFastTests();

const getComponentContent = (filename: string): string => {
  // Handle nested component paths
  const componentPath = filename === 'MarketplaceBrowser.svelte' 
    ? path.join(process.cwd(), 'workspaces/frontend/src/components/marketplace', filename)
    : path.join(process.cwd(), 'workspaces/frontend/src/components', filename);
  return fs.readFileSync(componentPath, 'utf-8');
};

describe('Information Architecture - Content Analysis', () => {
  it('validates clear site purpose in homepage content (IA1)', () => {
    const { result, timeMs } = measureSync(() => {
      const marketplaceContent = getComponentContent('MinecraftMarketplace.svelte');
      
      return {
        hasMainHeading: marketplaceContent.includes('Minecraft Item Marketplace'),
        hasValueProposition: marketplaceContent.includes('Buy and sell Minecraft items with your community'),
        hasClearPurpose: marketplaceContent.includes('<h1>Minecraft Item Marketplace</h1>'),
        hasSubtitle: marketplaceContent.includes('class="subtitle"')
      };
    });

    expect(result.hasMainHeading).toBe(true);
    expect(result.hasValueProposition).toBe(true);
    expect(result.hasClearPurpose).toBe(true);
    expect(result.hasSubtitle).toBe(true);
    expectFastExecution(timeMs, 5);
  });

  it('validates user action prioritization (IA1)', () => {
    const { result, timeMs } = measureSync(() => {
      const marketplaceContent = getComponentContent('MinecraftMarketplace.svelte');
      
      // Analyze the structure for user actions
      return {
        hasBrowseAction: marketplaceContent.includes('Browse Items'),
        hasSellAction: marketplaceContent.includes('Sell Items'),
        hasNavigation: marketplaceContent.includes('class="navigation"'),
        hasButtonElements: marketplaceContent.includes('<button'),
        techDetailsInDisclosure: marketplaceContent.includes('<details class="tech-details">')
      };
    });

    expect(result.hasBrowseAction).toBe(true);
    expect(result.hasSellAction).toBe(true);
    expect(result.hasNavigation).toBe(true);
    expect(result.hasButtonElements).toBe(true);
    expect(result.techDetailsInDisclosure).toBe(true);
    expectFastExecution(timeMs, 5);
  });

  it('validates market data presentation structure (IA2)', () => {
    const { result, timeMs } = measureSync(() => {
      const marketplaceContent = getComponentContent('MinecraftMarketplace.svelte');
      
      return {
        hasMarketStats: marketplaceContent.includes('class="market-stats"'),
        hasStatLabels: marketplaceContent.includes('stat-label'),
        hasStatValues: marketplaceContent.includes('stat-value'),
        hasStructuredData: marketplaceContent.includes('Items for Sale:') && 
                          marketplaceContent.includes('Item Types:') &&
                          marketplaceContent.includes('Active Shops:')
      };
    });

    expect(result.hasMarketStats).toBe(true);
    expect(result.hasStatLabels).toBe(true);
    expect(result.hasStatValues).toBe(true);
    expect(result.hasStructuredData).toBe(true);
    expectFastExecution(timeMs, 5);
  });

  it('validates progressive disclosure for technical details (IA3)', () => {
    const { result, timeMs } = measureSync(() => {
      const marketplaceContent = getComponentContent('MinecraftMarketplace.svelte');
      
      return {
        hasDetailsElement: marketplaceContent.includes('<details'),
        hasSummaryElement: marketplaceContent.includes('<summary>Technical Information</summary>'),
        techInfoHidden: marketplaceContent.includes('class="tech-details"'),
        hasServerInfo: marketplaceContent.includes('server-badge'),
        hasTechStack: marketplaceContent.includes('tech-stack')
      };
    });

    expect(result.hasDetailsElement).toBe(true);
    expect(result.hasSummaryElement).toBe(true);
    expect(result.techInfoHidden).toBe(true);
    expect(result.hasServerInfo).toBe(true);
    expect(result.hasTechStack).toBe(true);
    expectFastExecution(timeMs, 5);
  });

  it('validates responsive design structure (IA4)', () => {
    const { result, timeMs } = measureSync(() => {
      const marketplaceContent = getComponentContent('MinecraftMarketplace.svelte');
      
      return {
        hasMediaQueries: marketplaceContent.includes('@media (max-width: 768px)'),
        hasFlexboxLayout: marketplaceContent.includes('display: flex'),
        hasGridLayout: marketplaceContent.includes('display: grid') || 
                       marketplaceContent.includes('grid-template-columns'),
        hasResponsiveClasses: marketplaceContent.includes('flex-direction: column')
      };
    });

    expect(result.hasMediaQueries).toBe(true);
    expect(result.hasFlexboxLayout).toBe(true);
    expectFastExecution(timeMs, 5);
  });

  it('validates error handling and loading states (IA5)', () => {
    const { result, timeMs } = measureSync(() => {
      const marketplaceContent = getComponentContent('MinecraftMarketplace.svelte');
      
      return {
        hasErrorHandling: marketplaceContent.includes('error-message'),
        hasLoadingState: marketplaceContent.includes('loading-message'),
        hasConditionalRendering: marketplaceContent.includes('{#if error}') &&
                                marketplaceContent.includes('loading && listings.length === 0'),
        hasRetryButton: marketplaceContent.includes('onclick={() => loadListings()}') ||
                       marketplaceContent.includes('Retry')
      };
    });

    expect(result.hasErrorHandling).toBe(true);
    expect(result.hasLoadingState).toBe(true);
    expect(result.hasConditionalRendering).toBe(true);
    expect(result.hasRetryButton).toBe(true);
    expectFastExecution(timeMs, 5);
  });
});

describe('Information Architecture - Navigation Analysis', () => {
  it('validates navigation structure and accessibility', () => {
    const { result, timeMs } = measureSync(() => {
      const navigationContent = getComponentContent('Navigation.svelte');
      
      return {
        hasNavRole: navigationContent.includes('role="navigation"'),
        hasAriaLabel: navigationContent.includes('aria-label="Main navigation"'),
        hasCurrentPageIndicator: navigationContent.includes('aria-current'),
        hasSemanticMarkup: navigationContent.includes('<nav') && 
                          navigationContent.includes('<ul') &&
                          navigationContent.includes('<li'),
        hasKeyboardSupport: navigationContent.includes('.nav-link:focus') || 
                           navigationContent.includes(':focus')
      };
    });

    expect(result.hasNavRole).toBe(true);
    expect(result.hasAriaLabel).toBe(true);
    expect(result.hasCurrentPageIndicator).toBe(true);
    expect(result.hasSemanticMarkup).toBe(true);
    expect(result.hasKeyboardSupport).toBe(true);
    expectFastExecution(timeMs, 5);
  });

  it('validates navigation link structure', () => {
    const { result, timeMs } = measureSync(() => {
      const navigationContent = getComponentContent('Navigation.svelte');
      
      // Extract navigation links
      const linkPatterns = [
        'href="/"',
        'href="/browse"',
        'href="/sell"',
        'href="/shops"'
      ];
      
      return {
        hasHomeLink: navigationContent.includes('href="/"'),
        hasBrowseLink: navigationContent.includes('href="/browse"'),
        hasSellLink: navigationContent.includes('href="/sell"'),
        hasShopsLink: navigationContent.includes('href="/shops"'),
        hasActiveClass: navigationContent.includes('.active'),
        linkCount: linkPatterns.filter(pattern => navigationContent.includes(pattern)).length
      };
    });

    expect(result.hasHomeLink).toBe(true);
    expect(result.hasBrowseLink).toBe(true);
    expect(result.hasSellLink).toBe(true);
    expect(result.hasShopsLink).toBe(true);
    expect(result.hasActiveClass).toBe(true);
    expect(result.linkCount).toBe(4);
    expectFastExecution(timeMs, 5);
  });
});

describe('Information Architecture - Content Strategy', () => {
  it('validates user-centered language usage', () => {
    const { result, timeMs } = measureSync(() => {
      const marketplaceContent = getComponentContent('MinecraftMarketplace.svelte');
      
      return {
        usesUserLanguage: marketplaceContent.includes('Buy and sell') &&
                         marketplaceContent.includes('with your community'),
        avoidsJargon: !marketplaceContent.toLowerCase().includes('nasdaq') &&
                     !marketplaceContent.toLowerCase().includes('terminal'),
        hasCallsToAction: marketplaceContent.includes('Browse Items') &&
                         marketplaceContent.includes('Sell Items'),
        hasUserBenefits: marketplaceContent.includes('Items for Sale') &&
                        marketplaceContent.includes('Item Types')
      };
    });

    expect(result.usesUserLanguage).toBe(true);
    expect(result.avoidsJargon).toBe(true);
    expect(result.hasCallsToAction).toBe(true);
    expect(result.hasUserBenefits).toBe(true);
    expectFastExecution(timeMs, 5);
  });

  it('validates content organization and scanning', () => {
    const { result, timeMs } = measureSync(() => {
      const browserContent = getComponentContent('MarketplaceBrowser.svelte');
      
      return {
        hasSearchGuidance: browserContent.includes('What are you looking for?'),
        hasFilterOptions: browserContent.includes('More filters'),
        hasProgressiveDisclosure: browserContent.includes('<details'),
        hasStatusIndicators: browserContent.includes('Available to buy') ||
                            browserContent.includes('status-badge'),
        hasHelpText: browserContent.includes('Try searching for popular items')
      };
    });

    expect(result.hasSearchGuidance).toBe(true);
    expect(result.hasFilterOptions).toBe(true);
    expect(result.hasProgressiveDisclosure).toBe(true);
    expect(result.hasHelpText).toBe(true);
    expectFastExecution(timeMs, 5);
  });

  it('validates accessibility and semantic structure', () => {
    const { result, timeMs } = measureSync(() => {
      const browserContent = getComponentContent('MarketplaceBrowser.svelte');
      
      return {
        hasSemanticHTML: browserContent.includes('role="article"') &&
                        browserContent.includes('<header') &&
                        browserContent.includes('<footer'),
        hasLabels: browserContent.includes('aria-label') ||
                  browserContent.includes('<label'),
        hasHeadings: browserContent.includes('<h1>') || 
                    browserContent.includes('<h2>') ||
                    browserContent.includes('<h3>'),
        hasButtonRoles: browserContent.includes('<button')
      };
    });

    expect(result.hasSemanticHTML).toBe(true);
    expect(result.hasLabels).toBe(true);
    expect(result.hasHeadings).toBe(true);
    expect(result.hasButtonRoles).toBe(true);
    expectFastExecution(timeMs, 5);
  });
});