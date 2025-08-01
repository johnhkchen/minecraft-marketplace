/**
 * Homepage Smoke Test - E2E
 * 
 * Simple end-to-end test to validate the root page loads properly.
 * This is a valuable smoke test that ensures the application starts correctly.
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage Smoke Tests', () => {
  test('should load the homepage successfully', async ({ page }) => {
    // Navigate to the root page
    await page.goto('/');
    
    // Check that the page loads (no 500 errors)
    await expect(page).toHaveTitle(/Minecraft Marketplace|Marketplace/i);
    
    // Check for basic page structure
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Verify page doesn't show error messages
    const errorMessages = page.locator('text=500').or(page.locator('text=Error'));
    await expect(errorMessages).toHaveCount(0);
  });

  test('should have proper HTML structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic HTML elements
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang');
    
    const head = page.locator('head');
    await expect(head).toBeAttached();
    
    const body = page.locator('body');
    await expect(body).toBeAttached();
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const jsErrors: Error[] = [];
    
    // Capture JavaScript errors
    page.on('pageerror', (error) => {
      jsErrors.push(error);
    });
    
    await page.goto('/');
    
    // Wait a moment for any async JavaScript to run
    await page.waitForTimeout(1000);
    
    // Verify no JavaScript errors occurred
    expect(jsErrors).toHaveLength(0);
  });

  test('should respond within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds (reasonable for E2E)
    expect(loadTime).toBeLessThan(5000);
  });
});