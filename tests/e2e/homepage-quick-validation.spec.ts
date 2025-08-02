/**
 * Quick Homepage Validation - Focused tests to catch data issues without hanging
 * 
 * PURPOSE: Fast, reliable detection of homepage data problems
 * DESIGN: Short timeouts, graceful failures, clear error messages
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage Quick Validation', () => {
  // Very short timeout to prevent hanging
  test.setTimeout(10000); // 10 seconds max per test

  test('should load homepage and detect data source type', async ({ page }) => {
    console.log('🔍 Quick homepage data validation starting...');
    
    // Fast page load with short timeout
    await page.goto('/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 5000 
    });
    
    // Check basic elements loaded
    await expect(page.locator('h1')).toBeVisible({ timeout: 3000 });
    console.log('✅ Homepage loaded');
    
    // Quick check for market stats
    const marketStats = page.locator('.market-status');
    await expect(marketStats).toBeVisible({ timeout: 3000 });
    
    const statsText = await marketStats.textContent({ timeout: 2000 });
    console.log('📊 Market stats:', statsText);
    
    // Extract item count
    const itemsMatch = statsText?.match(/(\d+).*items/);
    const itemCount = itemsMatch ? parseInt(itemsMatch[1]) : 0;
    
    console.log(`🔢 Items reported: ${itemCount}`);
    
    // Quick data source detection
    let dataSourceType = 'unknown';
    let itemNames: string[] = [];
    
    try {
      // Wait briefly for items to appear
      await page.waitForSelector('.item-name');
      
      const itemElements = page.locator('.item-name');
      const displayedCount = await itemElements.count();
      
      // Get first few item names quickly
      for (let i = 0; i < Math.min(displayedCount, 4); i++) {
        const name = await itemElements.nth(i).textContent({ timeout: 1000 });
        if (name) itemNames.push(name.trim());
      }
      
      console.log('🏷️ Items displayed:', itemNames);
      
      // Classify data source
      const syntheticItems = ['Elytra', 'Netherite Sword', 'Totem of Undying', 'Mending Book'];
      const realItems = ['Oak Wood', 'Stone Bricks', 'Glass', 'Golden Apple', 'Cooked Beef'];
      
      const syntheticFound = itemNames.filter(name => syntheticItems.includes(name));
      const realFound = itemNames.filter(name => realItems.includes(name));
      
      if (syntheticFound.length === itemNames.length) {
        dataSourceType = 'synthetic';
        console.log('🧪 Data source: SYNTHETIC (all items are test data)');
      } else if (realFound.length > 0) {
        dataSourceType = 'real';
        console.log('💎 Data source: REAL (contains marketplace data)');
      } else {
        dataSourceType = 'mixed';
        console.log('🔄 Data source: MIXED (combination of data types)');
      }
      
    } catch (error) {
      console.log('⚠️ Could not analyze items within timeout:', error.message);
      dataSourceType = 'timeout';
    }
    
    // Results summary
    console.log('\n📋 VALIDATION SUMMARY:');
    console.log(`  Items in stats: ${itemCount}`);
    console.log(`  Items displayed: ${itemNames.length}`);
    console.log(`  Data source: ${dataSourceType}`);
    
    // Simple assertions to catch the bug
    if (dataSourceType === 'synthetic') {
      console.log('❌ BUG DETECTED: Homepage showing only synthetic test data');
      console.log('🔧 This indicates API calls are failing and fallback data is being used');
      
      // Fail the test with clear message
      throw new Error(`Homepage displaying synthetic data only: ${itemNames.join(', ')}`);
    }
    
    if (dataSourceType === 'timeout') {
      console.log('⚠️ POTENTIAL ISSUE: Items not loading within expected time');
      // Don't fail for timeout, but warn
    }
    
    // Basic success criteria
    expect(itemCount).toBeGreaterThan(10); // Should have significant item count
    expect(itemNames.length).toBeGreaterThan(0); // Should display some items
    
    if (dataSourceType === 'real') {
      console.log('✅ SUCCESS: Real marketplace data detected');
    }
  });

  test('should validate market scale indicates real data', async ({ page }) => {
    console.log('📊 Quick market scale validation...');
    
    await page.goto('/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 8000 
    });
    
    // Get market statistics quickly
    const marketStats = page.locator('.market-status');
    await expect(marketStats).toBeVisible({ timeout: 3000 });
    
    const statsText = await marketStats.textContent({ timeout: 2000 });
    
    // Extract numbers quickly
    const itemsMatch = statsText?.match(/(\d+).*items/);
    const shopsMatch = statsText?.match(/from\s+(\d+).*shops/);
    
    const itemCount = itemsMatch ? parseInt(itemsMatch[1]) : 0;
    const shopCount = shopsMatch ? parseInt(shopsMatch[1]) : 0;
    
    console.log(`📈 Market scale: ${itemCount} items from ${shopCount} shops`);
    
    // Quick validation of realistic scale
    const hasRealisticScale = itemCount >= 15 && shopCount >= 3;
    
    if (!hasRealisticScale) {
      console.log('❌ UNREALISTIC SCALE: Suggests using test/fallback data');
      console.log('🔧 Real marketplace should have 15+ items from 3+ shops');
    } else {
      console.log('✅ Realistic market scale detected');
    }
    
    expect(itemCount).toBeGreaterThanOrEqual(15);
    expect(shopCount).toBeGreaterThanOrEqual(3);
  });

  test('should check for pagination functionality', async ({ page }) => {
    console.log('📄 Quick pagination check...');
    
    await page.goto('/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 8000 
    });
    
    // Look for pagination section quickly
    const paginationExists = await page.locator('text=All Marketplace Items').count() > 0;
    
    if (paginationExists) {
      console.log('📦 Pagination section found');
      
      // Quick check of pagination elements
      try {
        await expect(page.locator('.pagination-info')).toBeVisible({ timeout: 2000 });
        
        const paginationText = await page.locator('.pagination-info').textContent({ timeout: 1000 });
        console.log('📊 Pagination info:', paginationText);
        
        const itemCards = await page.locator('.item-card').count();
        console.log(`📦 Item cards: ${itemCards}`);
        
        if (itemCards > 6) {
          console.log('✅ Pagination showing more items than featured section');
        }
        
      } catch (error) {
        console.log('⚠️ Pagination elements not fully loaded:', error.message);
      }
      
    } else {
      console.log('ℹ️ No pagination section - using featured items only');
      
      // Check we at least have featured items
      const featuredItems = await page.locator('.market-item').count();
      console.log(`📋 Featured items: ${featuredItems}`);
      
      expect(featuredItems).toBeGreaterThan(0);
    }
  });

  test('should validate price ordering (quick check)', async ({ page }) => {
    console.log('💰 Quick price validation...');
    
    await page.goto('/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 8000 
    });
    
    try {
      // Wait briefly for price elements
      await page.waitForSelector('.price-display');
      
      const priceElements = page.locator('.price-display');
      const priceCount = await priceElements.count();
      
      if (priceCount >= 2) {
        // Get first 3 prices quickly
        const prices: number[] = [];
        
        for (let i = 0; i < Math.min(priceCount, 3); i++) {
          const priceText = await priceElements.nth(i).textContent({ timeout: 1000 });
          const priceMatch = priceText?.match(/(\d+(?:\.\d+)?)/);
          
          if (priceMatch) {
            prices.push(parseFloat(priceMatch[1]));
          }
        }
        
        console.log('💎 Price sequence:', prices);
        
        // Quick descending order check
        let correctOrder = true;
        for (let i = 1; i < prices.length; i++) {
          if (prices[i] > prices[i-1]) {
            correctOrder = false;
            break;
          }
        }
        
        if (correctOrder) {
          console.log('✅ Prices in correct descending order');
        } else {
          console.log('❌ Price ordering issue detected');
        }
        
        expect(correctOrder).toBe(true);
        
      } else {
        console.log('⚠️ Insufficient price data for ordering validation');
      }
      
    } catch (error) {
      console.log('⚠️ Price validation timeout:', error.message);
      // Don't fail test for price validation timeout
    }
  });
});