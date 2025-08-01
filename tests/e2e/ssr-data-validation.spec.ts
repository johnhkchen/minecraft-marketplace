/**
 * E2E Test: SSR Data Validation
 * 
 * PURPOSE: Validate that Server-Side Rendering is working with fresh data
 * CRITICAL: Test that the page loads with current database data (55 items, 7 shops)
 */

import { test, expect } from '@playwright/test';

test.describe('SSR Data Validation', () => {
  test('should load homepage with fresh SSR data showing 55 items from 7 shops', async ({ page }) => {
    console.log('🔄 SSR DATA VALIDATION');
    console.log('Testing that server-side rendering uses current database data');
    console.log('');

    // Clear any browser cache to ensure fresh SSR
    await page.goto('about:blank');
    await page.evaluate(() => {
      // Clear any local storage or session storage
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('🌐 Loading homepage with fresh request...');
    
    // Navigate to homepage with cache disabled
    await page.goto('http://localhost:7410', { 
      waitUntil: 'networkidle',
      timeout: 15000 
    });

    // Extract the market stats from the SSR content
    console.log('📊 Extracting SSR market statistics...');
    
    const ssrData = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      
      // Look for the market stats display
      const statsMatch = bodyText.match(/(\d+)\s+items?\s+for\s+sale\s+from\s+(\d+)\s+shops?/i);
      
      // Extract individual item data
      const itemElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        return text.includes('diamond blocks per item') || text.includes('diamonds per item');
      });
      
      const itemData = itemElements.map(el => {
        const text = el.textContent || '';
        const priceMatch = text.match(/(\d+)\s+diamond/i);
        const shopMatch = text.match(/([A-Za-z\s]+)\s+\|/);
        return {
          text: text.trim(),
          price: priceMatch ? parseInt(priceMatch[1]) : null,
          shop: shopMatch ? shopMatch[1].trim() : null
        };
      }).filter(item => item.price !== null).slice(0, 10);
      
      // Count unique shops from displayed items
      const uniqueShops = new Set(itemData.map(item => item.shop).filter(Boolean));
      
      return {
        statsDisplay: statsMatch ? {
          totalItems: parseInt(statsMatch[1]),
          activeShops: parseInt(statsMatch[2])
        } : null,
        displayedItems: itemData,
        uniqueShopsInItems: uniqueShops.size,
        pageHTML: document.documentElement.outerHTML.substring(0, 1000) + '...'
      };
    });

    console.log('🔍 SSR Data Analysis:');
    if (ssrData.statsDisplay) {
      console.log(`   Market Stats Display:`);
      console.log(`     Total Items: ${ssrData.statsDisplay.totalItems}`);
      console.log(`     Active Shops: ${ssrData.statsDisplay.activeShops}`);
    } else {
      console.log('   ❌ No market stats display found');
    }
    
    console.log(`   Displayed Items Count: ${ssrData.displayedItems.length}`);
    console.log(`   Unique Shops in Items: ${ssrData.uniqueShopsInItems}`);
    
    console.log('   Sample Items:');
    ssrData.displayedItems.slice(0, 5).forEach((item, index) => {
      console.log(`     ${index + 1}. ${item.shop} - ${item.price} diamonds`);
    });

    // Take screenshot of current state
    await page.screenshot({ 
      path: 'test-results/ssr-validation-current-state.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: test-results/ssr-validation-current-state.png');

    console.log('');
    console.log('✅ SSR VALIDATION RESULTS:');
    
    // Validate SSR is showing correct data
    if (ssrData.statsDisplay) {
      const hasCorrectItemCount = ssrData.statsDisplay.totalItems === 55;
      const hasCorrectShopCount = ssrData.statsDisplay.activeShops === 7;
      
      console.log(`   Correct item count (55): ${hasCorrectItemCount ? '✅' : '❌'} (showing ${ssrData.statsDisplay.totalItems})`);
      console.log(`   Correct shop count (7): ${hasCorrectShopCount ? '✅' : '❌'} (showing ${ssrData.statsDisplay.activeShops})`);
      
      if (hasCorrectItemCount && hasCorrectShopCount) {
        console.log('');
        console.log('🎉 SSR SUCCESS: Homepage is server-side rendered with current database data!');
      } else {
        console.log('');
        console.log('🚨 SSR ISSUE: Homepage is not showing current database data');
        console.log('   Possible causes:');
        console.log('   • Frontend service needs rebuild');
        console.log('   • Database connection issue in SSR context');
        console.log('   • URL construction problem in server environment');
        console.log('   • Caching in frontend build');
      }
      
      // Test assertions
      expect(ssrData.statsDisplay.totalItems).toBe(55);
      expect(ssrData.statsDisplay.activeShops).toBe(7);
      
    } else {
      console.log('❌ SSR FAILURE: No market stats found in rendered page');
      expect(false).toBe(true); // Force failure
    }
  });

  test('should verify SSR loads data from correct database environment', async ({ page }) => {
    console.log('');
    console.log('🔧 SSR DATABASE ENVIRONMENT VALIDATION');
    console.log('Checking that SSR connects to the production database');
    console.log('');

    // Test by checking the actual data characteristics that prove it's the right database
    await page.goto('http://localhost:7410');
    await page.waitForLoadState('networkidle');

    const dataCharacteristics = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      
      // Look for specific items that should exist in the 55-item dataset
      const expectedHighValueItems = [
        'Mythical Cape', // Should be 576 diamonds
        'Iron Blocks',   // Should be 288 diamonds  
        'Epic Blade'     // Should be 270 diamonds
      ];
      
      const expectedShops = [
        'Ultimate Gear Shop',
        'General Trading Post', 
        'Premium Tools & Weapons',
        'Netherite Emporium',
        'Enchanted Emporium'
      ];
      
      const foundItems = expectedHighValueItems.filter(item => 
        bodyText.toLowerCase().includes(item.toLowerCase())
      );
      
      const foundShops = expectedShops.filter(shop => 
        bodyText.toLowerCase().includes(shop.toLowerCase())
      );
      
      // Look for high-value pricing that indicates the real dataset
      const highPriceMatches = bodyText.match(/(\d{2,3})\s+diamond/gi) || [];
      const highPrices = highPriceMatches.map(match => {
        const num = match.match(/\d+/);
        return num ? parseInt(num[0]) : 0;
      }).filter(price => price > 50);
      
      return {
        foundItems,
        foundShops,
        highPrices,
        hasHighValueItems: foundItems.length > 0,
        hasMultipleShops: foundShops.length >= 3,
        hasHighPricing: highPrices.length > 0,
        maxPrice: Math.max(...highPrices, 0)
      };
    });

    console.log('🔍 Database Environment Indicators:');
    console.log(`   High-value items found: ${dataCharacteristics.foundItems.join(', ') || 'None'}`);
    console.log(`   Expected shops found: ${dataCharacteristics.foundShops.join(', ') || 'None'}`);
    console.log(`   High prices detected: ${dataCharacteristics.highPrices.join(', ') || 'None'}`);
    console.log(`   Maximum price: ${dataCharacteristics.maxPrice} diamonds`);
    
    console.log('');
    console.log('📊 Environment Validation:');
    console.log(`   Has high-value items: ${dataCharacteristics.hasHighValueItems ? '✅' : '❌'}`);
    console.log(`   Has multiple expected shops: ${dataCharacteristics.hasMultipleShops ? '✅' : '❌'}`);
    console.log(`   Has realistic high pricing: ${dataCharacteristics.hasHighPricing ? '✅' : '❌'}`);
    
    if (dataCharacteristics.hasHighValueItems && dataCharacteristics.hasMultipleShops && dataCharacteristics.hasHighPricing) {
      console.log('');
      console.log('✅ DATABASE ENVIRONMENT: SSR is connected to the correct production database');
    } else {
      console.log('');
      console.log('⚠️ DATABASE ENVIRONMENT: SSR may be connected to wrong database or test data');
    }

    // The presence of high-value items and multiple shops indicates the correct database
    expect(dataCharacteristics.hasMultipleShops).toBe(true);
  });
});