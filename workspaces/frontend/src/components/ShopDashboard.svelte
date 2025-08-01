<!--
  Shop Dashboard Component
  Comprehensive shop owner interface integrating with our TDD-built state management
  Focus on usability, performance, and mobile optimization
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { shopDashboardState, shopDashboardActions, dashboardOverview, quickActions, notifications, mobileOptimization } from '../lib/shop-dashboard-state.js';
  
  // Props
  export let shopOwner: { id: string; name: string; shopName: string } | null = null;
  
  // Reactive state subscriptions
  $: state = $shopDashboardState;
  $: overview = $dashboardOverview;
  $: actions = $quickActions;
  $: notifs = $notifications;
  $: mobile = $mobileOptimization;
  
  // Local component state
  let showItemForm = false;
  let showBulkModal = false;
  let showNotifications = false;
  let searchQuery = '';
  let selectedCategory = 'all';
  let selectedStockFilter = 'all';
  let sortBy = 'name';
  let editingItem: string | null = null;
  let editingField: string | null = null;
  
  // Sample items for demo (would come from API in real implementation)
  let items = [
    {
      id: 1,
      name: 'Diamond Sword',
      category: 'weapons',
      price: 64,
      tradingUnit: 'per_item',
      stock: 25,
      status: 'in_stock',
      lastUpdated: new Date()
    },
    {
      id: 2,
      name: 'Diamond Pickaxe', 
      category: 'tools',
      price: 48,
      tradingUnit: 'per_item',
      stock: 3,
      status: 'low_stock',
      lastUpdated: new Date()
    },
    {
      id: 3,
      name: 'Enchanted Books',
      category: 'enchantments',
      price: 128,
      tradingUnit: 'per_dozen',
      stock: 0,
      status: 'out_of_stock',
      lastUpdated: new Date()
    }
  ];
  
  // Initialize dashboard when component mounts
  onMount(() => {
    shopDashboardActions.initializeShopDashboard();
    
    if (shopOwner) {
      shopDashboardActions.updateShopData({
        shopOwnerName: shopOwner.name,
        shopName: shopOwner.shopName,
        totalItems: items.length,
        itemsInStock: items.filter(i => i.status === 'in_stock').length,
        itemsOutOfStock: items.filter(i => i.status === 'out_of_stock').length,
        itemsLowStock: items.filter(i => i.status === 'low_stock').length
      });
    }
  });
  
  // Computed values
  $: filteredItems = items
    .filter(item => {
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedStockFilter !== 'all' && item.status !== selectedStockFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'stock':
          return a.stock - b.stock;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  
  // Event handlers
  function handleAddItem() {
    showItemForm = true;
  }
  
  function handleItemSelect(itemId: number) {
    shopDashboardActions.selectItem(itemId.toString());
  }
  
  function handleBulkAction() {
    showBulkModal = true;
  }
  
  function handleInlineEdit(itemId: string, field: string) {
    editingItem = itemId;
    editingField = field;
  }
  
  function handleSaveEdit() {
    editingItem = null;
    editingField = null;
    // Would save to API in real implementation
  }
  
  function handleSort(newSortBy: string) {
    sortBy = newSortBy;
    shopDashboardActions.updateSort(newSortBy);
  }
  
  function handleSearch(query: string) {
    searchQuery = query;
    shopDashboardActions.updateSearch(query);
  }
  
  function getStatusColor(status: string): string {
    switch (status) {
      case 'in_stock': return 'green';
      case 'low_stock': return 'yellow';
      case 'out_of_stock': return 'red';
      default: return 'gray';
    }
  }
  
  function getStatusIcon(status: string): string {
    switch (status) {
      case 'in_stock': return '🟢';
      case 'low_stock': return '🟡';
      case 'out_of_stock': return '🔴';
      default: return '⚪';
    }
  }
</script>

<!-- Mobile-optimized dashboard layout -->
<div class="shop-dashboard" class:mobile={mobile.useMobileLayout} data-testid="dashboard-overview">
  
  <!-- Dashboard Header -->
  <header class="dashboard-header">
    <div class="greeting-section" data-testid="shop-greeting">
      <h1>Welcome back, {shopOwner?.name || 'Shop Owner'}</h1>
      <p class="shop-name" data-testid="shop-name">{shopOwner?.shopName || 'Your Shop'}</p>
    </div>
    
    <div class="header-actions">
      <button 
        class="notifications-btn" 
        class:has-notifications={notifs.totalNotifications > 0}
        on:click={() => showNotifications = !showNotifications}
        data-testid="notifications-btn"
        aria-label="View notifications"
      >
        🔔
        {#if notifs.totalNotifications > 0}
          <span class="notification-badge" data-testid="notification-count">{notifs.totalNotifications}</span>
        {/if}
      </button>
      
      <button class="settings-btn" data-testid="shop-settings-btn" aria-label="Shop settings">
        ⚙️
      </button>
    </div>
  </header>
  
  <!-- Notifications Panel -->
  {#if showNotifications}
    <div class="notifications-panel" data-testid="notifications-panel">
      <h3>Notifications</h3>
      
      {#if notifs.hasLowStockAlerts}
        <div class="alert low-stock" data-testid="low-stock-alert">
          🟡 Some items are running low on stock
        </div>
      {/if}
      
      {#if notifs.hasOutOfStockAlerts}
        <div class="alert out-stock" data-testid="out-stock-alert">
          🔴 Some items are out of stock
        </div>
      {/if}
      
      <button class="close-notifications" on:click={() => showNotifications = false}>
        Close
      </button>
    </div>
  {/if}
  
  <!-- Dashboard Overview Section -->
  <section class="overview-section" data-testid="dashboard-overview">
    <h2>Inventory Overview</h2>
    
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-value" data-testid="total-items">{overview.totalItems}</div>
        <div class="metric-label">Total Items</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-value" data-testid="items-in-stock">{state.itemsInStock}</div>
        <div class="metric-label">In Stock</div>
        <div class="status-indicator" data-testid="green-indicator">🟢</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-value" data-testid="items-low-stock">{state.itemsLowStock}</div>
        <div class="metric-label">Low Stock</div>
        <div class="status-indicator" data-testid="yellow-indicator">🟡</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-value" data-testid="items-out-stock">{state.itemsOutOfStock}</div>
        <div class="metric-label">Out of Stock</div>
        <div class="status-indicator" data-testid="red-indicator">🔴</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-value" data-testid="stock-percentage">{overview.inStockPercentage}%</div>
        <div class="metric-label">Stock Health</div>
      </div>
    </div>
  </section>
  
  <!-- Quick Actions -->
  <section class="quick-actions">
    <h2>Quick Actions</h2>
    
    <div class="action-buttons">
      <button 
        class="primary-btn add-item" 
        on:click={handleAddItem}
        data-testid="add-item-btn"
        disabled={!actions.canAddItem}
      >
        ➕ Add New Item
      </button>
      
      <button 
        class="secondary-btn update-prices" 
        data-testid="update-prices-btn"
        disabled={!actions.canUpdatePrices}
      >
        💰 Update Prices
      </button>
      
      <button 
        class="secondary-btn manage-inventory" 
        data-testid="manage-inventory-btn"
      >
        📦 Manage Inventory
      </button>
      
      <button 
        class="secondary-btn view-reports" 
        data-testid="view-reports-btn"
      >
        📊 View Reports
      </button>
    </div>
  </section>
  
  <!-- Item List Section -->
  <section class="item-list-section">
    <div class="list-header">
      <h2>Your Items</h2>
      
      <!-- Search and Filters -->
      <div class="list-controls">
        <input 
          type="text"
          placeholder="Search items..."
          bind:value={searchQuery}
          on:input={(e) => handleSearch(e.target.value)}
          data-testid="item-search"
          class="search-input"
        />
        
        <select 
          bind:value={selectedCategory}
          data-testid="category-filter"
          class="filter-select"
        >
          <option value="all">All Categories</option>
          <option value="weapons">Weapons</option>
          <option value="tools">Tools</option>
          <option value="enchantments">Enchantments</option>
        </select>
        
        <select 
          bind:value={selectedStockFilter}
          data-testid="stock-filter"
          class="filter-select"
        >
          <option value="all">All Stock Levels</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
        
        <!-- Sort Controls -->
        <div class="sort-controls">
          <button 
            class="sort-btn" 
            class:active={sortBy === 'name'}
            on:click={() => handleSort('name')}
            data-testid="sort-by-name"
          >
            Name
          </button>
          <button 
            class="sort-btn" 
            class:active={sortBy === 'price'}
            on:click={() => handleSort('price')}
            data-testid="sort-by-price"
          >
            Price
          </button>
          <button 
            class="sort-btn" 
            class:active={sortBy === 'stock'}
            on:click={() => handleSort('stock')}
            data-testid="sort-by-stock"
          >
            Stock
          </button>
        </div>
      </div>
    </div>
    
    <!-- Item List -->
    <div class="item-list" data-testid="item-list" role="table">
      {#if actions.hasSelection}
        <div class="bulk-actions-panel" data-testid="bulk-actions-panel">
          <span data-testid="selected-count">{actions.selectedCount} items selected</span>
          <button 
            class="bulk-btn" 
            on:click={handleBulkAction}
            data-testid="bulk-price-adjust-btn"
          >
            Bulk Price Adjust
          </button>
        </div>
      {/if}
      
      <div class="search-results" data-testid="search-results">
        {#each filteredItems as item (item.id)}
          <div 
            class="item-row" 
            data-testid="item-{item.name.toLowerCase().replace(/\s+/g, '-')}"
          >
            <!-- Selection Checkbox -->
            <input 
              type="checkbox"
              on:change={() => handleItemSelect(item.id)}
              data-testid="select-{item.name.toLowerCase().replace(/\s+/g, '-')}"
              class="item-checkbox"
            />
            
            <!-- Status Indicator -->
            <div class="status-indicator">
              <span style="color: {getStatusColor(item.status)}">
                {getStatusIcon(item.status)}
              </span>
            </div>
            
            <!-- Item Name -->
            <div class="item-name" data-testid="item-name">
              {item.name}
            </div>
            
            <!-- Price (with inline editing) -->
            <div class="item-price">
              {#if editingItem === item.id.toString() && editingField === 'price'}
                <input 
                  type="number"
                  value={item.price}
                  on:blur={handleSaveEdit}
                  on:keypress={(e) => e.key === 'Enter' && handleSaveEdit()}
                  data-testid="price-edit-input"
                  class="inline-edit-input"
                  auto-focus
                />
              {:else}
                <span 
                  on:click={() => handleInlineEdit(item.id.toString(), 'price')}
                  data-testid="item-price"
                  class="editable"
                >
                  {item.price} 💎
                </span>
              {/if}
            </div>
            
            <!-- Trading Unit -->
            <div class="trading-unit" data-testid="trading-unit">
              {item.tradingUnit.replace('_', ' ')}
            </div>
            
            <!-- Stock Quantity (with inline editing) -->
            <div class="stock-quantity">
              {#if editingItem === item.id.toString() && editingField === 'stock'}
                <input 
                  type="number"
                  value={item.stock}
                  on:blur={handleSaveEdit}
                  on:keypress={(e) => e.key === 'Enter' && handleSaveEdit()}
                  data-testid="stock-edit-input"
                  class="inline-edit-input"
                  auto-focus
                />
              {:else}
                <span 
                  on:click={() => handleInlineEdit(item.id.toString(), 'stock')}
                  data-testid="stock-quantity"
                  class="editable"
                >
                  {item.stock}
                </span>
              {/if}
            </div>
            
            <!-- Quick Actions -->
            <div class="item-actions">
              <button 
                class="action-btn edit"
                data-testid="quick-edit-btn"
                aria-label="Edit {item.name}"
              >
                ✏️
              </button>
              <button 
                class="action-btn view"
                data-testid="view-in-marketplace"
                aria-label="View {item.name} in marketplace"
              >
                👁️
              </button>
              <button 
                class="action-btn delete"
                data-testid="quick-delete-btn"
                aria-label="Delete {item.name}"
              >
                🗑️
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>
  
  <!-- Mobile Swipe Actions (visible on mobile) -->
  {#if mobile.useMobileLayout}
    <div class="swipe-actions" data-testid="swipe-actions" style="display: none;">
      <button class="swipe-action edit" data-testid="quick-edit-btn">Edit</button>
      <button class="swipe-action delete" data-testid="quick-delete-btn">Delete</button>
    </div>
  {/if}
</div>

<!-- Item Creation Modal -->
{#if showItemForm}
  <div class="modal-overlay" on:click={() => showItemForm = false}>
    <div class="modal-content" on:click|stopPropagation data-testid="item-creation-form">
      <h3>Add New Item</h3>
      
      <form class="item-form">
        <div class="form-group">
          <label for="item-name">Item Name</label>
          <input 
            type="text" 
            id="item-name"
            data-testid="item-name-input"
            placeholder="Enter item name"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="item-price">Price (Diamonds)</label>
          <input 
            type="number" 
            id="item-price"
            data-testid="item-price-input"
            placeholder="64"
            min="1"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="trading-unit">Trading Unit</label>
          <select id="trading-unit" data-testid="trading-unit-select" required>
            <option value="per_item">Per Item</option>
            <option value="per_stack">Per Stack (64)</option>
            <option value="per_dozen">Per Dozen (12)</option>
            <option value="per_shulker">Per Shulker (1,728)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="stock-quantity">Initial Stock</label>
          <input 
            type="number" 
            id="stock-quantity"
            data-testid="stock-quantity-input"
            placeholder="10"
            min="0"
            required
          />
        </div>
        
        <div class="form-actions">
          <button type="button" on:click={() => showItemForm = false}>Cancel</button>
          <button type="submit" class="primary-btn">Add Item</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Bulk Operations Modal -->
{#if showBulkModal}
  <div class="modal-overlay" on:click={() => showBulkModal = false}>
    <div class="modal-content" on:click|stopPropagation data-testid="bulk-price-modal">
      <h3>Bulk Price Adjustment</h3>
      
      <form class="bulk-form">
        <div class="form-group">
          <label for="adjustment-type">Adjustment Type</label>
          <select id="adjustment-type" data-testid="adjustment-type">
            <option value="percentage_increase">Percentage Increase</option>
            <option value="percentage_decrease">Percentage Decrease</option>
            <option value="fixed_amount">Fixed Amount</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="adjustment-value">Value</label>
          <input 
            type="number" 
            id="adjustment-value"
            data-testid="adjustment-value"
            placeholder="10"
            required
          />
        </div>
        
        <div class="form-actions">
          <button type="button" on:click={() => showBulkModal = false}>Cancel</button>
          <button type="submit" class="primary-btn" data-testid="apply-bulk-changes">
            Apply Changes
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .shop-dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .greeting-section h1 {
    margin: 0 0 0.5rem 0;
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
  }
  
  .shop-name {
    margin: 0;
    font-size: 1rem;
    color: #6b7280;
  }
  
  .header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .notifications-btn, .settings-btn {
    position: relative;
    padding: 0.5rem;
    border: none;
    background: #f3f4f6;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1.25rem;
    transition: background-color 0.2s;
  }
  
  .notifications-btn:hover, .settings-btn:hover {
    background: #e5e7eb;
  }
  
  .notification-badge {
    position: absolute;
    top: -0.25rem;
    right: -0.25rem;
    background: #ef4444;
    color: white;
    border-radius: 50%;
    width: 1.25rem;
    height: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .notifications-panel {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .alert {
    padding: 0.75rem;
    border-radius: 0.375rem;
    margin-bottom: 0.5rem;
  }
  
  .alert.low-stock {
    background: #fef3c7;
    border: 1px solid #f59e0b;
  }
  
  .alert.out-stock {
    background: #fee2e2;
    border: 1px solid #ef4444;
  }
  
  .overview-section {
    margin-bottom: 2rem;
  }
  
  .overview-section h2 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
  }
  
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .metric-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1.5rem;
    text-align: center;
    position: relative;
  }
  
  .metric-value {
    font-size: 2rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.5rem;
  }
  
  .metric-label {
    font-size: 0.875rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .status-indicator {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    font-size: 1rem;
  }
  
  .quick-actions {
    margin-bottom: 2rem;
  }
  
  .quick-actions h2 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
  }
  
  .action-buttons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .primary-btn, .secondary-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }
  
  .primary-btn {
    background: #3b82f6;
    color: white;
  }
  
  .primary-btn:hover:not(:disabled) {
    background: #2563eb;
  }
  
  .primary-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
  
  .secondary-btn {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }
  
  .secondary-btn:hover:not(:disabled) {
    background: #e5e7eb;
  }
  
  .secondary-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .item-list-section {
    margin-bottom: 2rem;
  }
  
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .list-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
  }
  
  .list-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .search-input, .filter-select {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
  }
  
  .search-input {
    min-width: 200px;
  }
  
  .sort-controls {
    display: flex;
    gap: 0.25rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    overflow: hidden;
  }
  
  .sort-btn {
    padding: 0.5rem 1rem;
    border: none;
    background: white;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background-color 0.2s;
  }
  
  .sort-btn:hover {
    background: #f3f4f6;
  }
  
  .sort-btn.active {
    background: #3b82f6;
    color: white;
  }
  
  .bulk-actions-panel {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 0.375rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .bulk-btn {
    padding: 0.5rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
  }
  
  .bulk-btn:hover {
    background: #2563eb;
  }
  
  .item-list {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
  }
  
  .item-row {
    display: grid;
    grid-template-columns: auto auto 1fr auto auto auto auto;
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid #f3f4f6;
    align-items: center;
  }
  
  .item-row:last-child {
    border-bottom: none;
  }
  
  .item-checkbox {
    margin: 0;
  }
  
  .item-name {
    font-weight: 500;
    color: #111827;
  }
  
  .editable {
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
  }
  
  .editable:hover {
    background: #f3f4f6;
  }
  
  .inline-edit-input {
    width: 80px;
    padding: 0.25rem;
    border: 1px solid #3b82f6;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }
  
  .item-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .action-btn {
    padding: 0.25rem;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
  }
  
  .action-btn:hover {
    background: #f3f4f6;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    border-radius: 0.5rem;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .modal-content h3 {
    margin: 0 0 1.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }
  
  .form-group input, .form-group select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }
  
  .form-actions button {
    padding: 0.75rem 1.5rem;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid #d1d5db;
    background: white;
    color: #374151;
  }
  
  .form-actions button:hover {
    background: #f3f4f6;
  }
  
  /* Mobile-specific styles */
  .shop-dashboard.mobile {
    padding: 0.5rem;
  }
  
  .shop-dashboard.mobile .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .shop-dashboard.mobile .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  .shop-dashboard.mobile .metric-card {
    padding: 1rem;
  }
  
  .shop-dashboard.mobile .action-buttons {
    flex-direction: column;
  }
  
  .shop-dashboard.mobile .list-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .shop-dashboard.mobile .search-input {
    min-width: auto;
    width: 100%;
  }
  
  .shop-dashboard.mobile .item-row {
    grid-template-columns: auto 1fr auto;
    gap: 0.5rem;
    padding: 0.75rem;
  }
  
  .shop-dashboard.mobile .item-actions {
    flex-direction: column;
  }
  
  /* Touch-friendly buttons for mobile */
  .shop-dashboard.mobile .primary-btn,
  .shop-dashboard.mobile .secondary-btn {
    min-height: 44px; /* iOS recommended minimum */
    width: 100%;
  }
  
  .shop-dashboard.mobile .action-btn {
    min-height: 44px;
    min-width: 44px;
  }
  
  .swipe-actions {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #f3f4f6;
    border-radius: 0.375rem;
  }
  
  .swipe-action {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.875rem;
  }
  
  .swipe-action.edit {
    background: #3b82f6;
    color: white;
  }
  
  .swipe-action.delete {
    background: #ef4444;
    color: white;
  }
  
  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
      animation: none !important;
    }
  }
  
  /* Focus styles for keyboard navigation */
  button:focus,
  input:focus,
  select:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .metric-card,
    .item-list,
    .modal-content {
      border-width: 2px;
    }
  }
</style>