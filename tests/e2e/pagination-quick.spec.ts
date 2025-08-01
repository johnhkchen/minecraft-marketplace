import { test, expect } from '@playwright/test';

test('pagination works smoothly without full page animation', async ({ page }) => {
  const startTime = Date.now();
  
  // Navigate to homepage
  await page.goto('http://localhost:7410');
  
  // Wait for the page to be fully loaded
  await expect(page.locator('.pagination-controls')).toBeVisible();
  
  // Verify we're on page 1 initially
  await expect(page.locator('[data-testid="current-page"]')).toContainText('Page 1 of 3');
  
  // Click page 2 button
  await page.locator('button:has-text("2")').click();
  
  // Wait for pagination to complete (should be fast without scrolling)
  await page.waitForTimeout(500);
  
  // Verify we're now on page 2
  await expect(page.locator('[data-testid="current-page"]')).toContainText('Page 2 of 3');
  
  // Click page 3 button
  await page.locator('button:has-text("3")').click();
  await page.waitForTimeout(500);
  
  // Verify we're now on page 3
  await expect(page.locator('[data-testid="current-page"]')).toContainText('Page 3 of 3');
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  console.log(`⏱️ Quick pagination test duration: ${duration}ms`);
  
  // Should be much faster without scroll animations
  expect(duration).toBeLessThan(4000);
  
  console.log('✅ Pagination works smoothly without inappropriate animations!');
});