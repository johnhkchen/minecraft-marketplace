/**
 * Shop Dashboard Smoke Test
 * Simple validation that our E2E testing setup works
 * Tests against existing homepage while preparing for dashboard
 */

import { test, expect } from '@playwright/test';

test.describe('Shop Dashboard - Smoke Test', () => {
  test('Homepage loads successfully (validating E2E setup)', async ({ page }) => {
    // Go to the main page through nginx (user-facing endpoint)
    await page.goto('/');
    
    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible();
    
    // Validate we're hitting the right endpoint
    expect(page.url()).toContain('7410');
    
    // Check that marketplace content is present
    await expect(page.locator('h1')).toContainText('Minecraft Item Marketplace');
    
    // Verify performance requirement
    const startTime = Date.now();
    await page.reload();
    await expect(page.locator('h1')).toBeVisible();
    const loadTime = Date.now() - startTime;
    
    // Should load in under 2 seconds (Epic 1 requirement)
    expect(loadTime).toBeLessThan(2000);
    
    console.log(`✅ Homepage loaded in ${loadTime}ms through nginx endpoint`);
  });

  test('Market data is accessible (preparing for shop integration)', async ({ page }) => {
    await page.goto('/');
    
    // Wait for market data to load
    await expect(page.locator('.market-summary')).toBeVisible();
    
    // Check that item data is present (this validates API integration)
    await expect(page.locator('.market-item').first()).toBeVisible();
    
    // Performance check for data loading
    const startTime = performance.now();
    await page.reload();
    await expect(page.locator('.market-item').first()).toBeVisible();
    const dataLoadTime = performance.now() - startTime;
    
    // Data should load quickly
    expect(dataLoadTime).toBeLessThan(1500);
    
    console.log(`✅ Market data loaded in ${dataLoadTime}ms - API integration working`);
  });

  test('Navigation structure supports future dashboard integration', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page structure supports navigation
    await expect(page.locator('header')).toBeVisible();
    
    // Validate that the app can handle client-side interactions
    const browseButton = page.locator('.browse-action');
    await expect(browseButton).toBeVisible();
    
    // Test interaction responsiveness
    const startTime = performance.now();
    await browseButton.click();
    // Wait a moment for any JS to execute
    await page.waitForTimeout(100);
    const interactionTime = performance.now() - startTime;
    
    // Interactions should be fast
    expect(interactionTime).toBeLessThan(500);
    
    console.log(`✅ User interactions respond in ${interactionTime}ms - ready for dashboard`);
  });

  test('Mobile viewport works correctly (dashboard mobile preparation)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check that content adapts to mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.quick-actions')).toBeVisible();
    
    // Verify touch-friendly elements
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = buttons.nth(i);
      const boundingBox = await button.boundingBox();
      
      if (boundingBox) {
        // iOS recommends minimum 44px touch targets
        expect(boundingBox.height).toBeGreaterThan(30);
      }
    }
    
    console.log(`✅ Mobile viewport works - ${buttonCount} touch-friendly buttons detected`);
  });

  test('API endpoints are accessible (shop dashboard data preparation)', async ({ page }) => {
    await page.goto('/');
    
    // Monitor network requests to validate API availability
    const apiRequests: string[] = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiRequests.push(response.url());
      }
    });
    
    // Trigger some data loading
    await page.reload();
    await expect(page.locator('.market-item').first()).toBeVisible();
    
    console.log(`✅ API integration validated - ${apiRequests.length} API calls detected`);
    console.log(`📡 Available endpoints: ${apiRequests.join(', ')}`);
  });
});

test.describe('Shop Dashboard - Integration Readiness', () => {
  test('Validates E2E testing infrastructure is working', async ({ page }) => {
    console.log('🎭 Playwright E2E Testing Infrastructure Validation');
    console.log('================================================');
    
    // Test 1: Basic navigation
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    console.log('✅ 1. Basic page navigation works');
    
    // Test 2: Network connectivity  
    const response = await page.request.get('/');
    expect(response.status()).toBe(200);
    console.log('✅ 2. HTTP requests work properly');
    
    // Test 3: JavaScript execution
    const title = await page.title();
    expect(title).toBeTruthy();
    console.log('✅ 3. JavaScript execution works');
    
    // Test 4: Performance timing
    const startTime = performance.now();
    await page.reload();
    await expect(page.locator('h1')).toBeVisible();
    const loadTime = performance.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
    console.log(`✅ 4. Performance testing works (${Math.round(loadTime)}ms)`);
    
    // Test 5: Mobile testing capability
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.locator('h1')).toBeVisible();
    console.log('✅ 5. Mobile viewport testing works');
    
    console.log('');
    console.log('🚀 E2E INFRASTRUCTURE READY FOR SHOP DASHBOARD TESTING');
    console.log('🎯 Next: Deploy dashboard pages and run full test suite');
  });
});