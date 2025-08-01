/**
 * Debug Test: Find what's preventing termination
 * 
 * PURPOSE: Identify what keeps the test runner hanging after test completion
 */

import { test, expect } from '@playwright/test';

test.describe('Termination Debug', () => {
  test('should complete and terminate immediately', async ({ page, context, browser }) => {
    console.log('🚀 Test starting...');
    
    const startTime = performance.now();
    
    try {
      console.log('📍 Step 1: Navigate to page');
      await page.goto('/');
      console.log(`✅ Navigation completed in ${(performance.now() - startTime).toFixed(0)}ms`);
      
      console.log('📍 Step 2: Check basic elements');
      const h1Count = await page.locator('h1').count();
      console.log(`✅ Found ${h1Count} h1 elements`);
      
      console.log('📍 Step 3: Test logic complete, should terminate now');
      
      // Force cleanup
      console.log('🧹 Forcing cleanup...');
      await page.close();
      console.log('✅ Page closed');
      
      await context.close();
      console.log('✅ Context closed');
      
      const totalTime = performance.now() - startTime;
      console.log(`⏱️ Test logic completed in ${totalTime.toFixed(0)}ms`);
      console.log('🎯 If hanging occurs after this, it\'s a Playwright/runner issue');
      
      expect(h1Count).toBeGreaterThan(0);
      
    } catch (error) {
      console.error('❌ Test error:', error.message);
      throw error;
    }
  });

  test('should test without browser operations', async () => {
    console.log('🚀 No-browser test starting...');
    
    const startTime = performance.now();
    
    // Just do some basic assertions without browser
    expect(1 + 1).toBe(2);
    expect('test').toBe('test');
    
    const endTime = performance.now() - startTime;
    console.log(`⏱️ No-browser test completed in ${endTime.toFixed(0)}ms`);
    console.log('🎯 This should terminate immediately');
  });

  test('should test minimal page interaction', async ({ page }) => {
    console.log('🚀 Minimal page test starting...');
    
    const startTime = performance.now();
    
    // Just navigate - no other operations
    await page.goto('/');
    
    const endTime = performance.now() - startTime;
    console.log(`⏱️ Minimal page test completed in ${endTime.toFixed(0)}ms`);
    console.log('🎯 Checking if navigation alone causes hanging');
    
    // Don't interact with page further
    expect(true).toBe(true);
  });
});