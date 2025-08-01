/**
 * E2E Test: Homepage Data Discrepancy Debug
 * 
 * CRITICAL ISSUE DISCOVERED: Homepage shows "18 items from 4 shops" but API returns 55 items from 7 shops
 * 
 * This test will debug exactly what's happening between the API and homepage display
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage Data Discrepancy Debug', () => {
  test('should debug why homepage shows 18 items when API has 55 items', async ({ page }) => {
    console.log('🔍 HOMEPAGE DATA DISCREPANCY INVESTIGATION');
    console.log('API returns 55 items from 7 shops, but homepage shows 18 items from 4 shops');
    console.log('');

    // Monitor network requests to see what the homepage actually requests
    const apiRequests: Array<{url: string, status: number, responseSize: number}> = [];
    
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/data/')) {
        try {
          const responseText = await response.text();
          apiRequests.push({
            url: url,
            status: response.status(),
            responseSize: responseText.length
          });
          
          // Log the actual response for debugging
          console.log(`📡 API Request: ${response.status()} ${url}`);
          console.log(`   Response size: ${responseText.length} characters`);
          
          // Try to parse and show item count
          try {
            const responseData = JSON.parse(responseText);
            if (Array.isArray(responseData)) {
              console.log(`   Items returned: ${responseData.length}`);
              
              // Show sample items
              if (responseData.length > 0) {
                console.log(`   Sample item: ${JSON.stringify(responseData[0]).substring(0, 100)}...`);
              }
            }
          } catch (e) {
            console.log(`   Response type: ${typeof responseText}`);
          }
          console.log('');
        } catch (error) {
          console.log(`   Error reading response: ${error.message}`);
        }
      }
    });

    // Navigate to homepage
    console.log('🌐 Loading homepage...');
    await page.goto('http://localhost:7410');
    await page.waitForLoadState('networkidle');
    
    // Give it extra time for all API calls to complete
    await page.waitForTimeout(3000);
    
    console.log('📊 HOMEPAGE DISPLAY ANALYSIS:');
    
    // Extract what the homepage actually shows
    const displayedData = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      
      // Look for the stats display "X items for sale from Y shops"
      const statsMatch = bodyText.match(/(\d+)\s+items?\s+for\s+sale\s+from\s+(\d+)\s+shops?/i);
      
      // Count actual item listings on the page
      const itemElements = document.querySelectorAll('[data-testid*="item"], .item-card, .listing, .product');
      
      // Look for item names or prices
      const itemTexts = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        return text.match(/diamond|sword|pickaxe|helmet|boots|elytra|totem/i) && 
               text.length < 100 && // Not the whole page
               text.trim().length > 3;
      }).map(el => el.textContent?.trim()).slice(0, 10);
      
      return {
        statsMatch: statsMatch ? {
          items: parseInt(statsMatch[1]),
          shops: parseInt(statsMatch[2])
        } : null,
        itemElementsCount: itemElements.length,
        itemTexts: itemTexts,
        fullText: bodyText.substring(0, 500)
      };
    });
    
    console.log('   Homepage stats display:');
    if (displayedData.statsMatch) {
      console.log(`     Items: ${displayedData.statsMatch.items}`);
      console.log(`     Shops: ${displayedData.statsMatch.shops}`);
    } else {
      console.log('     No stats display found');
    }
    
    console.log(`   Item elements on page: ${displayedData.itemElementsCount}`);
    console.log('   Item texts found:');
    displayedData.itemTexts.forEach((text, index) => {
      console.log(`     ${index + 1}. ${text}`);
    });
    
    console.log('');
    console.log('🔍 API REQUESTS SUMMARY:');
    console.log(`   Total API calls made: ${apiRequests.length}`);
    apiRequests.forEach((req, index) => {
      console.log(`   ${index + 1}. ${req.status} ${req.url} (${req.responseSize} chars)`);
    });
    
    console.log('');
    console.log('🎯 DISCREPANCY ANALYSIS:');
    
    if (displayedData.statsMatch) {
      const displayedItems = displayedData.statsMatch.items;
      const displayedShops = displayedData.statsMatch.shops;
      
      console.log(`   Homepage shows: ${displayedItems} items from ${displayedShops} shops`);
      console.log(`   Expected: 55 items from 7 shops`);
      
      if (displayedItems < 55) {
        console.log('   🚨 ISSUE: Homepage is not displaying all available items');
        console.log('   Possible causes:');
        console.log('     • Pagination limiting results');
        console.log('     • Filtering reducing item count');
        console.log('     • API returning different data to homepage');
        console.log('     • Frontend processing logic error');
      }
      
      if (displayedShops < 7) {
        console.log('   🚨 ISSUE: Homepage is not showing all shops');
        console.log('     • Some shops may have no active items');
        console.log('     • Shop counting logic may be incorrect');
      }
    }
    
    // Take screenshot showing current state
    await page.screenshot({ 
      path: 'test-results/homepage-discrepancy-debug.png',
      fullPage: true 
    });
    
    console.log('📸 Screenshot saved: test-results/homepage-discrepancy-debug.png');
    
    // The test validates the discrepancy exists and logs debugging info
    expect(apiRequests.length).toBeGreaterThan(0); // Should have made API calls
    
    if (displayedData.statsMatch) {
      // This should fail if the discrepancy exists, showing us the exact numbers
      console.log('');
      console.log('⚠️ ASSERTION: This test will FAIL to highlight the discrepancy issue');
      expect(displayedData.statsMatch.items).toBe(55); // This should fail, showing us the actual count
    }
  });

  test('should test direct API calls vs homepage data loading', async ({ page }) => {
    console.log('');
    console.log('🔄 DIRECT API vs HOMEPAGE COMPARISON');
    console.log('Testing if the issue is in API responses or homepage processing');
    console.log('');

    await page.goto('http://localhost:7410');
    
    // Test direct API calls from the browser context
    const apiTestResults = await page.evaluate(async () => {
      const tests = [
        { name: 'All items', url: '/api/data/public_items' },
        { name: 'Paginated items', url: '/api/data/public_items?limit=20&offset=0&order=price_diamonds.desc' },
        { name: 'Shop names', url: '/api/data/public_items?select=owner_shop_name' },
        { name: 'Total count', url: '/api/data/public_items?select=id' }
      ];
      
      const results = [];
      
      for (const test of tests) {
        try {
          const response = await fetch(test.url);
          const data = await response.json();
          
          let itemCount = 0;
          let shopCount = 0;
          
          if (Array.isArray(data)) {
            itemCount = data.length;
            
            if (test.name === 'Shop names') {
              const uniqueShops = new Set(data.map(item => item.owner_shop_name).filter(Boolean));
              shopCount = uniqueShops.size;
            }
          }
          
          results.push({
            name: test.name,
            url: test.url,
            status: response.status,
            itemCount,
            shopCount,
            sampleData: Array.isArray(data) ? data.slice(0, 2) : null
          });
          
        } catch (error) {
          results.push({
            name: test.name,
            url: test.url,
            error: error.message
          });
        }
      }
      
      return results;
    });
    
    console.log('📊 Direct API Test Results:');
    apiTestResults.forEach(result => {
      console.log(`   ${result.name}:`);
      if (result.error) {
        console.log(`     ❌ Error: ${result.error}`);
      } else {
        console.log(`     Status: ${result.status}`);
        console.log(`     Items: ${result.itemCount}`);
        if (result.shopCount > 0) {
          console.log(`     Shops: ${result.shopCount}`);
        }
      }
      console.log('');
    });
    
    // Test the homepage data loading function if available
    console.log('🏠 Testing homepage data loading logic...');
    
    const homepageDataResult = await page.evaluate(async () => {
      try {
        // Try to access the homepage data loading function
        // This simulates what the homepage component does
        const response = await fetch('/api/data/public_items?limit=20&offset=0&order=price_diamonds.desc');
        const items = await response.json();
        
        const totalResponse = await fetch('/api/data/public_items?select=id');
        const totalItems = await totalResponse.json();
        
        const shopsResponse = await fetch('/api/data/public_items?select=owner_shop_name');
        const shopsData = await shopsResponse.json();
        const uniqueShops = new Set(shopsData.map(item => item.owner_shop_name).filter(Boolean));
        
        return {
          displayedItems: items.length,
          totalItems: totalItems.length,
          uniqueShops: uniqueShops.size,
          success: true
        };
      } catch (error) {
        return {
          error: error.message,
          success: false
        };
      }
    });
    
    if (homepageDataResult.success) {
      console.log('   Homepage data loading simulation:');
      console.log(`     Displayed items: ${homepageDataResult.displayedItems}`);
      console.log(`     Total items: ${homepageDataResult.totalItems}`);
      console.log(`     Unique shops: ${homepageDataResult.uniqueShops}`);
      
      console.log('');
      console.log('🎯 COMPARISON RESULTS:');
      console.log(`   API returns ${homepageDataResult.totalItems} total items`);
      console.log(`   API returns ${homepageDataResult.uniqueShops} unique shops`);
      console.log(`   Homepage should display ${homepageDataResult.displayedItems} items (first page)`);
      
      if (homepageDataResult.totalItems !== 55) {
        console.log('   🚨 ISSUE: API is not returning 55 items as expected');
      }
      
      if (homepageDataResult.uniqueShops !== 7) {
        console.log('   🚨 ISSUE: API is not returning 7 unique shops as expected');
      }
      
    } else {
      console.log(`   ❌ Homepage data loading failed: ${homepageDataResult.error}`);
    }
    
    expect(true).toBe(true); // Diagnostic test
  });
});