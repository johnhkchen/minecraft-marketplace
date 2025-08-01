/**
 * API Failure Pattern Detection - Unit Tests
 * 
 * PURPOSE: Catch API failure patterns at the code level before they reach the browser
 * APPROACH: Test different failure scenarios and validate fallback behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupFastTests } from '../utils/fast-test-setup.js';

setupFastTests();

describe('API Failure Pattern Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect when functions return synthetic data patterns', async () => {
    const { loadHomepageData } = await import('../../workspaces/frontend/src/lib/homepage-data.js');
    
    const result = await loadHomepageData();
    
    // Pattern detection: Synthetic item signatures
    const syntheticItemNames = ['Elytra', 'Netherite Sword', 'Totem of Undying', 'Mending Book'];
    const realItemNames = ['Oak Wood', 'Stone Bricks', 'Glass', 'Golden Apple'];
    
    const allItemNames = [
      ...result.featuredItems.map(item => item.name),
      ...result.allItems.map(item => item.name)
    ];
    
    const syntheticCount = allItemNames.filter(name => syntheticItemNames.includes(name)).length;
    const realCount = allItemNames.filter(name => realItemNames.includes(name)).length;
    
    console.log('🔍 Data Pattern Analysis:');
    console.log(`  Total items: ${allItemNames.length}`);
    console.log(`  Synthetic items: ${syntheticCount} (${syntheticItemNames.filter(name => allItemNames.includes(name))})`);
    console.log(`  Real items: ${realCount} (${realItemNames.filter(name => allItemNames.includes(name))})`);
    console.log(`  Shop names: ${[...new Set([...result.featuredItems.map(item => item.shopName), ...result.allItems.map(item => item.shopName)])]}`);
    
    // DETECTION: High synthetic ratio indicates API fallback
    if (allItemNames.length > 0) {
      const syntheticRatio = syntheticCount / allItemNames.length;
      
      if (syntheticRatio > 0.5) {
        throw new Error(`❌ HIGH SYNTHETIC RATIO: ${(syntheticRatio * 100).toFixed(0)}% synthetic items indicates API failure fallback`);
      }
      
      if (syntheticCount > 0 && realCount === 0) {
        throw new Error(`❌ PURE SYNTHETIC DATA: All items are synthetic, no real marketplace data found`);
      }
    }
    
    // DETECTION: Statistics inconsistency
    if (result.marketStats.totalItems > 10 && allItemNames.length < 5) {
      console.warn(`⚠️ STATS INCONSISTENCY: Reports ${result.marketStats.totalItems} items but only ${allItemNames.length} loaded`);
    }
    
    console.log('✅ Data patterns indicate real marketplace content');
  });

  it('should detect fallback data structure patterns', async () => {
    const { loadHomepageData } = await import('../../workspaces/frontend/src/lib/homepage-data.js');
    
    const result = await loadHomepageData();
    
    // Pattern: Fallback data often has unrealistic or default values
    const fallbackPatterns = {
      zeroCounts: result.marketStats.totalItems === 0 || result.marketStats.activeShops === 0,
      defaultPagination: result.pagination.totalPages === 1 && result.pagination.currentPage === 1 && result.pagination.totalItems === 0,
      emptyCategories: result.categories.length === 0,
      noActivity: result.recentActivity.length === 0,
      suspiciouslyRoundNumbers: [
        result.marketStats.totalItems,
        result.marketStats.activeShops,
        result.pagination.totalItems
      ].some(num => num > 0 && num % 10 === 0 && num % 100 === 0), // 100, 200, 1000 etc.
    };
    
    console.log('🔍 Fallback Pattern Analysis:');
    Object.entries(fallbackPatterns).forEach(([pattern, detected]) => {
      console.log(`  ${pattern}: ${detected ? '⚠️ DETECTED' : '✅ OK'}`);
    });
    
    const fallbackCount = Object.values(fallbackPatterns).filter(Boolean).length;
    
    if (fallbackCount >= 3) {
      throw new Error(`❌ MULTIPLE FALLBACK PATTERNS: ${fallbackCount}/5 fallback indicators detected - API likely failing`);
    }
    
    if (fallbackPatterns.zeroCounts && fallbackPatterns.defaultPagination && fallbackPatterns.emptyCategories) {
      throw new Error(`❌ COMPLETE FALLBACK: All core data structures show fallback patterns`);
    }
    
    console.log('✅ Data structures indicate real API responses');
  });

  it('should detect unrealistic data that indicates test/mock data', async () => {
    const { loadHomepageData } = await import('../../workspaces/frontend/src/lib/homepage-data.js');
    
    const result = await loadHomepageData();
    
    const allItems = [...result.featuredItems, ...result.allItems];
    
    // Analyze price patterns for realism
    const prices = allItems.map(item => item.price).filter(price => price > 0);
    const suspiciousPatterns = {
      noVariation: prices.length > 1 && new Set(prices).size === 1,
      unrealisticallyHigh: prices.some(price => price > 500), // 500+ diamonds is suspicious
      perfectRoundNumbers: prices.filter(price => price % 100 === 0).length / prices.length > 0.8,
      testSequence: prices.some(price => [123, 456, 789, 999, 1234].includes(price)),
    };
    
    // Analyze name patterns
    const names = allItems.map(item => item.name);
    const namePatterns = {
      testPrefixes: names.some(name => /^(test|mock|sample|demo|fake)/i.test(name)),
      numberedSequence: names.filter(name => /_\d+$/.test(name)).length > 2, // item_1, item_2, etc.
      tooSimilar: names.some(name => names.filter(n => n.includes(name.split(' ')[0])).length > 3),
    };
    
    // Analyze shop patterns
    const shops = [...new Set(allItems.map(item => item.shopName))];
    const shopPatterns = {
      testShops: shops.some(shop => /^(test|mock|sample|demo)/i.test(shop)),
      tooFewShops: shops.length === 1 && allItems.length > 5,
      sequentialNames: shops.some(shop => /\d+$/.test(shop)), // Shop1, Shop2, etc.
    };
    
    console.log('🔍 Realism Analysis:');
    console.log(`  Prices: ${prices} (${prices.length} items)`);
    console.log(`  Names: ${names.slice(0, 5)}${names.length > 5 ? '...' : ''}`);
    console.log(`  Shops: ${shops}`);
    
    const allPatterns = { ...suspiciousPatterns, ...namePatterns, ...shopPatterns };
    const suspiciousCount = Object.values(allPatterns).filter(Boolean).length;
    
    console.log('  Suspicious patterns:');
    Object.entries(allPatterns).forEach(([pattern, detected]) => {
      if (detected) console.log(`    ⚠️ ${pattern}`);
    });
    
    if (suspiciousCount >= 4) {
      throw new Error(`❌ UNREALISTIC DATA: ${suspiciousCount} suspicious patterns detected - using test/mock data`);
    }
    
    if (namePatterns.testPrefixes || shopPatterns.testShops) {
      throw new Error(`❌ TEST DATA DETECTED: Found explicit test/mock prefixes in names or shops`);
    }
    
    console.log('✅ Data appears realistic for production marketplace');
  });

  it('should detect API call failure signatures in console output', async () => {
    // Mock console to capture error patterns
    const consoleLogs = [];
    const consoleErrors = [];
    
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = (...args) => {
      consoleLogs.push(args.join(' '));
      originalConsoleLog(...args);
    };
    
    console.error = (...args) => {
      consoleErrors.push(args.join(' '));
      originalConsoleError(...args);
    };
    
    try {
      const { loadHomepageData } = await import('../../workspaces/frontend/src/lib/homepage-data.js');
      await loadHomepageData();
      
      // Analyze console output for API failure patterns
      const apiFailureSignatures = [
        'Failed to fetch',
        'Network error',
        'Connection refused',
        'ECONNREFUSED',
        'timeout',
        'API call failed',
        'fetch failed',
        'Error loading',
        'Using fallback',
        'Using default'
      ];
      
      const suspiciousLogs = [...consoleLogs, ...consoleErrors].filter(log =>
        apiFailureSignatures.some(signature => log.toLowerCase().includes(signature.toLowerCase()))
      );
      
      console.log('🔍 Console Analysis:');
      console.log(`  Total logs: ${consoleLogs.length}`);
      console.log(`  Total errors: ${consoleErrors.length}`);
      console.log(`  Suspicious entries: ${suspiciousLogs.length}`);
      
      if (suspiciousLogs.length > 0) {
        console.log('  Suspicious messages:');
        suspiciousLogs.forEach(log => console.log(`    ⚠️ ${log}`));
        
        throw new Error(`❌ API FAILURE SIGNATURES: Found ${suspiciousLogs.length} console messages indicating API failures`);
      }
      
      console.log('✅ No API failure signatures in console output');
      
    } finally {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    }
  });

  it('should validate data freshness patterns', async () => {
    const { loadHomepageData } = await import('../../workspaces/frontend/src/lib/homepage-data.js');
    
    const result = await loadHomepageData();
    
    // Check timestamps and freshness indicators
    const allItems = [...result.featuredItems, ...result.allItems];
    
    // Pattern: All items having identical or sequential timestamps suggests mock data
    const timestamps = allItems
      .map(item => item.createdAt || item.updatedAt)
      .filter(Boolean)
      .map(ts => new Date(ts).getTime());
    
    const timestampPatterns = {
      noTimestamps: timestamps.length === 0 && allItems.length > 0,
      identicalTimestamps: timestamps.length > 1 && new Set(timestamps).size === 1,
      sequentialTimestamps: timestamps.length > 2 && timestamps.every((ts, i) => 
        i === 0 || ts === timestamps[i-1] + 1000 // Exactly 1 second apart
      ),
      futureDates: timestamps.some(ts => ts > Date.now() + 86400000), // More than 1 day in future
      ancientDates: timestamps.some(ts => ts < Date.now() - 31536000000), // More than 1 year old
    };
    
    console.log('🔍 Freshness Analysis:');
    console.log(`  Timestamps found: ${timestamps.length}/${allItems.length} items`);
    if (timestamps.length > 0) {
      const dates = timestamps.map(ts => new Date(ts).toISOString().split('T')[0]);
      console.log(`  Date range: ${Math.min(...dates)} to ${Math.max(...dates)}`);
    }
    
    const freshnessIssues = Object.entries(timestampPatterns).filter(([, detected]) => detected);
    
    if (freshnessIssues.length > 0) {
      console.log('  Freshness issues:');
      freshnessIssues.forEach(([issue]) => console.log(`    ⚠️ ${issue}`));
      
      if (freshnessIssues.length >= 2) {
        throw new Error(`❌ DATA FRESHNESS ISSUES: ${freshnessIssues.length} timestamp patterns suggest mock/test data`);
      }
    }
    
    console.log('✅ Data freshness patterns appear normal');
  });
});