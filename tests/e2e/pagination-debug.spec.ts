import { test, expect } from '@playwright/test';

test('debug pagination issue', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  // Navigate to homepage
  await page.goto('http://localhost:7410');
  
  // Wait for the page to be fully loaded
  await expect(page.locator('.pagination-controls')).toBeVisible();
  
  // Check initial state
  const initialText = await page.locator('[data-testid="current-page"]').textContent();
  console.log('🔍 Initial pagination text:', initialText);
  
  // Check if pagination buttons exist
  const page2Button = page.locator('button:has-text("2")');
  const buttonExists = await page2Button.count();
  console.log('🔍 Page 2 button exists:', buttonExists > 0);
  
  if (buttonExists > 0) {
    console.log('🔄 Clicking page 2 button...');
    
    // Try clicking and see what happens
    await page2Button.click();
    
    // Wait a bit and check state
    await page.waitForTimeout(2000);
    
    const afterClickText = await page.locator('[data-testid="current-page"]').textContent();
    console.log('🔍 After click pagination text:', afterClickText);
    
    // Check if there are any network errors
    const itemCount = await page.locator('.item-card').count();
    console.log('🔍 Item count after click:', itemCount);
  }
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'test-results/pagination-debug.png' });
});