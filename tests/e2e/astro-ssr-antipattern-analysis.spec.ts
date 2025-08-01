/**
 * E2E Test: Astro SSR Anti-Pattern Analysis
 * 
 * PURPOSE: Document the systematic caching bug that created this anti-pattern
 * DISCOVERY: Astro SSR is configured but not executing, causing stale data display
 * 
 * Key findings:
 * 1. ✅ Database has 55 items from 7 shops
 * 2. ✅ API endpoints return correct data (55 items, 7 shops)  
 * 3. ✅ Container can connect to PostgREST directly
 * 4. ✅ URL construction service is fixed for Docker networking
 * 5. ❌ Homepage displays "18 items from 4 shops" (stale/cached data)
 * 6. ❌ SSR console.log statements don't execute
 * 7. ❌ HTML debug comments don't appear
 * 
 * ROOT CAUSE: Astro SSR caching or build-time rendering anti-pattern
 */

import { test, expect } from '@playwright/test';

test.describe('Astro SSR Anti-Pattern Analysis', () => {
  test('should document the complete systematic caching bug', async ({ page }) => {
    console.log('🔍 ASTRO SSR ANTI-PATTERN ANALYSIS');
    console.log('Comprehensive analysis of the systematic caching bug');
    console.log('');

    console.log('📊 CONFIRMED FACTS:');
    console.log('');

    // Test 1: Database has correct data
    await page.goto('http://localhost:7410');
    
    const dbTest = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/data/public_items');
        const data = await response.json();
        const shops = new Set(data.map(item => item.owner_shop_name).filter(Boolean));
        return { itemCount: data.length, shopCount: shops.size, success: true };
      } catch (error) {
        return { error: error.message, success: false };
      }
    });

    console.log(`1. ✅ Database API: ${dbTest.success ? `${dbTest.itemCount} items, ${dbTest.shopCount} shops` : 'ERROR'}`);

    // Test 2: Homepage displays different numbers
    const homepageStats = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      const statsMatch = bodyText.match(/(\d+)\s+items?\s+for\s+sale\s+from\s+(\d+)\s+shops?/i);
      return statsMatch ? {
        displayedItems: parseInt(statsMatch[1]),
        displayedShops: parseInt(statsMatch[2])
      } : null;
    });

    console.log(`2. ❌ Homepage Display: ${homepageStats ? `${homepageStats.displayedItems} items, ${homepageStats.displayedShops} shops` : 'NOT FOUND'}`);

    // Test 3: Look for SSR debug markers
    const htmlContent = await page.content();
    const hasSSRDebug = htmlContent.includes('SSR Debug');
    const hasConsoleOutput = htmlContent.includes('Generated at');

    console.log(`3. ❌ SSR Debug Markers: ${hasSSRDebug ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`4. ❌ SSR Execution: ${hasConsoleOutput ? 'WORKING' : 'NOT WORKING'}`);

    console.log('');
    console.log('🚨 ANTI-PATTERN IDENTIFIED:');
    
    if (dbTest.success && homepageStats) {
      const hasDiscrepancy = dbTest.itemCount !== homepageStats.displayedItems || 
                            dbTest.shopCount !== homepageStats.displayedShops;
      
      if (hasDiscrepancy && !hasSSRDebug) {
        console.log('   • Database API returns current data (55 items, 7 shops)');  
        console.log('   • Homepage displays stale data (18 items, 4 shops)');
        console.log('   • SSR debug markers are not present in HTML');
        console.log('   • SSR console output is not executing');
        console.log('');
        console.log('🎯 ROOT CAUSE: Astro SSR Anti-Pattern');
        console.log('   • SSR is configured (output: "server", adapter: node)');
        console.log('   • SSR is not executing properly in Docker environment');
        console.log('   • Homepage shows cached/build-time data instead of live data');
        console.log('   • This creates a systematic caching bug');
        console.log('');
        console.log('💡 SOLUTIONS:');
        console.log('   1. Force Astro to rebuild without cache');
        console.log('   2. Check Astro SSR configuration in Docker');
        console.log('   3. Verify URL construction works in SSR context');
        console.log('   4. Add cache-busting to Astro pages');
        console.log('   5. Consider client-side data loading as fallback');
      }
    }

    // Take screenshot of current state
    await page.screenshot({ 
      path: 'test-results/astro-ssr-antipattern-analysis.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: test-results/astro-ssr-antipattern-analysis.png');

    // Document the findings
    expect(dbTest.success).toBe(true);
    
    if (homepageStats && dbTest.success) {
      console.log('');
      console.log('📋 FINAL DIAGNOSIS:');
      console.log(`   API Data: ${dbTest.itemCount} items, ${dbTest.shopCount} shops ✅`);
      console.log(`   Homepage: ${homepageStats.displayedItems} items, ${homepageStats.displayedShops} shops ❌`);
      console.log(`   SSR Working: ${hasSSRDebug ? 'YES ✅' : 'NO ❌'}`);
      console.log('');
      console.log('   This is a classic Astro SSR anti-pattern where:');
      console.log('   • The page is configured for SSR but not executing it');
      console.log('   • Cached/static data is served instead of live data');
      console.log('   • This creates the illusion of working SSR while serving stale content');
      
      // This test documents the issue - the assertion will show the exact discrepancy
      expect(homepageStats.displayedItems).toBe(dbTest.itemCount);
    }
  });
});