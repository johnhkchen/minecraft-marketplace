/**
 * Performance-Based Homepage Validation - No arbitrary waits, measure actual performance
 * 
 * PURPOSE: Fast validation using performance measurements instead of timeouts
 * APPROACH: Measure actual load times, fail fast on real issues
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage Performance Validation', () => {
  test('should load and validate data source with performance measurements', async ({ page }) => {
    const startTime = performance.now();
    
    // Navigate without arbitrary timeout - let it succeed or fail naturally
    await page.goto('/');
    
    const navigationTime = performance.now() - startTime;
    console.log(`🚀 Navigation completed in ${navigationTime.toFixed(0)}ms`);
    
    // Measure time to get essential elements
    const elementsStartTime = performance.now();
    
    // Use immediate checks - either elements exist or they don't
    const h1 = page.locator('h1');
    const marketStats = page.locator('.market-status');
    
    // Check if elements are present (no timeout needed on localhost)
    const hasH1 = await h1.count() > 0;
    const hasMarketStats = await marketStats.count() > 0;
    
    const elementsTime = performance.now() - elementsStartTime;
    console.log(`🎯 Element detection completed in ${elementsTime.toFixed(0)}ms`);
    
    // Basic structure validation
    expect(hasH1).toBe(true);
    expect(hasMarketStats).toBe(true);
    
    // Fast data extraction - no waits, just get what's there
    const dataStartTime = performance.now();
    
    const statsText = await marketStats.textContent() || '';
    const itemElements = page.locator('.item-name');
    const itemCount = await itemElements.count();
    
    // Get all item names quickly
    const itemNames: string[] = [];
    for (let i = 0; i < itemCount; i++) {
      const name = await itemElements.nth(i).textContent();
      if (name) itemNames.push(name.trim());
    }
    
    const dataExtractionTime = performance.now() - dataStartTime;
    console.log(`📊 Data extraction completed in ${dataExtractionTime.toFixed(0)}ms`);
    
    // Total test time
    const totalTime = performance.now() - startTime;
    console.log(`⏱️ Total test time: ${totalTime.toFixed(0)}ms`);
    
    // Performance assertions - should be very fast on localhost
    expect(navigationTime).toBeLessThan(3000); // 3s max for navigation
    expect(elementsTime).toBeLessThan(100); // 100ms max for element detection
    expect(dataExtractionTime).toBeLessThan(500); // 500ms max for data extraction
    expect(totalTime).toBeLessThan(5000); // 5s max total
    
    // Data source analysis
    const syntheticItems = ['Elytra', 'Netherite Sword', 'Totem of Undying', 'Mending Book'];
    const realItems = ['Oak Wood', 'Stone Bricks', 'Glass', 'Golden Apple', 'Cooked Beef'];
    
    const syntheticFound = itemNames.filter(name => syntheticItems.includes(name));
    const realFound = itemNames.filter(name => realItems.includes(name));
    
    console.log('🏷️ Items found:', itemNames);
    console.log('🧪 Synthetic items:', syntheticFound.length);
    console.log('💎 Real items:', realFound.length);
    
    // Extract market stats quickly
    const itemsMatch = statsText.match(/(\d+).*items/);
    const shopsMatch = statsText.match(/from\s+(\d+).*shops/);
    const reportedItems = itemsMatch ? parseInt(itemsMatch[1]) : 0;
    const reportedShops = shopsMatch ? parseInt(shopsMatch[1]) : 0;
    
    console.log(`📈 Market stats: ${reportedItems} items from ${reportedShops} shops`);
    
    // Bug detection - fail immediately if synthetic data detected
    if (syntheticFound.length === itemNames.length && itemNames.length > 0) {
      throw new Error(`❌ BUG CONFIRMED: Homepage showing only synthetic data: ${itemNames.join(', ')}`);
    }
    
    // Validate realistic data
    expect(reportedItems).toBeGreaterThan(10);
    expect(reportedShops).toBeGreaterThan(2);
    expect(realFound.length).toBeGreaterThan(0);
    
    console.log('✅ Performance validation completed successfully');
  });

  test('should validate API responsiveness with direct measurements', async ({ page }) => {
    const startTime = performance.now();
    
    await page.goto('/');
    
    // Measure how long it takes to get market data
    const marketDataStartTime = performance.now();
    
    const marketStats = page.locator('.market-status');
    const statsCount = await marketStats.count();
    
    if (statsCount === 0) {
      throw new Error('❌ No market stats found - API likely failing');
    }
    
    const statsText = await marketStats.textContent() || '';
    const marketDataTime = performance.now() - marketDataStartTime;
    
    console.log(`📊 Market data retrieval: ${marketDataTime.toFixed(0)}ms`);
    
    // Extract numbers for validation
    const itemsMatch = statsText.match(/(\d+).*items/);
    const itemCount = itemsMatch ? parseInt(itemsMatch[1]) : 0;
    
    // Measure item display speed
    const itemDisplayStartTime = performance.now();
    const displayedItems = await page.locator('.item-name').count();
    const itemDisplayTime = performance.now() - itemDisplayStartTime;
    
    console.log(`🏷️ Item display detection: ${itemDisplayTime.toFixed(0)}ms`);
    console.log(`📦 Items: ${itemCount} reported, ${displayedItems} displayed`);
    
    // Performance requirements for API responsiveness
    expect(marketDataTime).toBeLessThan(200); // API data should be very fast
    expect(itemDisplayTime).toBeLessThan(100); // Item display should be instant
    
    // Data consistency
    expect(itemCount).toBeGreaterThan(0);
    expect(displayedItems).toBeGreaterThan(0);
    
    const totalApiTime = performance.now() - startTime;
    console.log(`⚡ Total API validation: ${totalApiTime.toFixed(0)}ms`);
    
    expect(totalApiTime).toBeLessThan(2000); // Should complete in under 2s
  });

  test('should detect hanging issues with performance monitoring', async ({ page }) => {
    const testStartTime = performance.now();
    const checkpoints: Array<{ name: string; time: number }> = [];
    
    const checkpoint = (name: string) => {
      const time = performance.now() - testStartTime;
      checkpoints.push({ name, time });
      console.log(`⏱️ ${name}: ${time.toFixed(0)}ms`);
    };
    
    checkpoint('Test started');
    
    await page.goto('/');
    checkpoint('Page loaded');
    
    // Check if basic elements exist immediately
    const h1Count = await page.locator('h1').count();
    checkpoint('H1 detection');
    
    const marketStatsCount = await page.locator('.market-status').count();
    checkpoint('Market stats detection');
    
    const itemCount = await page.locator('.item-name').count();
    checkpoint('Item count detection');
    
    // If we got here without hanging, check performance
    const totalTime = performance.now() - testStartTime;
    checkpoint(`Test completed (${totalTime.toFixed(0)}ms total)`);
    
    // Log performance profile
    console.log('📊 Performance Profile:');
    checkpoints.forEach(cp => {
      console.log(`  ${cp.name}: ${cp.time.toFixed(0)}ms`);
    });
    
    // Validate no hanging occurred
    expect(totalTime).toBeLessThan(3000); // Should complete very quickly
    
    // Validate elements were found
    expect(h1Count).toBeGreaterThan(0);
    expect(marketStatsCount).toBeGreaterThan(0);
    expect(itemCount).toBeGreaterThan(0);
    
    console.log('✅ No hanging detected - performance within acceptable limits');
  });
});