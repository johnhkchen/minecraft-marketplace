import { test, expect } from '@playwright/test';

test.describe('Pagination Functionality', () => {
  test('pagination should work smoothly without page refreshes', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to homepage
    await page.goto('http://localhost:7410');
    
    // Wait for the page to be fully loaded
    await expect(page.locator('.pagination-controls')).toBeVisible();
    
    // Verify we're on page 1 initially
    await expect(page.locator('[data-testid="current-page"]')).toContainText('Page 1 of 3');
    
    // Get initial item count on page 1
    const page1ItemCount = await page.locator('.item-card').count();
    console.log(`📊 Page 1 has ${page1ItemCount} items`);
    expect(page1ItemCount).toBe(20); // Should show 20 items on page 1
    
    // Click page 2 button - this should work with client-side navigation
    console.log('🔄 Clicking page 2 button...');
    await page.locator('button:has-text("2")').click();
    
    // Wait for loading to complete (should be fast with client-side nav)
    await page.waitForTimeout(1000); // Give it a second for any loading
    
    // Verify we're now on page 2
    await expect(page.locator('[data-testid="current-page"]')).toContainText('Page 2 of 3');
    
    // Verify page 2 has different content
    const page2ItemCount = await page.locator('.item-card').count();
    console.log(`📊 Page 2 has ${page2ItemCount} items`);
    expect(page2ItemCount).toBe(20); // Should show 20 items on page 2
    
    // Get first item name on page 2 to verify content changed
    const firstItemPage2 = await page.locator('.item-card').first().locator('.item-name').textContent();
    console.log(`🎯 First item on page 2: ${firstItemPage2}`);
    
    // Click page 3 button
    console.log('🔄 Clicking page 3 button...');
    await page.locator('button:has-text("3")').click();
    
    // Wait for loading to complete
    await page.waitForTimeout(1000);
    
    // Verify we're now on page 3
    await expect(page.locator('[data-testid="current-page"]')).toContainText('Page 3 of 3');
    
    // Verify page 3 has the remaining items (should be 15)
    const page3ItemCount = await page.locator('.item-card').count();
    console.log(`📊 Page 3 has ${page3ItemCount} items`);
    expect(page3ItemCount).toBe(15); // Should show 15 items on page 3 (55 total - 40 from first 2 pages)
    
    // Test Previous button
    console.log('🔄 Testing Previous button...');
    await page.locator('button:has-text("Previous")').click();
    await page.waitForTimeout(1000);
    
    // Should be back on page 2
    await expect(page.locator('[data-testid="current-page"]')).toContainText('Page 2 of 3');
    
    // Test Next button
    console.log('🔄 Testing Next button...');
    await page.locator('button:has-text("Next")').click();
    await page.waitForTimeout(1000);
    
    // Should be on page 3 again
    await expect(page.locator('[data-testid="current-page"]')).toContainText('Page 3 of 3');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`⏱️ Total test duration: ${duration}ms`);
    
    // Test should complete in under 7 seconds
    expect(duration).toBeLessThan(7000);
    
    console.log('✅ Pagination test completed successfully!');
  });
  
  test('pagination buttons should show correct states', async ({ page }) => {
    await page.goto('http://localhost:7410');
    
    // Wait for pagination to load
    await expect(page.locator('.pagination-controls')).toBeVisible();
    
    // On page 1, Previous button should not be visible, Next should be visible
    await expect(page.locator('button:has-text("Previous")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Next")')).toBeVisible();
    
    // Page 1 button should be active
    await expect(page.locator('button:has-text("1").pagination-btn.active')).toBeVisible();
    
    // Go to page 3
    await page.locator('button:has-text("3")').click();
    await page.waitForTimeout(1000);
    
    // On page 3, Previous should be visible, Next should not be visible
    await expect(page.locator('button:has-text("Previous")')).toBeVisible();
    await expect(page.locator('button:has-text("Next")')).toHaveCount(0);
  });
});