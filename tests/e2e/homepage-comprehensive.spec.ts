/**
 * Comprehensive Homepage Testing with Layered Checks
 * 
 * PURPOSE: Multi-layered validation to catch homepage data issues at different levels
 * APPROACH: Progressive validation from basic to detailed, with clear error messages
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage Comprehensive Data Validation', () => {
  
  // Set shorter timeout for individual tests to prevent hanging
  test.setTimeout(10000); // 10 seconds max per test
  
  test.describe('Layer 1: Basic Page Functionality', () => {
    test('should load homepage successfully with core elements', async ({ page }) => {
      // Add error handling to prevent hanging
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
      
      // Basic page structure with explicit timeouts
      await expect(page.locator('h1')).toContainText('Minecraft Item Marketplace', { timeout: 5000 });
      await expect(page.locator('.marketplace-header')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('.quick-actions')).toBeVisible({ timeout: 5000 });
      
      // Essential buttons exist
      await expect(page.locator('button:has-text("Browse Items")')).toBeVisible();
      await expect(page.locator('button:has-text("Sell Items")')).toBeVisible();
    });

    test('should display market statistics section', async ({ page }) => {
      await page.goto('/');
      
      const marketStats = page.locator('.market-status');
      await expect(marketStats).toBeVisible();
      
      const statsText = await marketStats.textContent();
      console.log('📊 Market Statistics:', statsText);
      
      // Should show format: "X items for sale from Y shops"
      expect(statsText).toMatch(/\d+.*items.*for.*sale.*from.*\d+.*shops/);
    });
  });

  test.describe('Layer 2: Data Source Detection', () => {
    test('should detect data source type (real vs synthetic)', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
      
      // Wait for dynamic content to load with timeout
      try {
        await page.waitForSelector('.item-name');
      } catch (error) {
        console.log('⚠️ Items not loaded within timeout, proceeding with available content');
      }
      
      // Get all item names currently displayed
      const itemElements = page.locator('.item-name');
      const itemCount = await itemElements.count();
      const itemNames: string[] = [];
      
      for (let i = 0; i < itemCount; i++) {
        const name = await itemElements.nth(i).textContent();
        if (name) itemNames.push(name.trim());
      }
      
      console.log('🏷️ All displayed items:', itemNames);
      
      // Categorize items - Updated for current Safe Survival marketplace
      const syntheticItems = ['Test Item', 'Synthetic Sword', 'Fake Elytra']; // Items that shouldn't appear in real data
      const realItems = ['Iron Blocks', 'Obsidian', 'Gilded Blackstone', 'Golden Apple', 'Wool', 'Crying Obsidian', 
                        'Normal Elytra', 'Enchanted Elytra', 'Regular Elytra', 'Epic Blade', 'Unbreakable Diamond Sword',
                        'Unbreakable Netherite Pickaxe', 'Champions Full Helm', 'Mythical Cape', 'Sorcerers Stone',
                        'Totem of Undying', 'Amethyst Shards', 'Dark Oak Logs', 'Soul Speed III Book'];
      
      const syntheticFound = itemNames.filter(name => syntheticItems.includes(name));
      const realFound = itemNames.filter(name => realItems.includes(name));
      
      console.log('🧪 Synthetic items found:', syntheticFound);
      console.log('💎 Real items found:', realFound);
      
      // Progressive validation
      if (syntheticFound.length === itemNames.length) {
        throw new Error(`❌ USING 100% SYNTHETIC DATA: All items are synthetic: ${syntheticFound.join(', ')}`);
      }
      
      if (syntheticFound.length > realFound.length) {
        console.warn(`⚠️ MORE SYNTHETIC THAN REAL: ${syntheticFound.length} synthetic vs ${realFound.length} real`);
      }
      
      if (realFound.length === 0) {
        throw new Error(`❌ NO REAL DATA: No real marketplace items found. Displaying: ${itemNames.join(', ')}`);
      }
      
      // Success criteria
      expect(realFound.length).toBeGreaterThan(0);
      console.log('✅ Real marketplace data detected');
    });

    test('should validate market statistics reflect real data scale', async ({ page }) => {
      await page.goto('/');
      
      const marketStats = page.locator('.market-status');
      const statsText = await marketStats.textContent() || '';
      
      // Extract numbers
      const itemsMatch = statsText.match(/(\d+).*items/);
      const shopsMatch = statsText.match(/from\s+(\d+).*shops/);
      
      const itemCount = itemsMatch ? parseInt(itemsMatch[1]) : 0;
      const shopCount = shopsMatch ? parseInt(shopsMatch[1]) : 0;
      
      console.log(`📈 Market Scale: ${itemCount} items, ${shopCount} shops`);
      
      // Real marketplace should have significant scale
      if (itemCount < 10) {
        throw new Error(`❌ TOO FEW ITEMS: ${itemCount} items suggests using test/fallback data`);
      }
      
      if (shopCount < 3) {
        throw new Error(`❌ TOO FEW SHOPS: ${shopCount} shops suggests limited/test data`);
      }
      
      expect(itemCount).toBeGreaterThanOrEqual(15);
      expect(shopCount).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe('Layer 3: Functional Behavior Validation', () => {
    test('should display items in correct price order (highest first)', async ({ page }) => {
      await page.goto('/');
      
      // Get price displays
      const priceElements = page.locator('.price-display');
      const priceCount = await priceElements.count();
      
      if (priceCount < 2) {
        throw new Error('❌ INSUFFICIENT ITEMS: Need at least 2 items to validate price ordering');
      }
      
      const prices: Array<{ value: number, text: string, index: number }> = [];
      
      for (let i = 0; i < priceCount; i++) {
        const priceText = await priceElements.nth(i).textContent() || '';
        const priceMatch = priceText.match(/(\d+(?:\.\d+)?)/);
        
        if (priceMatch) {
          prices.push({
            value: parseFloat(priceMatch[1]),
            text: priceText,
            index: i
          });
        }
      }
      
      console.log('💰 Price Analysis:', prices.map(p => `${p.value} (${p.text})`));
      
      // Validate descending order
      for (let i = 1; i < prices.length; i++) {
        if (prices[i].value > prices[i-1].value) {
          throw new Error(`❌ PRICE ORDER VIOLATION: Item ${i} (${prices[i].value}) > Item ${i-1} (${prices[i-1].value})`);
        }
      }
      
      console.log('✅ Price ordering correct (highest to lowest)');
    });

    test('should show pagination functionality when available', async ({ page }) => {
      await page.goto('/');
      
      // Look for pagination section
      const paginationSection = page.locator('text=All Marketplace Items');
      const hasPagination = await paginationSection.count() > 0;
      
      if (hasPagination) {
        console.log('📄 Pagination section found');
        
        // Check pagination controls
        const paginationInfo = page.locator('.pagination-info');
        await expect(paginationInfo).toBeVisible();
        
        const paginationText = await paginationInfo.textContent();
        console.log('📊 Pagination info:', paginationText);
        
        // Should show current page and total
        expect(paginationText).toMatch(/Page\s+\d+\s+of\s+\d+/);
        
        // Check item grid
        const itemCards = page.locator('.item-card');
        const cardCount = await itemCards.count();
        
        console.log(`📦 Item cards displayed: ${cardCount}`);
        
        if (cardCount > 0) {
          // Validate item card structure
          const firstCard = itemCards.first();
          await expect(firstCard.locator('.item-name')).toBeVisible();
          await expect(firstCard.locator('.price-display')).toBeVisible();
          await expect(firstCard.locator('.shop-name')).toBeVisible();
          
          console.log('✅ Pagination functionality working');
        }
      } else {
        console.log('ℹ️ No pagination section - using basic featured items only');
        
        // Should still have featured items
        const featuredItems = page.locator('.market-item');
        const featuredCount = await featuredItems.count();
        
        expect(featuredCount).toBeGreaterThan(0);
        console.log(`📋 Featured items: ${featuredCount}`);
      }
    });
  });

  test.describe('Layer 4: Data Quality and Consistency', () => {
    test('should have consistent data across all displayed items', async ({ page }) => {
      await page.goto('/');
      
      // Collect all item data
      const allItems: Array<{
        name: string;
        category: string;
        price: string;
        shop: string;
        stock: string;
      }> = [];
      
      // Get featured items
      const featuredItems = page.locator('.market-item');
      const featuredCount = await featuredItems.count();
      
      for (let i = 0; i < featuredCount; i++) {
        const item = featuredItems.nth(i);
        const name = await item.locator('.item-name').textContent() || '';
        const category = await item.locator('.category-badge').textContent() || '';
        const price = await item.locator('.price-display').textContent() || '';
        const shop = await item.locator('.shop-name').textContent() || '';
        const stock = await item.locator('.stock-info').textContent() || '';
        
        allItems.push({ name, category, price, shop, stock });
      }
      
      // Get paginated items if available
      const itemCards = page.locator('.item-card');
      const cardCount = await itemCards.count();
      
      for (let i = 0; i < cardCount; i++) {
        const card = itemCards.nth(i);
        const name = await card.locator('.item-name').textContent() || '';
        const category = await card.locator('.category-badge').textContent() || '';
        const price = await card.locator('.price-display').textContent() || '';
        const shop = await card.locator('.shop-name').textContent() || '';
        const stock = await card.locator('.stock-info').textContent() || '';
        
        allItems.push({ name, category, price, shop, stock });
      }
      
      console.log(`🔍 Total items analyzed: ${allItems.length}`);
      
      // Validate data consistency
      let invalidItems = 0;
      const issues: string[] = [];
      
      for (const item of allItems) {
        if (!item.name.trim()) {
          issues.push(`Missing name: ${JSON.stringify(item)}`);
          invalidItems++;
        }
        if (!item.category.trim()) {
          issues.push(`Missing category for ${item.name}`);
          invalidItems++;
        }
        if (!item.price.trim() || !item.price.match(/\d/)) {
          issues.push(`Invalid price for ${item.name}: "${item.price}"`);
          invalidItems++;
        }
        if (!item.shop.trim()) {
          issues.push(`Missing shop for ${item.name}`);
          invalidItems++;
        }
      }
      
      if (issues.length > 0) {
        console.error('❌ Data Quality Issues:', issues);
        throw new Error(`Data quality issues found: ${issues.slice(0, 3).join('; ')}${issues.length > 3 ? '...' : ''}`);
      }
      
      console.log('✅ All items have consistent, valid data');
      
      // Check for data diversity (not all items from same shop)
      const uniqueShops = new Set(allItems.map(item => item.shop));
      const uniqueCategories = new Set(allItems.map(item => item.category));
      
      console.log(`🏪 Unique shops: ${uniqueShops.size}`);
      console.log(`📂 Unique categories: ${uniqueCategories.size}`);
      
      if (uniqueShops.size < 2) {
        console.warn('⚠️ Limited shop diversity - might be using test data');
      }
      
      expect(uniqueShops.size).toBeGreaterThanOrEqual(2);
      expect(uniqueCategories.size).toBeGreaterThanOrEqual(2);
    });

    test('should validate realistic minecraft economy pricing', async ({ page }) => {
      await page.goto('/');
      
      const priceElements = page.locator('.price-display');
      const priceCount = await priceElements.count();
      
      const priceData: Array<{ item: string, price: number, unit: string }> = [];
      
      // Collect price data with context
      for (let i = 0; i < priceCount; i++) {
        const priceText = await priceElements.nth(i).textContent() || '';
        const itemName = await page.locator('.item-name').nth(i).textContent() || '';
        
        const priceMatch = priceText.match(/(\d+(?:\.\d+)?)/);
        const unitMatch = priceText.match(/(per_item|per_stack|per_shulker|per_dozen)/);
        
        if (priceMatch) {
          priceData.push({
            item: itemName,
            price: parseFloat(priceMatch[1]),
            unit: unitMatch ? unitMatch[1] : 'unknown'
          });
        }
      }
      
      console.log('💎 Minecraft Economy Analysis:', priceData);
      
      // Validate realistic price ranges
      const unrealisticPrices = priceData.filter(item => {
        // Extremely high prices might indicate synthetic data
        if (item.price > 300) return true;
        // Zero prices are invalid
        if (item.price <= 0) return true;
        return false;
      });
      
      if (unrealisticPrices.length > 0) {
        console.warn('💸 Potentially unrealistic prices:', unrealisticPrices);
        
        // If all prices are unrealistic, likely using synthetic data
        if (unrealisticPrices.length === priceData.length) {
          throw new Error('❌ ALL PRICES UNREALISTIC: Likely using synthetic test data');
        }
      }
      
      // Check for reasonable price distribution
      const priceValues = priceData.map(item => item.price);
      const minPrice = Math.min(...priceValues);
      const maxPrice = Math.max(...priceValues);
      
      console.log(`📊 Price range: ${minPrice} - ${maxPrice} diamonds`);
      
      // Should have reasonable price spread (not all identical)
      if (maxPrice === minPrice && priceData.length > 1) {
        throw new Error('❌ NO PRICE VARIATION: All items have identical prices');
      }
      
      expect(priceValues.length).toBeGreaterThan(0);
      expect(minPrice).toBeGreaterThan(0);
      console.log('✅ Realistic minecraft economy pricing detected');
    });
  });

  test.describe('Layer 5: Performance and UX Validation', () => {
    test('should load homepage content within performance budget', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      
      // Wait for essential content to be visible
      await expect(page.locator('.market-items')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      console.log(`⏱️ Homepage load time: ${loadTime}ms`);
      
      // Should load within reasonable time
      expect(loadTime).toBeLessThan(5000); // 5 second budget
      
      if (loadTime > 2000) {
        console.warn(`⚠️ SLOW LOAD: ${loadTime}ms exceeds 2s target`);
      }
    });

    test('should have accessible and usable interface elements', async ({ page }) => {
      await page.goto('/');
      
      // Check accessibility basics
      const mainHeading = page.locator('h1');
      await expect(mainHeading).toBeVisible();
      
      // Interactive elements should be keyboard accessible
      const browseButton = page.locator('button:has-text("Browse Items")');
      await expect(browseButton).toBeVisible();
      
      // Should be focusable
      await browseButton.focus();
      const isFocused = await browseButton.evaluate(el => document.activeElement === el);
      expect(isFocused).toBe(true);
      
      // Check contrast and readability (basic)
      const itemNames = page.locator('.item-name');
      const firstItemName = itemNames.first();
      
      if (await firstItemName.count() > 0) {
        const color = await firstItemName.evaluate(el => 
          window.getComputedStyle(el).color
        );
        
        console.log('🎨 Item name color:', color);
        
        // Should not be transparent or invisible
        expect(color).not.toBe('rgba(0, 0, 0, 0)');
        expect(color).not.toBe('transparent');
      }
      
      console.log('✅ Basic accessibility checks passed');
    });
  });
});