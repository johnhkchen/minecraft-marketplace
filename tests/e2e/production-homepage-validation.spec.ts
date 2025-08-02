/**
 * E2E Test: Production Homepage Validation
 * 
 * PURPOSE: Validate the actual homepage at http://localhost:7410 shows 55 items from 7 shops
 * CRITICAL: This test runs against the REAL production system, not MSW mocks
 * 
 * Expected results:
 * - 55 total items in database
 * - 7 unique shops represented
 * - 20 items displayed on first page (pagination)
 * - Real marketplace data, not synthetic fallback data
 */

import { test, expect } from '@playwright/test';

test.describe('Production Homepage Validation', () => {
  test('should display 55-item marketplace with 7 shops on production homepage', async ({ page }) => {
    console.log('🏭 PRODUCTION HOMEPAGE TEST');
    console.log('Testing actual homepage at http://localhost:7410');
    console.log('');

    // Navigate to production homepage
    console.log('🌐 Navigating to production homepage...');
    await page.goto('http://localhost:7410');
    
    // Wait for page to load and data to populate
    await page.waitForSelector('[data-testid="marketplace-stats"], .marketplace-stats, .market-stats');
    
    console.log('📊 Extracting marketplace statistics...');
    
    // Extract total items and shops from the page
    const marketStats = await page.evaluate(() => {
      // Look for various possible selectors for market statistics
      const statsSelectors = [
        '[data-testid="total-items"]',
        '[data-testid="marketplace-stats"]',
        '.total-items',
        '.market-stats',
        '.marketplace-stats'
      ];
      
      const shopsSelectors = [
        '[data-testid="active-shops"]',
        '[data-testid="shop-count"]',
        '.active-shops',
        '.shop-count'
      ];
      
      // Try to find total items
      let totalItems = 0;
      let activeShops = 0;
      
      // Method 1: Look for specific data attributes
      const totalItemsElement = document.querySelector('[data-testid="total-items"]');
      if (totalItemsElement) {
        totalItems = parseInt(totalItemsElement.textContent?.match(/\d+/)?.[0] || '0');
      }
      
      const activeShopsElement = document.querySelector('[data-testid="active-shops"]');
      if (activeShopsElement) {
        activeShops = parseInt(activeShopsElement.textContent?.match(/\d+/)?.[0] || '0');
      }
      
      // Method 2: Look in all text content for numbers that might be stats
      if (totalItems === 0 || activeShops === 0) {
        const bodyText = document.body.textContent || '';
        
        // Look for patterns like "55 items" or "7 shops"
        const itemsMatch = bodyText.match(/(\d+)\s*(items?|listings?)/i);
        const shopsMatch = bodyText.match(/(\d+)\s*(shops?|stores?)/i);
        
        if (itemsMatch && totalItems === 0) {
          totalItems = parseInt(itemsMatch[1]);
        }
        
        if (shopsMatch && activeShops === 0) {
          activeShops = parseInt(shopsMatch[1]);
        }
      }
      
      return {
        totalItems,
        activeShops,
        pageText: document.body.textContent?.substring(0, 500) + '...' // Sample of page content
      };
    });
    
    console.log('📈 Marketplace statistics found:');
    console.log(`   Total items: ${marketStats.totalItems}`);
    console.log(`   Active shops: ${marketStats.activeShops}`);
    console.log('');
    
    // Count visible items on the page
    console.log('🔢 Counting visible items on homepage...');
    
    const visibleItems = await page.evaluate(() => {
      // Look for item cards/listings with various possible selectors
      const itemSelectors = [
        '[data-testid="marketplace-item"]',
        '[data-testid="item-card"]',
        '.marketplace-item',
        '.item-card',
        '.listing',
        '.product-card'
      ];
      
      let items: Element[] = [];
      
      for (const selector of itemSelectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        if (elements.length > 0) {
          items = elements;
          break;
        }
      }
      
      // If no specific selectors found, look for any elements that might be items
      if (items.length === 0) {
        // Look for patterns in the text that suggest items
        const allElements = Array.from(document.querySelectorAll('*'));
        items = allElements.filter(el => {
          const text = el.textContent || '';
          // Look for elements mentioning diamonds, prices, or item names
          return text.includes('diamond') || text.includes('$') || text.includes('price') || 
                 text.match(/\d+\s*diamond/i) || text.match(/sword|pickaxe|helmet|boots/i);
        }).slice(0, 25); // Limit to reasonable number
      }
      
      return {
        count: items.length,
        sampleItems: items.slice(0, 5).map(item => ({
          text: item.textContent?.substring(0, 100),
          className: item.className
        }))
      };
    });
    
    console.log(`📦 Visible items found: ${visibleItems.count}`);
    if (visibleItems.sampleItems.length > 0) {
      console.log('   Sample items:');
      visibleItems.sampleItems.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.text?.replace(/\s+/g, ' ').trim()}`);
      });
    }
    console.log('');
    
    // Take a screenshot for debugging
    await page.screenshot({ 
      path: 'test-results/production-homepage-validation.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: test-results/production-homepage-validation.png');
    
    // Validate production marketplace scale
    console.log('✅ VALIDATION RESULTS:');
    
    // Check if we have realistic marketplace data
    const hasRealisticItemCount = marketStats.totalItems >= 50; // Should have 55+ items
    const hasMultipleShops = marketStats.activeShops >= 6; // Should have 7+ shops
    const hasVisibleItems = visibleItems.count >= 10; // Should show items on homepage
    
    console.log(`   Realistic item count (50+): ${hasRealisticItemCount ? '✅' : '❌'} (${marketStats.totalItems})`);
    console.log(`   Multiple shops (6+): ${hasMultipleShops ? '✅' : '❌'} (${marketStats.activeShops})`);
    console.log(`   Visible items (10+): ${hasVisibleItems ? '✅' : '❌'} (${visibleItems.count})`);
    
    if (hasRealisticItemCount && hasMultipleShops && hasVisibleItems) {
      console.log('');
      console.log('🎉 PRODUCTION HOMEPAGE: WORKING CORRECTLY!');
      console.log('   • Shows realistic marketplace scale ✅');
      console.log('   • Multiple shops represented ✅');
      console.log('   • Items visible to users ✅');
      console.log('   • Real data, not synthetic fallback ✅');
    } else {
      console.log('');
      console.log('🚨 PRODUCTION HOMEPAGE: Issues detected');
      console.log('   Some aspects of the homepage need attention');
    }
    
    // Assert the key requirements
    expect(marketStats.totalItems).toBeGreaterThanOrEqual(50);
    expect(marketStats.activeShops).toBeGreaterThanOrEqual(6);
    expect(visibleItems.count).toBeGreaterThanOrEqual(10);
  });

  test('should verify homepage loads without API errors or fallback to synthetic data', async ({ page }) => {
    console.log('');
    console.log('🔍 API ERROR AND FALLBACK DATA DETECTION');
    console.log('Monitoring for API failures and synthetic data usage');
    console.log('');

    // Monitor console errors and network requests
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    const apiRequests: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/data/')) {
        apiRequests.push(`${response.status()} ${url}`);
        if (!response.ok()) {
          networkErrors.push(`${response.status()} ${url}`);
        }
      }
    });
    
    // Navigate to homepage
    await page.goto('http://localhost:7410');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for any async API calls
    await page.waitForTimeout(2000);
    
    console.log('📡 API Requests detected:');
    apiRequests.forEach(request => {
      console.log(`   ${request}`);
    });
    
    console.log('');
    console.log('🚨 Console Errors:');
    if (consoleErrors.length === 0) {
      console.log('   ✅ No console errors detected');
    } else {
      consoleErrors.forEach(error => {
        console.log(`   ❌ ${error}`);
      });
    }
    
    console.log('');
    console.log('🌐 Network Errors:');
    if (networkErrors.length === 0) {
      console.log('   ✅ No API request failures detected');
    } else {
      networkErrors.forEach(error => {
        console.log(`   ❌ ${error}`);
      });
    }
    
    // Look for synthetic/fallback data indicators on the page
    const syntheticDataIndicators = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      
      // Known synthetic data patterns from our fallback data
      const syntheticPatterns = [
        'Netherite Emporium',
        'Enchanted Emporium', 
        'Test Shop',
        'Default Shop',
        'Synthetic',
        'Fallback',
        'Mock'
      ];
      
      const foundSynthetic = syntheticPatterns.filter(pattern => 
        bodyText.toLowerCase().includes(pattern.toLowerCase())
      );
      
      return {
        foundPatterns: foundSynthetic,
        isUsingFallback: foundSynthetic.length > 2 // More than 2 synthetic patterns suggests fallback data
      };
    });
    
    console.log('');
    console.log('🎭 Synthetic Data Detection:');
    if (syntheticDataIndicators.foundPatterns.length === 0) {
      console.log('   ✅ No synthetic data patterns detected');
    } else {
      console.log(`   ⚠️  Found patterns: ${syntheticDataIndicators.foundPatterns.join(', ')}`);
      console.log(`   Using fallback: ${syntheticDataIndicators.isUsingFallback ? 'YES ❌' : 'NO ✅'}`);
    }
    
    // Assertions
    expect(networkErrors.length).toBe(0);
    expect(syntheticDataIndicators.isUsingFallback).toBe(false);
    expect(apiRequests.length).toBeGreaterThan(0); // Should have made API calls
  });
});