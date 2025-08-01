/**
 * E2E Test: Homepage Real Data Symptom Detection
 * 
 * PURPOSE: Catch when homepage shows default/synthetic data instead of real marketplace items
 * SYMPTOM: Homepage displays hardcoded items like "Elytra" instead of real items like "Oak Wood"
 * 
 * This test will FAIL when the bug resurfaces, alerting us immediately
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage Real Data Display', () => {
  test('should display real marketplace items, not synthetic test data', async ({ page }) => {
    // Go to homepage
    await page.goto('/');
    
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Minecraft Item Marketplace');
    
    // SYMPTOM TEST: Check that we're NOT showing the old synthetic items
    // These items indicate the bug has returned
    const syntheticItems = [
      'Elytra',           // 207 diamonds - synthetic high-value item
      'Netherite Sword',  // 108 diamonds - synthetic high-value item  
      'Totem of Undying', // 90 diamonds - synthetic high-value item
      'Mending Book'      // 45 diamonds - synthetic high-value item
    ];
    
    // FAIL if we see ALL synthetic items (indicates we're using fallback data)
    let syntheticCount = 0;
    for (const itemName of syntheticItems) {
      const itemElement = page.locator('.item-name').filter({ hasText: itemName });
      if (await itemElement.count() > 0) {
        syntheticCount++;
      }
    }
    
    // If we see 3+ synthetic items, we're definitely using fallback data
    expect(syntheticCount).toBeLessThan(3);
    
    // PASS: Check that we ARE showing real marketplace items
    // These items indicate the system is working correctly
    const realMarketplaceItems = [
      'Oak Wood',         // 4.5 diamonds - real marketplace item
      'Stone Bricks',     // 6.75 diamonds - real marketplace item
      'Glass',            // 9 diamonds - real marketplace item
      'Golden Apple',     // 0.5 diamonds - real marketplace item
      'Cooked Beef',      // 2.25 diamonds - real marketplace item
      'Obsidian'          // 4 diamonds - real marketplace item
    ];
    
    // We should see at least 2 real marketplace items
    let realItemCount = 0;
    for (const itemName of realMarketplaceItems) {
      const itemElement = page.locator('.item-name').filter({ hasText: itemName });
      if (await itemElement.count() > 0) {
        realItemCount++;
        console.log(`✅ Found real item: ${itemName}`);
      }
    }
    
    // ASSERTION: We should see real marketplace data
    expect(realItemCount).toBeGreaterThanOrEqual(2);
    
    // Additional check: Look for pagination section (indicates new functionality is working)
    const paginationSection = page.locator('text=All Marketplace Items');
    if (await paginationSection.count() > 0) {
      console.log('✅ Pagination section found - new functionality working');
      
      // Check pagination shows more than featured items
      const allItems = page.locator('.item-card');
      const itemCount = await allItems.count();
      console.log(`📦 Total items displayed: ${itemCount}`);
      
      // Should show more than just the 4-6 featured items
      expect(itemCount).toBeGreaterThan(6);
    }
  });

  test('should show correct market statistics from real data', async ({ page }) => {
    await page.goto('/');
    
    // Check market stats reflect real data, not synthetic data
    const marketStats = page.locator('.market-status');
    await expect(marketStats).toBeVisible();
    
    const statsText = await marketStats.textContent();
    console.log('📊 Market stats:', statsText);
    
    // Real marketplace has 18+ items, not just 4 synthetic items
    expect(statsText).toMatch(/\d+.*items.*for.*sale/);
    
    // Extract the number of items
    const itemsMatch = statsText?.match(/(\d+).*items/);
    if (itemsMatch) {
      const itemCount = parseInt(itemsMatch[1]);
      console.log(`🔢 Items count: ${itemCount}`);
      
      // Should show real marketplace item count (18+), not fallback count (0-4)
      expect(itemCount).toBeGreaterThanOrEqual(15);
    }
  });

  test('should display items sorted by price (highest first)', async ({ page }) => {
    await page.goto('/');
    
    // Get all displayed item prices
    const priceElements = page.locator('.price-display');
    const priceCount = await priceElements.count();
    
    if (priceCount > 1) {
      const prices: number[] = [];
      
      for (let i = 0; i < Math.min(priceCount, 6); i++) {
        const priceText = await priceElements.nth(i).textContent();
        // Extract numeric price from text like "23 diamond blocks per item"
        const priceMatch = priceText?.match(/(\d+(?:\.\d+)?)/);
        if (priceMatch) {
          prices.push(parseFloat(priceMatch[1]));
        }
      }
      
      console.log('💎 Price order:', prices);
      
      // Prices should be in descending order (highest first)
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
      }
    }
  });
});