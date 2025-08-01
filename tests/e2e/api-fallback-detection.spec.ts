/**
 * API Fallback Detection Suite
 * 
 * PURPOSE: Broadly catch when API calls fail and systems fall back to synthetic/test data
 * PATTERN: Detect discrepancies between reported stats and actual displayed data
 */

import { test, expect } from '@playwright/test';

test.describe('API Fallback Detection', () => {
  
  test('should detect when displayed data contradicts reported statistics', async ({ page }) => {
    await page.goto('/');
    
    // Get reported statistics
    const marketStats = page.locator('.market-status');
    const statsText = await marketStats.textContent() || '';
    
    const itemsMatch = statsText.match(/(\d+).*items/);
    const shopsMatch = statsText.match(/from\s+(\d+).*shops/);
    const reportedItems = itemsMatch ? parseInt(itemsMatch[1]) : 0;
    const reportedShops = shopsMatch ? parseInt(shopsMatch[1]) : 0;
    
    // Get actually displayed data
    const displayedItems = await page.locator('.item-name').count();
    const displayedItemNames = await page.locator('.item-name').allTextContents();
    
    // Get unique shops from displayed items
    const shopElements = page.locator('.shop-name');
    const displayedShopNames = await shopElements.allTextContents();
    const uniqueShops = new Set(displayedShopNames.map(name => name.trim()));
    
    console.log('📊 Statistics Analysis:');
    console.log(`  Reported: ${reportedItems} items from ${reportedShops} shops`);
    console.log(`  Displayed: ${displayedItems} items from ${uniqueShops.size} shops`);
    console.log(`  Item names: ${displayedItemNames}`);
    
    // PATTERN 1: Stats report many items but few are displayed (pagination working)
    if (reportedItems > 10 && displayedItems < 8) {
      console.log('✅ Normal pagination pattern detected');
    }
    
    // PATTERN 2: Stats report realistic numbers but displayed items are synthetic
    const syntheticItems = ['Elytra', 'Netherite Sword', 'Totem of Undying', 'Mending Book'];
    const syntheticCount = displayedItemNames.filter(name => syntheticItems.includes(name)).length;
    
    if (reportedItems > 15 && syntheticCount === displayedItems && displayedItems > 0) {
      throw new Error(`❌ API FALLBACK DETECTED: Stats report ${reportedItems} items but displaying ${syntheticCount} synthetic items: ${displayedItemNames.join(', ')}`);
    }
    
    // PATTERN 3: Shop count mismatch (stats vs displayed)
    if (reportedShops > 3 && uniqueShops.size <= 1) {
      throw new Error(`❌ SHOP DATA FALLBACK: Stats report ${reportedShops} shops but only displaying ${uniqueShops.size} unique shops`);
    }
    
    // PATTERN 4: Completely empty display despite reported stats
    if (reportedItems > 0 && displayedItems === 0) {
      throw new Error(`❌ DISPLAY FAILURE: Stats report ${reportedItems} items but nothing displayed`);
    }
    
    console.log('✅ No API fallback patterns detected');
  });

  test('should detect synthetic data signatures across different page sections', async ({ page }) => {
    await page.goto('/');
    
    // Check all sections that might display items
    const sections = [
      { name: 'Featured Items', selector: '.market-item .item-name' },
      { name: 'All Items Grid', selector: '.item-card .item-name' },
      { name: 'Recent Activity', selector: '.activity-item .item-name' },
      { name: 'Category Lists', selector: '.category-item .item-name' }
    ];
    
    const syntheticSignatures = {
      items: ['Elytra', 'Netherite Sword', 'Totem of Undying', 'Mending Book', 'Diamond Pickaxe'],
      shops: ['Test Shop', 'Demo Store', 'Sample Vendor', 'Mock Shop'],
      prices: [9999, 1234, 5678, 999999], // Unrealistic test prices
      categories: ['test_category', 'mock_category', 'sample_category']
    };
    
    const realSignatures = {
      items: ['Oak Wood', 'Stone Bricks', 'Glass', 'Golden Apple', 'Cooked Beef', 'Obsidian'],
      shops: ['Redstone Robotics', 'Stone Emporium', 'Glass Works', 'Wood Shop'],
      prices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30], // Realistic diamond prices
    };
    
    let totalSyntheticScore = 0;
    let totalRealScore = 0;
    let sectionsAnalyzed = 0;
    
    for (const section of sections) {
      const elements = page.locator(section.selector);
      const count = await elements.count();
      
      if (count > 0) {
        sectionsAnalyzed++;
        console.log(`🔍 Analyzing ${section.name}: ${count} items`);
        
        const texts = await elements.allTextContents();
        
        // Score synthetic vs real content
        let sectionSyntheticScore = 0;
        let sectionRealScore = 0;
        
        for (const text of texts) {
          if (syntheticSignatures.items.some(item => text.includes(item))) {
            sectionSyntheticScore += 2; // High weight for synthetic items
          }
          if (realSignatures.items.some(item => text.includes(item))) {
            sectionRealScore += 2; // High weight for real items
          }
        }
        
        totalSyntheticScore += sectionSyntheticScore;
        totalRealScore += sectionRealScore;
        
        console.log(`  Synthetic score: ${sectionSyntheticScore}, Real score: ${sectionRealScore}`);
      }
    }
    
    console.log(`📊 Overall Analysis (${sectionsAnalyzed} sections):`);
    console.log(`  Total synthetic score: ${totalSyntheticScore}`);
    console.log(`  Total real score: ${totalRealScore}`);
    
    // DETECTION: High synthetic score indicates API fallback
    if (totalSyntheticScore > totalRealScore && totalSyntheticScore > 4) {
      throw new Error(`❌ SYNTHETIC DATA DOMINANCE: Synthetic score (${totalSyntheticScore}) > Real score (${totalRealScore}) - API calls likely failing`);
    }
    
    // DETECTION: Zero real content is suspicious
    if (sectionsAnalyzed > 0 && totalRealScore === 0 && totalSyntheticScore > 0) {
      throw new Error(`❌ NO REAL DATA: Found synthetic content but zero real marketplace data across ${sectionsAnalyzed} sections`);
    }
    
    console.log('✅ Data signatures indicate real marketplace content');
  });

  test('should detect performance inconsistencies that indicate API problems', async ({ page }) => {
    const navigationStart = performance.now();
    await page.goto('/');
    const navigationTime = performance.now() - navigationStart;
    
    // Measure data loading phases
    const phases = [];
    
    // Phase 1: Static content (should be instant)
    const staticStart = performance.now();
    const h1Count = await page.locator('h1').count();
    const staticTime = performance.now() - staticStart;
    phases.push({ name: 'Static Content', time: staticTime, expected: '<50ms' });
    
    // Phase 2: API-dependent content (market stats)
    const apiStart = performance.now();
    const statsCount = await page.locator('.market-status').count();
    const apiTime = performance.now() - apiStart;
    phases.push({ name: 'API Content', time: apiTime, expected: '<200ms' });
    
    // Phase 3: Dynamic items (could be API or fallback)
    const itemsStart = performance.now();
    const itemCount = await page.locator('.item-name').count();
    const itemsTime = performance.now() - itemsStart;
    phases.push({ name: 'Items Display', time: itemsTime, expected: '<100ms' });
    
    console.log('⏱️ Performance Analysis:');
    console.log(`  Navigation: ${navigationTime.toFixed(0)}ms`);
    phases.forEach(phase => {
      console.log(`  ${phase.name}: ${phase.time.toFixed(0)}ms (expected ${phase.expected})`);
    });
    
    // PATTERN: API content taking too long suggests timeouts/fallbacks
    if (apiTime > 5000) { // 5s is suspiciously long for localhost
      console.warn(`⚠️ API content took ${apiTime.toFixed(0)}ms - possible timeout/fallback`);
    }
    
    // PATTERN: Static content slow suggests fundamental issues
    if (staticTime > 1000) {
      throw new Error(`❌ STATIC CONTENT SLOW: ${staticTime.toFixed(0)}ms indicates fundamental performance issues`);
    }
    
    // PATTERN: Items loading instantly might indicate cached/fallback data
    if (itemsTime < 10 && itemCount > 0) {
      console.log(`🤔 Items loaded very quickly (${itemsTime.toFixed(0)}ms) - could be cached or fallback data`);
      
      // Cross-check with actual item content
      const itemNames = await page.locator('.item-name').allTextContents();
      const syntheticItems = ['Elytra', 'Netherite Sword', 'Totem of Undying', 'Mending Book'];
      const hasSynthetic = itemNames.some(name => syntheticItems.includes(name));
      
      if (hasSynthetic) {
        console.warn(`⚠️ Fast loading + synthetic items = likely fallback data`);
      }
    }
    
    console.log('✅ Performance patterns analyzed');
  });

  test('should detect API endpoint availability patterns', async ({ page }) => {
    // Intercept network requests to detect API call patterns
    const apiCalls = [];
    const failedCalls = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/') && !response.ok()) {
        failedCalls.push({
          url: response.url(),
          status: response.status(),
          timestamp: Date.now()
        });
      }
    });
    
    await page.goto('/');
    
    // Wait a moment for any async API calls
    await page.waitForTimeout(500);
    
    console.log('🌐 Network Analysis:');
    console.log(`  API calls made: ${apiCalls.length}`);
    console.log(`  Failed API calls: ${failedCalls.length}`);
    
    if (apiCalls.length > 0) {
      console.log('  API endpoints called:');
      apiCalls.forEach(call => {
        console.log(`    ${call.method} ${call.url}`);
      });
    }
    
    if (failedCalls.length > 0) {
      console.log('  Failed API calls:');
      failedCalls.forEach(call => {
        console.log(`    ${call.status} ${call.url}`);
      });
      
      throw new Error(`❌ API FAILURES DETECTED: ${failedCalls.length} API calls failed - likely causing fallback to synthetic data`);
    }
    
    // PATTERN: No API calls suggests static/fallback mode
    if (apiCalls.length === 0) {
      console.warn('⚠️ NO API CALLS: Page loaded without making API requests - using static/fallback data?');
      
      // Check if we're seeing synthetic data
      const itemNames = await page.locator('.item-name').allTextContents();
      const syntheticItems = ['Elytra', 'Netherite Sword', 'Totem of Undying', 'Mending Book'];
      const syntheticCount = itemNames.filter(name => syntheticItems.includes(name)).length;
      
      if (syntheticCount > 0) {
        throw new Error(`❌ NO API CALLS + SYNTHETIC DATA: Found ${syntheticCount} synthetic items without API calls - system in fallback mode`);
      }
    }
    
    console.log('✅ Network patterns analyzed');
  });
});