/**
 * Shop Dashboard E2E Tests - Complete Workflow Validation
 * Tests the full shop owner experience from login to inventory management
 * Focus on critical user journeys and business functionality
 */

import { test, expect, type Page } from '@playwright/test';

// Test data constants
const SHOP_OWNER = {
  name: 'Steve',
  shopName: 'Steve\'s Diamond Shop',
  discordId: 'discord_123456'
};

const SAMPLE_ITEMS = [
  {
    name: 'Diamond Sword',
    category: 'weapons',
    price: 64,
    tradingUnit: 'per_item',
    stock: 25,
    status: 'in_stock'
  },
  {
    name: 'Diamond Pickaxe',
    category: 'tools', 
    price: 48,
    tradingUnit: 'per_item',
    stock: 3,
    status: 'low_stock'
  },
  {
    name: 'Enchanted Books',
    category: 'enchantments',
    price: 128,
    tradingUnit: 'per_dozen',
    stock: 0,
    status: 'out_of_stock'
  }
];

test.describe('Shop Dashboard - Core Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Discord OAuth for shop owner authentication
    await page.route('**/discord/oauth/**', route => {
      route.fulfill({
        json: {
          access_token: 'mock_token',
          user: {
            id: SHOP_OWNER.discordId,
            username: SHOP_OWNER.name,
            discriminator: '0001'
          }
        }
      });
    });

    // Mock shop dashboard API calls
    await page.route('**/api/data/shops*', route => {
      route.fulfill({
        json: [{
          id: 1,
          owner_id: SHOP_OWNER.discordId,
          shop_name: SHOP_OWNER.shopName,
          is_active: true
        }]
      });
    });

    // Mock items API with sample data
    await page.route('**/api/data/items*', route => {
      route.fulfill({
        json: SAMPLE_ITEMS.map((item, index) => ({
          id: index + 1,
          owner_id: SHOP_OWNER.discordId,
          name: item.name,
          category: item.category,
          price_diamonds: item.price,
          trading_unit: item.tradingUnit,
          stock_quantity: item.stock,
          is_available: item.status !== 'out_of_stock',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      });
    });
  });

  test('Shop owner can access dashboard after Discord login', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Click Discord login button
    await page.click('[data-testid="discord-login-btn"]');
    
    // Should redirect to dashboard after successful auth
    await expect(page).toHaveURL('/dashboard');
    
    // Verify dashboard loads with shop owner greeting
    await expect(page.locator('[data-testid="shop-greeting"]')).toContainText(`Welcome back, ${SHOP_OWNER.name}`);
    await expect(page.locator('[data-testid="shop-name"]')).toContainText(SHOP_OWNER.shopName);
  });

  test('Dashboard shows comprehensive inventory overview', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await expect(page.locator('[data-testid="dashboard-overview"]')).toBeVisible();
    
    // Verify inventory metrics are displayed
    await expect(page.locator('[data-testid="total-items"]')).toContainText('3');
    await expect(page.locator('[data-testid="items-in-stock"]')).toContainText('1'); // Only Diamond Sword fully stocked
    await expect(page.locator('[data-testid="items-low-stock"]')).toContainText('1'); // Diamond Pickaxe
    await expect(page.locator('[data-testid="items-out-stock"]')).toContainText('1'); // Enchanted Books
    
    // Verify stock percentage calculation
    const stockPercentage = await page.locator('[data-testid="stock-percentage"]').textContent();
    expect(stockPercentage).toMatch(/33%|34%/); // 1/3 items fully stocked
    
    // Verify visual indicators are present  
    await expect(page.locator('[data-testid="green-indicator"]')).toBeVisible(); // In stock
    await expect(page.locator('[data-testid="yellow-indicator"]')).toBeVisible(); // Low stock
    await expect(page.locator('[data-testid="red-indicator"]')).toBeVisible(); // Out of stock
  });

  test('Item list displays comprehensive information and sorting', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for item list to load
    await expect(page.locator('[data-testid="item-list"]')).toBeVisible();
    
    // Verify all items are displayed with key information
    for (const item of SAMPLE_ITEMS) {
      const itemRow = page.locator(`[data-testid="item-${item.name.toLowerCase().replace(/\s+/g, '-')}"]`);
      
      await expect(itemRow).toBeVisible();
      await expect(itemRow.locator('[data-testid="item-name"]')).toContainText(item.name);
      await expect(itemRow.locator('[data-testid="item-price"]')).toContainText(`${item.price} 💎`);
      await expect(itemRow.locator('[data-testid="trading-unit"]')).toContainText(item.tradingUnit.replace('_', ' '));
      await expect(itemRow.locator('[data-testid="stock-quantity"]')).toContainText(item.stock.toString());
    }
    
    // Test sorting functionality
    await page.click('[data-testid="sort-by-price"]');
    
    // Wait for sort to complete
    await page.waitForTimeout(500);
    
    // Verify items are sorted by price (ascending: 48, 64, 128)
    const itemNames = await page.locator('[data-testid="item-name"]').allTextContents();
    expect(itemNames[0]).toBe('Diamond Pickaxe'); // 48 diamonds
    expect(itemNames[1]).toBe('Diamond Sword');   // 64 diamonds  
    expect(itemNames[2]).toBe('Enchanted Books'); // 128 diamonds
  });

  test('Quick actions are accessible and functional', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verify quick action buttons are present
    await expect(page.locator('[data-testid="add-item-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="update-prices-btn"]')).toBeVisible(); 
    await expect(page.locator('[data-testid="manage-inventory-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-reports-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="shop-settings-btn"]')).toBeVisible();
    
    // Test add new item button
    await page.click('[data-testid="add-item-btn"]');
    
    // Should open item creation modal or navigate to form
    await expect(page.locator('[data-testid="item-creation-form"]')).toBeVisible();
    
    // Verify form has required fields
    await expect(page.locator('[data-testid="item-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="item-price-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="trading-unit-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="stock-quantity-input"]')).toBeVisible();
  });

  test('Inline editing allows quick price and stock updates', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for item list
    await expect(page.locator('[data-testid="item-list"]')).toBeVisible();
    
    const diamondSwordRow = page.locator('[data-testid="item-diamond-sword"]');
    
    // Test inline price editing
    await diamondSwordRow.locator('[data-testid="item-price"]').click();
    
    // Should show price input field
    const priceInput = diamondSwordRow.locator('[data-testid="price-edit-input"]');
    await expect(priceInput).toBeVisible();
    await expect(priceInput).toHaveValue('64');
    
    // Update price
    await priceInput.fill('72');
    await priceInput.press('Enter');
    
    // Verify price updated (mock API call would be triggered)
    await expect(diamondSwordRow.locator('[data-testid="item-price"]')).toContainText('72 💎');
    
    // Test stock quantity editing
    await diamondSwordRow.locator('[data-testid="stock-quantity"]').click();
    
    const stockInput = diamondSwordRow.locator('[data-testid="stock-edit-input"]');
    await expect(stockInput).toBeVisible();
    await expect(stockInput).toHaveValue('25');
    
    // Update stock
    await stockInput.fill('30');
    await stockInput.press('Enter');
    
    // Verify stock updated
    await expect(diamondSwordRow.locator('[data-testid="stock-quantity"]')).toContainText('30');
  });

  test('Bulk operations work with item selection', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for item list
    await expect(page.locator('[data-testid="item-list"]')).toBeVisible();
    
    // Select multiple items using checkboxes
    await page.check('[data-testid="select-diamond-sword"]');
    await page.check('[data-testid="select-diamond-pickaxe"]');
    
    // Verify bulk actions become enabled
    await expect(page.locator('[data-testid="bulk-actions-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="selected-count"]')).toContainText('2 items selected');
    
    // Test bulk price adjustment
    await page.click('[data-testid="bulk-price-adjust-btn"]');
    
    // Should show bulk price adjustment modal
    await expect(page.locator('[data-testid="bulk-price-modal"]')).toBeVisible();
    
    // Select percentage increase
    await page.selectOption('[data-testid="adjustment-type"]', 'percentage_increase');
    await page.fill('[data-testid="adjustment-value"]', '10');
    
    // Apply bulk adjustment
    await page.click('[data-testid="apply-bulk-changes"]');
    
    // Verify confirmation dialog
    await expect(page.locator('[data-testid="bulk-confirmation"]')).toContainText('Update prices for 2 items?');
    
    await page.click('[data-testid="confirm-bulk-update"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Bulk price update completed');
  });

  test('Mobile dashboard provides optimized experience', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/dashboard');
    
    // Verify mobile-optimized layout
    await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
    
    // Check collapsible sections work
    await expect(page.locator('[data-testid="overview-section"]')).toBeVisible();
    
    // Collapse overview to save space
    await page.click('[data-testid="collapse-overview"]');
    await expect(page.locator('[data-testid="overview-details"]')).toBeHidden();
    
    // Verify touch-friendly button sizes
    const addButton = page.locator('[data-testid="add-item-btn"]');
    const buttonBox = await addButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThan(44); // iOS recommended minimum
    
    // Test swipe gestures on item list (if implemented)
    const firstItem = page.locator('[data-testid="item-diamond-sword"]');
    
    // Swipe left to reveal quick actions
    await firstItem.hover();
    await page.mouse.down();
    await page.mouse.move(200, 0); // Swipe right
    await page.mouse.up();
    
    // Should show swipe actions
    await expect(page.locator('[data-testid="swipe-actions"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-edit-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-delete-btn"]')).toBeVisible();
  });

  test('Notifications and alerts display correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verify notification count badge
    await expect(page.locator('[data-testid="notification-count"]')).toContainText('2'); // Low stock + out of stock
    
    // Click notifications to view details
    await page.click('[data-testid="notifications-btn"]');
    
    // Should show notification panel
    await expect(page.locator('[data-testid="notifications-panel"]')).toBeVisible();
    
    // Verify specific alerts
    await expect(page.locator('[data-testid="low-stock-alert"]')).toContainText('Diamond Pickaxe is running low (3 remaining)');
    await expect(page.locator('[data-testid="out-stock-alert"]')).toContainText('Enchanted Books is out of stock');
    
    // Test marking notification as read
    await page.click('[data-testid="mark-read-low-stock"]');
    
    // Notification should be marked as read (visual change)
    await expect(page.locator('[data-testid="low-stock-alert"]')).toHaveClass(/read/);
    
    // Notification count should decrease
    await expect(page.locator('[data-testid="notification-count"]')).toContainText('1');
  });

  test('Search and filtering work across item list', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for item list
    await expect(page.locator('[data-testid="item-list"]')).toBeVisible();
    
    // Test search functionality
    await page.fill('[data-testid="item-search"]', 'diamond');
    
    // Should show only diamond items
    await expect(page.locator('[data-testid="item-diamond-sword"]')).toBeVisible();
    await expect(page.locator('[data-testid="item-diamond-pickaxe"]')).toBeVisible();
    await expect(page.locator('[data-testid="item-enchanted-books"]')).toBeHidden();
    
    // Clear search
    await page.fill('[data-testid="item-search"]', '');
    
    // Test category filtering
    await page.selectOption('[data-testid="category-filter"]', 'weapons');
    
    // Should show only weapons
    await expect(page.locator('[data-testid="item-diamond-sword"]')).toBeVisible();
    await expect(page.locator('[data-testid="item-diamond-pickaxe"]')).toBeHidden();
    await expect(page.locator('[data-testid="item-enchanted-books"]')).toBeHidden();
    
    // Test stock status filtering  
    await page.selectOption('[data-testid="category-filter"]', 'all'); // Reset category
    await page.selectOption('[data-testid="stock-filter"]', 'low_stock');
    
    // Should show only low stock items
    await expect(page.locator('[data-testid="item-diamond-sword"]')).toBeHidden();
    await expect(page.locator('[data-testid="item-diamond-pickaxe"]')).toBeVisible();
    await expect(page.locator('[data-testid="item-enchanted-books"]')).toBeHidden();
  });

  test('Dashboard integrates with marketplace view', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on "View in Marketplace" for an item
    const diamondSwordRow = page.locator('[data-testid="item-diamond-sword"]');
    await diamondSwordRow.locator('[data-testid="view-in-marketplace"]').click();
    
    // Should navigate to marketplace view with item highlighted
    await expect(page).toHaveURL(/\/marketplace/);
    await expect(page.locator('[data-testid="highlighted-item"]')).toContainText('Diamond Sword');
    
    // Return to dashboard
    await page.click('[data-testid="back-to-dashboard"]');
    await expect(page).toHaveURL('/dashboard');
    
    // Test marketplace integration from dashboard
    await page.click('[data-testid="view-shop-in-marketplace"]');
    
    // Should show shop's public marketplace page
    await expect(page).toHaveURL(/\/marketplace\/shops\//);
    await expect(page.locator('[data-testid="shop-title"]')).toContainText(SHOP_OWNER.shopName);
  });

  test('Performance requirements are met', async ({ page }) => {
    // Track page load performance
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    
    // Wait for dashboard to be fully loaded
    await expect(page.locator('[data-testid="dashboard-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="item-list"]')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Dashboard should load in under 2 seconds (Epic 1 requirement)
    expect(loadTime).toBeLessThan(2000);
    
    // Test search performance
    const searchStartTime = Date.now();
    
    await page.fill('[data-testid="item-search"]', 'diamond');
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    const searchTime = Date.now() - searchStartTime;
    
    // Search should complete in under 500ms (filtering requirement)
    expect(searchTime).toBeLessThan(500);
    
    // Test API response times by monitoring network
    const apiResponses: number[] = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/data/')) {
        const timing = response.timing();
        if (timing.responseEnd) {
          apiResponses.push(timing.responseEnd);
        }
      }
    });
    
    // Trigger some API calls
    await page.click('[data-testid="refresh-data"]');
    await page.waitForTimeout(1000);
    
    // API calls should be under 200ms (95th percentile requirement)
    apiResponses.forEach(responseTime => {
      expect(responseTime).toBeLessThan(200);
    });
  });
});

test.describe('Shop Dashboard - Error Handling', () => {
  test('Handles API failures gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/data/items*', route => {
      route.fulfill({
        status: 500,
        body: 'Internal Server Error'
      });
    });
    
    await page.goto('/dashboard');
    
    // Should show error state instead of crashing
    await expect(page.locator('[data-testid="error-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Unable to load items');
    
    // Should provide retry option
    await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible();
    
    // Test retry functionality
    await page.route('**/api/data/items*', route => {
      route.fulfill({
        json: SAMPLE_ITEMS
      });
    });
    
    await page.click('[data-testid="retry-btn"]');
    
    // Should recover and show data
    await expect(page.locator('[data-testid="item-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-state"]')).toBeHidden();
  });

  test('Handles network connectivity issues', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Simulate network going offline
    await page.context().setOffline(true);
    
    // Try to perform an action that requires network
    await page.click('[data-testid="refresh-data"]');
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-message"]')).toContainText('You are currently offline');
    
    // Should disable network-dependent actions
    await expect(page.locator('[data-testid="sync-btn"]')).toBeDisabled();
    
    // Restore network
    await page.context().setOffline(false);
    
    // Should automatically detect reconnection
    await expect(page.locator('[data-testid="online-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-btn"]')).toBeEnabled();
  });
});

test.describe('Shop Dashboard - Accessibility', () => {
  test('Supports keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Tab through dashboard elements
    await page.keyboard.press('Tab'); // Should focus first interactive element
    
    // Verify focus is visible
    await expect(page.locator(':focus')).toBeVisible();
    
    // Continue tabbing through major elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
    }
    
    // Test keyboard shortcuts
    await page.keyboard.press('Control+KeyN'); // Should trigger "Add New Item"
    await expect(page.locator('[data-testid="item-creation-form"]')).toBeVisible();
    
    await page.keyboard.press('Escape'); // Should close modal
    await expect(page.locator('[data-testid="item-creation-form"]')).toBeHidden();
  });

  test('Provides appropriate ARIA labels and screen reader support', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for proper ARIA labels on key elements
    await expect(page.locator('[data-testid="dashboard-overview"]')).toHaveAttribute('aria-label', /dashboard overview/i);
    await expect(page.locator('[data-testid="item-list"]')).toHaveAttribute('role', 'table');
    await expect(page.locator('[data-testid="notification-count"]')).toHaveAttribute('aria-live', 'polite');
    
    // Check for proper heading structure
    await expect(page.locator('h1')).toContainText('Shop Dashboard');
    await expect(page.locator('h2')).toHaveCount(3); // Should have proper heading hierarchy
    
    // Verify form labels
    await page.click('[data-testid="add-item-btn"]');
    await expect(page.locator('[data-testid="item-creation-form"] label[for="item-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="item-creation-form"] label[for="item-price"]')).toBeVisible();
  });
});