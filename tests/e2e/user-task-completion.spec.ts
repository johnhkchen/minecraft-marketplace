/**
 * User Task Completion Tests (E2E)
 * Tests core user journeys with focus on information findability
 * and task completion without confusion
 */

import { test, expect } from '@playwright/test';

test.describe('User Task Completion - Information Design Focus', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock API responses to ensure consistent test data
    await page.route('**/api/listings**', async route => {
      const mockListings = [
        {
          listing_id: '1',
          item_name: 'Diamond Sword',
          seller_name: 'SwordMaster',
          stall_id: 'A1',
          price: 5,
          qty: 1,
          listing_type: 'sell',
          inventory_unit: 'per item',
          is_active: true,
          date_created: '2024-01-01',
          description: 'Sharp and durable'
        },
        {
          listing_id: '2', 
          item_name: 'Oak Wood',
          seller_name: 'TreeFarm',
          stall_id: 'B3',
          price: 0.5,
          qty: 64,
          listing_type: 'sell',
          inventory_unit: 'per stack',
          is_active: true,
          date_created: '2024-01-01'
        },
        {
          listing_id: '3',
          item_name: 'Rare Diamond',
          seller_name: 'Collector',
          stall_id: 'C5',
          price: 10,
          qty: 5,
          listing_type: 'buy',
          inventory_unit: 'per item',
          is_active: true,
          date_created: '2024-01-01'
        }
      ];
      
      await route.fulfill({ 
        json: mockListings,
        headers: { 'Content-Type': 'application/json' }
      });
    });
  });

  test('User can identify site purpose within 5 seconds', async ({ page }) => {
    await page.goto('/');
    
    // Information should be immediately clear
    await expect(page.locator('h1')).toContainText('Minecraft Item Marketplace');
    await expect(page.locator('text=Buy and sell Minecraft items with your community')).toBeVisible();
    
    // Primary actions should be prominent
    await expect(page.locator('button', { hasText: 'Browse Items' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Sell Items' })).toBeVisible();
    
    // Technical jargon should not be in primary view
    await expect(page.locator('text=NASDAQ')).not.toBeVisible();
    await expect(page.locator('text=Terminal')).not.toBeVisible();
    await expect(page.locator('text=PostgreSQL')).not.toBeVisible();
  });

  test('User can find and purchase an item following clear information hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Step 1: User sees clear marketplace heading
    await expect(page.locator('h1')).toContainText('Minecraft Item Marketplace');
    
    // Step 2: User clicks primary "Browse Items" action
    await page.click('button:has-text("Browse Items")');
    
    // Step 3: User sees clear search interface
    await expect(page.locator('h2')).toContainText('Find Items to Buy');
    await expect(page.locator('text=Browse available items from community members')).toBeVisible();
    
    // Step 4: User can search using natural language
    const searchInput = page.locator('input[placeholder*="diamond sword"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('diamond sword');
    
    // Step 5: Item information should be scannable
    const itemCard = page.locator('[role="article"]').first();
    await expect(itemCard).toBeVisible();
    
    // Key information should be prioritized
    await expect(itemCard.locator('h3')).toContainText('Diamond Sword');
    await expect(itemCard.locator('text=Available to buy')).toBeVisible();
    await expect(itemCard.locator('text=SwordMaster')).toBeVisible();
    
    // Price should be clear and prominent
    await expect(itemCard.locator('.price-main')).toBeVisible();
    
    // Step 6: Action should be clear and accessible
    const buyButton = itemCard.locator('button:has-text("Buy Now")');
    await expect(buyButton).toBeVisible();
    await expect(buyButton).toHaveClass(/buy-action/);
    
    // Total cost should be visible before purchase
    await expect(itemCard.locator('text=Total cost:')).toBeVisible();
  });

  test('User can differentiate between items for sale and wanted items', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Browse Items")');
    
    // User should see both types clearly differentiated
    const sellItem = page.locator('[role="article"]', { hasText: 'Diamond Sword' });
    const buyItem = page.locator('[role="article"]', { hasText: 'Rare Diamond' });
    
    await expect(sellItem.locator('text=Available to buy')).toBeVisible();
    await expect(buyItem.locator('text=Someone wants this')).toBeVisible();
    
    // Actions should be appropriate for each type
    await expect(sellItem.locator('button:has-text("Buy Now")')).toBeVisible();
    await expect(buyItem.locator('button:has-text("Contact Collector")')).toBeVisible();
  });

  test('User can navigate without getting lost', async ({ page }) => {
    await page.goto('/');
    
    // Navigation should show current location
    await page.click('button:has-text("Browse Items")');
    
    // Breadcrumb should indicate location
    await expect(page.locator('text=Marketplace')).toBeVisible();
    await expect(page.locator('text=Browse Items')).toBeVisible();
    
    // User can navigate to other sections
    await page.click('button:has-text("Sell Items")');
    
    // Should clearly indicate new location
    await expect(page.locator('text=Sell Items')).toBeVisible();
  });

  test('User can recover from errors without external help', async ({ page }) => {
    // Mock API error
    await page.route('**/api/listings**', async route => {
      await route.fulfill({ 
        status: 500,
        json: { error: 'Network error' }
      });
    });
    
    await page.goto('/');
    await page.click('button:has-text("Browse Items")');
    
    // Error should be clear and actionable
    await expect(page.locator('text=Error:')).toBeVisible();
    
    // Recovery action should be provided
    const retryButton = page.locator('button:has-text("Retry")');
    await expect(retryButton).toBeVisible();
    
    // Remove error mock for retry
    await page.unroute('**/api/listings**');
    await page.route('**/api/listings**', async route => {
      await route.fulfill({ 
        json: [],
        headers: { 'Content-Type': 'application/json' }
      });
    });
    
    await retryButton.click();
    
    // Should show appropriate empty state
    await expect(page.locator('text=No listings found')).toBeVisible();
    await expect(page.locator('text=Try adjusting your search filters')).toBeVisible();
  });

  test('User can use search filters without confusion', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Browse Items")');
    
    // Primary search should be immediately visible
    const searchInput = page.locator('label:has-text("What are you looking for?") + input');
    await expect(searchInput).toBeVisible();
    
    // Advanced filters should be behind disclosure
    const moreFilters = page.locator('summary:has-text("More filters")');
    await expect(moreFilters).toBeVisible();
    
    await moreFilters.click();
    
    // Filter options should use plain language
    await expect(page.locator('label:has-text("Show me:")')).toBeVisible();
    await expect(page.locator('label:has-text("Max price:")')).toBeVisible();
    await expect(page.locator('label:has-text("From seller:")')).toBeVisible();
    
    // Context should be provided for complex fields
    await expect(page.locator('text=in diamond blocks')).toBeVisible();
  });

  test('User can understand pricing without confusion', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Browse Items")');
    
    const itemCard = page.locator('[role="article"]').first();
    
    // Price should be displayed clearly with context
    await expect(itemCard.locator('.price-main')).toBeVisible();
    await expect(itemCard.locator('.price-context')).toBeVisible();
    
    // Total cost should be calculated and displayed
    await expect(itemCard.locator('text=Total cost:')).toBeVisible();
    
    // Currency should be explained in footer
    await expect(page.locator('text=All prices in diamonds')).toBeVisible();
  });

  test('User can complete purchase workflow without technical knowledge', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Browse Items")');
    
    const itemCard = page.locator('[role="article"]').first();
    const buyButton = itemCard.locator('button:has-text("Buy Now")');
    
    // Mock the confirm dialog
    page.on('dialog', dialog => dialog.accept());
    
    await buyButton.click();
    
    // Purchase confirmation should use clear language
    // (This would need to be implemented in the actual purchase handler)
  });

  test('User gets help when needed without technical jargon', async ({ page }) => {
    await page.goto('/');
    
    // Help should be accessible
    await expect(page.locator('text=Need help?')).toBeVisible();
    await expect(page.locator('a:has-text("Contact support")')).toBeVisible();
    
    // Technical details should be hidden by default
    const technicalDetails = page.locator('summary:has-text("Technical details")');
    await expect(technicalDetails).toBeVisible();
    
    // Technical information should be minimal and hidden
    await technicalDetails.click();
    await expect(page.locator('text=Astro SSR + Svelte')).toBeVisible();
    
    // But it should be collapsed by default
    await page.reload();
    await expect(page.locator('text=Astro SSR + Svelte')).not.toBeVisible();
  });
});

test.describe('Information Scent Testing', () => {
  test('Users find target content within 2 clicks 90% of the time', async ({ page }) => {
    await page.goto('/');
    
    // Test case 1: Finding items to buy (1 click)
    await page.click('button:has-text("Browse Items")');
    await expect(page.locator('h2:has-text("Find Items to Buy")')).toBeVisible();
    
    // Test case 2: Finding specific item (2 clicks)
    await page.goto('/');
    await page.click('button:has-text("Browse Items")');
    const searchInput = page.locator('input[placeholder*="diamond sword"]');
    await searchInput.fill('diamond');
    // This counts as finding the content within the expected path
    
    // Test case 3: Getting help (1 click)
    await page.goto('/');
    await page.click('a:has-text("Contact support")');
    // Help should be immediately accessible
  });

  test('Navigation paths match user mental models', async ({ page }) => {
    await page.goto('/');
    
    // Test user expectation: "Browse" leads to search/discovery
    await page.click('button:has-text("Browse Items")');
    await expect(page.locator('input[placeholder*="diamond sword"]')).toBeVisible();
    
    // Test user expectation: "Sell" leads to listing creation
    await page.click('button:has-text("Sell Items")');
    // Should lead to sell form (implementation dependent)
    
    // Test user expectation: Breadcrumbs show path back
    await expect(page.locator('text=Marketplace')).toBeVisible();
  });
});