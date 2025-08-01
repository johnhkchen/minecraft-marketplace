/**
 * Simple E2E Test: Homepage Content Check
 * 
 * PURPOSE: Simple validation of what's actually displayed on the homepage
 * This will help us understand the current state without assuming specific selectors
 */

import { test, expect } from '@playwright/test';

test.describe('Simple Homepage Check', () => {
  test('should load homepage and show what content is actually there', async ({ page }) => {
    console.log('🌐 Loading homepage at http://localhost:7410');
    
    // Navigate to homepage
    await page.goto('http://localhost:7410');
    
    // Wait for basic page load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for manual inspection
    await page.screenshot({ 
      path: 'test-results/homepage-content-check.png',
      fullPage: true 
    });
    
    // Get basic page info
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body.textContent?.substring(0, 1000) || '',
        hasContent: document.body.textContent?.length || 0,
        urls: Array.from(document.querySelectorAll('a')).map(a => a.href).slice(0, 10),
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent).slice(0, 10),
        visibleElements: document.querySelectorAll('*:not(:empty)').length
      };
    });
    
    console.log('📄 Page Information:');
    console.log(`   Title: ${pageInfo.title}`);
    console.log(`   Content length: ${pageInfo.hasContent} characters`);
    console.log(`   Visible elements: ${pageInfo.visibleElements}`);
    console.log('');
    
    console.log('📝 Headings found:');
    pageInfo.headings.forEach((heading, index) => {
      console.log(`   ${index + 1}. ${heading}`);
    });
    console.log('');
    
    console.log('🔍 Sample page content:');
    console.log(pageInfo.bodyText.replace(/\s+/g, ' ').trim());
    console.log('');
    
    // Basic assertions - the page should load and have content
    expect(pageInfo.hasContent).toBeGreaterThan(100); // Should have substantial content
    expect(pageInfo.title).toBeTruthy(); // Should have a title
    
    console.log('✅ Homepage loaded successfully with content');
    console.log('📸 Screenshot saved: test-results/homepage-content-check.png');
  });

  test('should detect if homepage shows any marketplace-related content', async ({ page }) => {
    console.log('🏪 Checking for marketplace-related content');
    
    await page.goto('http://localhost:7410');
    await page.waitForLoadState('networkidle');
    
    // Look for marketplace-related keywords
    const marketplaceContent = await page.evaluate(() => {
      const bodyText = (document.body.textContent || '').toLowerCase();
      
      const marketplaceKeywords = [
        'marketplace',
        'items',
        'shops',
        'diamond',
        'price',
        'trading',
        'minecraft',
        'sword',
        'pickaxe',
        'helmet',
        'boots'
      ];
      
      const foundKeywords = marketplaceKeywords.filter(keyword => 
        bodyText.includes(keyword)
      );
      
      // Look for numbers that might be item counts or prices
      const numbers = bodyText.match(/\b\d+\b/g) || [];
      const largeNumbers = numbers.filter(n => parseInt(n) > 10);
      
      return {
        foundKeywords,
        keywordCount: foundKeywords.length,
        numbers: largeNumbers.slice(0, 10),
        hasMarketplaceContent: foundKeywords.length >= 3
      };
    });
    
    console.log('🔍 Marketplace content analysis:');
    console.log(`   Keywords found: ${marketplaceContent.foundKeywords.join(', ')}`);
    console.log(`   Keyword count: ${marketplaceContent.keywordCount}`);
    console.log(`   Numbers found: ${marketplaceContent.numbers.join(', ')}`);
    console.log(`   Has marketplace content: ${marketplaceContent.hasMarketplaceContent ? '✅ YES' : '❌ NO'}`);
    
    if (marketplaceContent.hasMarketplaceContent) {
      console.log('✅ Homepage appears to show marketplace content');
    } else {
      console.log('⚠️ Homepage may not be showing marketplace content as expected');
    }
    
    // Should have some marketplace-related content
    expect(marketplaceContent.keywordCount).toBeGreaterThan(0);
  });
});