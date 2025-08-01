# Information Architecture Style Guide

> **Purpose**: Design guidelines for user-centered information architecture  
> **Audience**: Developers, designers, content creators  
> **Focus**: Making information findable, understandable, and actionable

---

## 1. Information Hierarchy

### Priority Order (Most to Least Important)

1. **Primary Actions**: Buy, Sell, Search
2. **Item Information**: Name, Price, Availability, Condition  
3. **Contextual Details**: Seller info, shipping, item specifics
4. **System Status**: Connection, last updated, technical health
5. **Meta Information**: About, help, technical stack (footer only)

### Implementation Examples

```typescript
// ✅ CORRECT: User value first
<header>
  <h1>Minecraft Item Marketplace</h1>
  <p>Buy and sell Minecraft items with your community</p>
  <div className="primary-actions">
    <button>Browse Items</button>
    <button>Sell Items</button>
  </div>
</header>

// ❌ WRONG: System details first
<header>
  <h1>🏗️ Minecraft Marketplace - The NASDAQ of Blocks</h1>
  <div className="tech-info">Astro SSR + Svelte + PostgreSQL</div>
  <div className="server-info">🌐 LIVE at :2888</div>
</header>
```

---

## 2. Content Strategy

### Language Guidelines

#### ✅ User-Centered Language

- **"Minecraft Item Marketplace"** not "The NASDAQ of Minecraft"
- **"Buy and sell items"** not "Efficient trading terminal"  
- **"42 items for sale"** not "Active Listings: 42"
- **"Browse items"** not "Browse market"
- **"Find items to buy"** not "Minecraft Marketplace - Find Items"

#### ❌ Prohibited Technical Jargon

- NASDAQ, Terminal, SSR, PostgreSQL, PostgREST
- Clearinghouse, Foundation-First Architecture
- Port numbers, server details in primary interface
- API endpoints, database references
- Technical stack badges in header

#### Terminology Consistency

| Context | Preferred Term | Avoid |
|---------|---------------|-------|
| Items for purchase | "items for sale" | "active listings", "sell orders" |
| Items wanted | "items wanted" | "buy orders", "buy listings" |
| People selling | "sellers", "shop owners" | "vendors", "traders" |
| Location | "shop", "stall" | "vendor location", "trading post" |
| Currency | "diamonds", "diamond blocks" | "currency units", "DB" |

### Content Patterns

#### Action-Oriented Headlines
```html
<!-- ✅ CORRECT: Task-focused -->
<h2>Find Items to Buy</h2>
<p>Browse available items from community members</p>

<!-- ❌ WRONG: System-focused -->
<h2>Minecraft Marketplace - Browse Interface</h2>
<p>Database-driven listing aggregation system</p>
```

#### Progressive Disclosure
```html
<!-- ✅ CORRECT: Advanced features hidden -->
<input type="text" placeholder="What are you looking for?" />
<details>
  <summary>More filters</summary>
  <div><!-- Advanced options --></div>
</details>

<!-- ❌ WRONG: All options exposed -->
<div class="filters-grid">
  <!-- 8 different filter inputs all visible -->
</div>
```

---

## 3. HATEOAS Implementation

### Action Affordances (H1)

Every interactive element must clearly communicate what it does:

```typescript
// ✅ CORRECT: Clear action indication
<button 
  className="buy-action"
  title="Purchase this item from seller"
  aria-label="Buy Diamond Sword from SwordMaster for 5 diamond blocks"
>
  🛒 Buy Now
</button>

// ❌ WRONG: Ambiguous action
<button onClick={handleClick}>
  Submit
</button>
```

### System State Discovery (H2)

Current state must be visible and understandable:

```typescript
// ✅ CORRECT: Clear state communication
<div className="availability-badge sell">
  Available to buy
</div>
<div className="market-status">
  <span className="status-highlight">42</span> items available
</div>

// ❌ WRONG: Technical state
<div className="status">
  Connection: OK | Last sync: 1234567890
</div>
```

### Navigation Context (H3)

Users must always know where they are and where they can go:

```html
<!-- ✅ CORRECT: Clear navigation context -->
<nav role="navigation" aria-label="Main navigation">
  <button class="nav-item active" aria-current="page">Browse Items</button>
  <button class="nav-item">Sell Items</button>
</nav>
<div class="breadcrumb">
  <span>Marketplace</span> › <span class="current">Browse Items</span>
</div>

<!-- ❌ WRONG: No context -->
<div class="tabs">
  <div class="active">Tab 1</div>
  <div>Tab 2</div>
</div>
```

### Form State Communication (H4)

Forms must guide users toward successful completion:

```html
<!-- ✅ CORRECT: Helpful form guidance -->
<label for="search">What are you looking for?</label>
<input 
  id="search"
  type="text" 
  placeholder="Type item name (e.g., diamond sword, oak wood)"
  aria-describedby="search-help"
/>
<small id="search-help">Search works best with specific item names</small>

<!-- ❌ WRONG: No guidance -->
<input type="text" placeholder="Search..." />
```

### Error Recovery (H5)

Errors must provide specific recovery actions:

```typescript
// ✅ CORRECT: Actionable error message
<div className="error-message">
  <p>❌ Couldn't load items from the marketplace</p>
  <button onClick={retry} className="retry-btn">
    🔄 Try Again
  </button>
  <p>If this keeps happening, <a href="#help">contact support</a></p>
</div>

// ❌ WRONG: Unhelpful error
<div className="error">
  Error: HTTP 500 - Internal Server Error
</div>
```

---

## 4. Visual Hierarchy

### Typography Scale

```css
/* Primary: Page purpose and main actions */
h1 { font-size: 2rem; color: #ffd700; }
.primary-action { font-size: 1.3rem; font-weight: bold; }

/* Secondary: Section headings and key information */
h2 { font-size: 1.5rem; color: #ffd700; }
.item-name { font-size: 1.3rem; color: #ffd700; }

/* Tertiary: Supporting information */
.seller-info { font-size: 1rem; color: #81c784; }
.price-context { font-size: 0.85rem; color: #ccc; }

/* Quaternary: Metadata and system info */
.footer-tech { font-size: 0.7rem; color: #888; }
```

### Color Hierarchy

```css
/* Attention: Gold for primary information */
.primary-text { color: #ffd700; }
.highlight { color: #ffd700; font-weight: bold; }

/* Success: Green for available/positive actions */
.available { color: #81c784; }
.buy-action { background: linear-gradient(135deg, #4caf50, #45a049); }

/* Information: Blue for contact/secondary actions */
.contact-action { background: linear-gradient(135deg, #2196f3, #1976d2); }

/* Neutral: Gray for supporting information */
.supporting-text { color: #ccc; }
.metadata { color: #999; }
```

### Spacing Hierarchy

```css
/* Major sections */
.section-spacing { margin: 2rem 0; }

/* Content blocks */
.block-spacing { margin: 1.5rem 0; }

/* Related elements */
.group-spacing { margin: 1rem 0; }

/* Fine details */
.detail-spacing { margin: 0.5rem 0; }
```

---

## 5. Component Patterns

### Item Card Structure

```html
<article class="item-card" role="article">
  <header class="item-header">
    <div class="item-info">
      <MinecraftItemIcon />
      <div class="item-details">
        <h3 class="item-name">Diamond Sword</h3>
        <div class="availability-badge">Available to buy</div>
      </div>
    </div>
    <div class="price-display">
      <div class="price-main">5 diamond blocks</div>
      <div class="price-context">per item</div>
    </div>
  </header>
  
  <div class="item-details">
    <div class="key-info">
      <div class="quantity-info">
        <span class="quantity-label">Available:</span>
        <span class="quantity-value">1 item</span>
      </div>
      <div class="seller-info">
        <span class="seller-label">Seller:</span>
        <span class="seller-name">SwordMaster</span>
      </div>
    </div>
  </div>
  
  <footer class="item-actions">
    <div class="action-info">
      <div class="total-cost">
        <span class="cost-label">Total cost:</span>
        <span class="cost-value">5 diamond blocks</span>
      </div>
    </div>
    <button class="action-button buy-action">
      🛒 Buy Now
    </button>
  </footer>
</article>
```

### Search Interface Pattern

```html
<div class="search-controls">
  <h2>Find Items to Buy</h2>
  <p class="search-help">Browse available items from community members</p>
  
  <div class="primary-search">
    <label for="search" class="search-label">What are you looking for?</label>
    <input 
      id="search"
      type="text" 
      class="search-input"
      placeholder="Type item name (e.g., diamond sword, oak wood)"
    />
  </div>
  
  <details class="advanced-filters">
    <summary>More filters</summary>
    <div class="filter-grid">
      <!-- Advanced options -->
    </div>
  </details>
</div>
```

### Navigation Pattern

```html
<nav class="main-navigation" role="navigation" aria-label="Main navigation">
  <div class="nav-container">
    <button 
      class="nav-item active" 
      aria-current="page"
      title="Find items to buy"
    >
      <span class="nav-icon">🔍</span>
      <span class="nav-label">Browse Items</span>
    </button>
    <!-- More nav items -->
  </div>
  
  <div class="breadcrumb" aria-label="Breadcrumb">
    <span class="breadcrumb-item">Marketplace</span>
    <span class="breadcrumb-separator">›</span>
    <span class="breadcrumb-item current">Browse Items</span>
  </div>
</nav>
```

---

## 6. Testing Requirements

### Information Architecture Tests

```typescript
// Test information hierarchy
it('displays primary actions prominently', () => {
  render(<Homepage />);
  const buyButton = screen.getByRole('button', { name: /browse items/i });
  expect(buyButton).toBeVisible();
  expect(buyButton).toHaveClass('primary-action');
});

// Test jargon elimination
it('eliminates technical jargon from interface', () => {
  render(<Homepage />);
  expect(screen.queryByText(/nasdaq/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/terminal/i)).not.toBeInTheDocument();
});
```

### HATEOAS Tests

```typescript
// Test action affordances
it('shows available actions clearly', () => {
  const mockItem = { id: '1', actions: { canPurchase: true } };
  render(<ItemCard item={mockItem} />);
  
  const buyButton = screen.getByRole('button', { name: /buy now/i });
  expect(buyButton).toBeEnabled();
  expect(buyButton).toHaveAttribute('aria-label');
});

// Test error recovery
it('provides clear error recovery', () => {
  render(<ErrorState />);
  expect(screen.getByText(/couldn't load items/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /try again/i })).toBeVisible();
});
```

### User Task Tests (E2E)

```typescript
test('User finds and purchases item within 2 clicks', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Browse Items');
  await expect(page.locator('[data-testid="item-card"]')).toBeVisible();
  await page.click('button:has-text("Buy Now")');
  // Purchase flow validation
});
```

---

## 7. Success Metrics

### Primary Metrics (Information Design)

- **Information Scent**: 90% of users find target content within 2 clicks
- **Terminology Comprehension**: 100% of interface terms understood by non-technical users  
- **Task Path Efficiency**: 95% of users follow intended navigation paths
- **Content Hierarchy**: Eye-tracking confirms users focus on priority information first

### Secondary Metrics (User Experience)

- **Error Recovery**: Users successfully recover from errors without external help
- **Navigation Confidence**: Users demonstrate understanding of current location
- **Action Clarity**: Users correctly predict outcomes of interface actions
- **Progressive Disclosure**: Advanced features don't overwhelm primary tasks

### Measurement Methods

- **5-Second Test**: Users identify site purpose immediately
- **First-Click Test**: Users click correct areas for primary tasks  
- **Tree Test**: Navigation structure supports findable content
- **Content Comprehension**: Non-technical users understand all interface text

---

## 8. Maintenance Guidelines

### Regular Audits

1. **Quarterly Jargon Audit**: Remove any technical terms that crept into UI
2. **Semi-Annual Navigation Review**: Ensure paths match user mental models
3. **Annual Content Strategy Review**: Update language based on user feedback

### Adding New Features

1. **Information Hierarchy Check**: Where does this fit in the priority order?
2. **Language Review**: Does this use user-centered or system-centered language?
3. **HATEOAS Validation**: Are all actions and states clearly communicated?
4. **Progressive Disclosure**: Should this be behind a disclosure element?

### Content Updates

1. **User Value First**: Always lead with what the user gets
2. **Plain Language**: Avoid technical implementation details
3. **Consistent Terminology**: Use established terms from this guide
4. **Action-Oriented**: Focus on what users can do, not what the system does

---

*This guide ensures information remains findable, understandable, and actionable for all users.*