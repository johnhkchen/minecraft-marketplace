# Enhanced HATEOAS Filtering with Contextual Actions

## Overview

This specification defines Phase 1 enhancements to our existing marketplace interface, building on current strengths while adding HATEOAS principles and contextual user interactions. The design leverages our working 55-item dataset, existing card layout, and PostgREST API foundation.

## Strategic Rationale

**Why This Phase 1 Approach:**
- Builds on existing assets (item cards, filtering, PostgREST API)
- Provides immediate user value without architectural rewrites
- Creates foundation for future real-time and location features
- Maintains current deployment and testing infrastructure

## Current Foundation Assessment

### ✅ Existing Strengths
- **Item Cards**: `EnhancedHomepage.svelte` displays name, price, shop, stock
- **Filtering System**: Search and category filtering working via `homepage-data.ts`
- **API Infrastructure**: PostgREST endpoints support query parameters
- **Realistic Dataset**: 55 items from 7 shops (Safe Survival server)
- **Performance Foundation**: MSW mocking, <10ms test execution
- **Deployment Ready**: Docker production build on port 7410

### ⚠️ Enhancement Targets
- **User Context**: No role-based action differentiation
- **API Responses**: Basic data, no HATEOAS links
- **Filtering**: Limited to search/category, no advanced filters
- **Actions**: Static display, no contextual buttons

## Technical Specification

### Compliance with Main Specification Architecture

This enhancement maintains full compliance with the main specification's architecture:

#### Routing Blueprint Compliance
- **`/api/data/*`** → PostgREST auto-generated database API (enhanced with HATEOAS links)
- **`/api/auth/*`** → Astro secure authentication routes (Discord OAuth user context)
- **`/api/internal/*`** → Astro internal operations (shop owner actions: edit, update stock)
- **`/api/v1/*`** → Hono external integrations (community reporting, verification)
- **`/docs`** → Swagger UI documentation (auto-updated with new HATEOAS endpoints)

#### Technology Stack Integration
- **PostgREST Integration**: Uses `/api/data/*` routes as defined in routing blueprint  
- **JWT Authentication**: Leverages Discord OAuth + JWT system for user context
- **Currency System**: Preserves diamond-based pricing with human-readable displays
- **Evidence System**: Integrates with existing confidence_level enum and community_reports table
- **Testing Stack**: Extends Vitest + Faker + Playwright infrastructure

#### Ready Repo Standards Preservation
- **Fresh Install Guarantee**: Maintains `docker compose up` → working demo
- **Zero Manual Steps**: All new features work without configuration
- **CI/CD Parity**: Enhanced tests run identically locally and in CI
- **Clear Error Messages**: HATEOAS links provide actionable feedback

### 1. Enhanced API Response Format

#### Current Response Structure
```typescript
// Current: workspaces/frontend/src/lib/homepage-data.ts
interface MarketplaceItem {
  id: string;
  name: string;
  category: string;
  price: number;
  priceDisplay: string;
  shopName: string;
  stockQuantity: number;
}
```

#### Enhanced HATEOAS Response
```typescript
interface HATEOASMarketplaceItem extends MarketplaceItem {
  // Existing fields remain unchanged
  
  // New contextual fields
  location?: {
    biome: 'jungle' | 'desert' | 'ocean' | 'mountains' | 'plains' | 'nether' | 'end';
    direction: 'north' | 'south' | 'east' | 'west' | 'spawn';
    warpCommand?: string; // "/warp junglehub"
    coordinates?: { x: number; z: number };
  };
  
  verification?: {
    lastVerified?: Date;
    verifiedBy?: string;
    confidenceLevel: 'low' | 'medium' | 'high';
  };
  
  // HATEOAS: Contextual actions based on user permissions
  _links: {
    self: { href: string };
    
    // Shopper actions (always available)
    copyWarp?: { 
      href: string; 
      method: 'POST';
      title: 'Copy warp command';
    };
    
    // Owner actions (if user owns this item)
    edit?: { 
      href: string; 
      method: 'PUT';
      title: 'Edit listing';
      requiresAuth: true;
    };
    updateStock?: { 
      href: string; 
      method: 'PATCH';
      title: 'Update stock';
      requiresAuth: true;
    };
    
    // Community actions (if user has permission)
    reportPrice?: { 
      href: string; 
      method: 'POST';
      title: 'Report price change';
      requiresAuth: true;
    };
    verify?: { 
      href: string; 
      method: 'PATCH';
      title: 'Verify current';
      requiresAuth: true;
      permission: 'VERIFY_PRICES';
    };
  };
}
```

### 2. Enhanced Filter System

#### Current Filtering
```typescript
// Current: Basic search + category in homepage-data.ts
const itemsUrl = urlService.buildApiUrl(`/public_items?limit=${itemsPerPage}&offset=${offset}&order=price_diamonds.desc`);
```

#### Enhanced Filter Interface
```typescript
interface FilterState {
  // Existing filters (keep working)
  search?: string;
  category?: ItemCategory;
  
  // New contextual filters
  biome?: 'any' | 'jungle' | 'desert' | 'ocean' | 'mountains' | 'plains' | 'nether' | 'end';
  direction?: 'any' | 'north' | 'south' | 'east' | 'west' | 'spawn';
  priceRange?: {
    min?: number;
    max?: number;
    currency: 'diamonds' | 'diamond_blocks';
  };
  verification?: 'any' | 'verified' | 'unverified';
  availability?: 'any' | 'in_stock' | 'low_stock';
  
  // Meta filters
  sortBy: 'price_desc' | 'price_asc' | 'name_asc' | 'recent' | 'verified_first';
}

interface FilterBarComponent {
  // Progressive enhancement: show filters based on data availability
  visibleFilters: Array<keyof FilterState>;
  
  // Performance: debounced updates
  updateDelay: 300; // ms
  
  // UX: filter state persistence
  persistInUrl: boolean;
}
```

### 3. Contextual Action System

#### User Permission Detection
```typescript
interface UserContext {
  isAuthenticated: boolean;
  discordId?: string;
  username?: string;
  permissions: Set<UserPermission>;
  ownedItemIds: Set<string>;
}

// Aligns with main spec user_role enum: 'user' | 'shop_owner' | 'moderator' | 'admin'
type UserPermission = 
  | 'EDIT_OWN_LISTINGS'    // shop_owner role
  | 'SUBMIT_PRICE_DATA'    // user+ role (authenticated users)
  | 'VERIFY_PRICES'        // moderator+ role
  | 'MODERATE_REPORTS'     // moderator+ role
  | 'VIEW_ANALYTICS'       // admin role

// Permission-based action filtering
function getAvailableActions(item: HATEOASMarketplaceItem, user: UserContext): ActionButton[] {
  const actions: ActionButton[] = [];
  
  // Universal actions (no auth required)
  if (item._links.copyWarp) {
    actions.push({
      label: 'Copy /warp command',
      action: 'copyWarp',
      style: 'primary',
      icon: '📍',
      onClick: () => copyToClipboard(item.location?.warpCommand)
    });
  }
  
  // Owner actions
  if (user.ownedItemIds.has(item.id)) {
    if (item._links.edit) {
      actions.push({
        label: 'Edit Listing',
        action: 'edit',
        style: 'secondary',
        icon: '✏️',
        href: item._links.edit.href
      });
    }
    
    if (item._links.updateStock) {
      actions.push({
        label: 'Update Stock',
        action: 'updateStock',
        style: 'secondary',
        icon: '📦',
        onClick: () => openStockModal(item.id)
      });
    }
  }
  
  // Community actions
  if (user.permissions.has('SUBMIT_PRICE_DATA') && item._links.reportPrice) {
    actions.push({
      label: 'Report Price',
      action: 'reportPrice',
      style: 'tertiary',
      icon: '💰',
      onClick: () => openPriceReportModal(item.id)
    });
  }
  
  if (user.permissions.has('VERIFY_PRICES') && item._links.verify) {
    actions.push({
      label: 'Verify ✓',
      action: 'verify',
      style: 'success',
      icon: '✅',
      onClick: () => verifyItem(item.id)
    });
  }
  
  return actions;
}
```

### 4. Component Enhancement Strategy

#### Enhanced Item Card
```typescript
// Extension of existing EnhancedHomepage.svelte item cards
interface EnhancedItemCard {
  // Existing display data (unchanged)
  item: HATEOASMarketplaceItem;
  
  // New contextual elements
  userContext: UserContext;
  availableActions: ActionButton[];
  
  // Progressive disclosure
  showLocation: boolean;
  showVerification: boolean;
  showAdvancedActions: boolean;
}
```

#### Filter Bar Component
```svelte
<!-- New component: FilterBar.svelte -->
<div class="filter-bar" data-testid="enhanced-filters">
  <!-- Existing search (keep working) -->
  <div class="filter-group">
    <label>🔍</label>
    <input 
      type="search" 
      placeholder="Search items..."
      bind:value={filters.search}
      on:input={debouncedUpdate}
    >
  </div>
  
  <!-- Enhanced filters (progressive disclosure) -->
  {#if showAdvancedFilters}
    <div class="filter-group">
      <label>🌲 Biome</label>
      <select bind:value={filters.biome}>
        <option value="any">Any Location</option>
        <option value="jungle">🌿 Jungle</option>
        <option value="desert">🏜️ Desert</option>
        <option value="ocean">🌊 Ocean</option>
        <option value="mountains">⛰️ Mountains</option>
        <option value="nether">🔥 Nether</option>
        <option value="end">🌌 End</option>
      </select>
    </div>
    
    <div class="filter-group">
      <label>💎 Price</label>
      <select bind:value={filters.pricePreset}>
        <option value="any">Any Price</option>
        <option value="budget">Under 10 💎</option>
        <option value="mid">10-50 💎</option>
        <option value="premium">50+ 💎</option>
        <option value="luxury">100+ 💎</option>
      </select>
    </div>
    
    <div class="filter-group">
      <label>✅ Status</label>
      <select bind:value={filters.verification}>
        <option value="any">Any Status</option>
        <option value="verified">✅ Verified</option>
        <option value="unverified">⏳ Unverified</option>
      </select>
    </div>
  {/if}
  
  <button 
    class="toggle-advanced"
    on:click={() => showAdvancedFilters = !showAdvancedFilters}
  >
    {showAdvancedFilters ? 'Less' : 'More'} Filters
  </button>
</div>
```

## Implementation Strategy

### Alignment with Implementation Strategy Specification

This Phase 1 approach aligns with the archive/IMPLEMENTATION_STRATEGY.md reference-based migration:

#### ✅ Leverages High-Value Assets
- **Frontend Components**: Extends existing `EnhancedHomepage.svelte` cards
- **Price Display System**: Preserves sophisticated diamond economy formatting  
- **Test Infrastructure**: Builds on existing Vitest test suite
- **Docker Setup**: Uses existing container foundation

#### 🔄 Adapts Medium-Value Patterns  
- **API Route Patterns**: Extends PostgREST endpoints with HATEOAS links
- **Database Schema**: Builds on PostgreSQL foundation from Phase 1 infrastructure

#### ❌ No Architecture Rewrites
- Preserves all current functionality
- No replacement of core systems
- Incremental enhancement approach

### Phase 1A: API Enhancement (Week 1)
1. **Extend PostgREST responses** with HATEOAS links (leverages existing `/api/data/*` routes)
2. **Add location/biome fields** to database schema (extends main spec items table)
3. **Implement user context detection** via Discord OAuth (uses existing JWT system)
4. **Create permission system** foundation (maps to main spec user_role enum)

### Phase 1B: Frontend Enhancement (Week 2)
1. **Extend existing item cards** with contextual actions (preserves `EnhancedHomepage.svelte`)
2. **Add enhanced filter bar** component (builds on existing search/category filtering)
3. **Implement action handlers** (copy warp, edit, report)
4. **Add progressive disclosure** for advanced features

### Phase 1C: Integration & Testing (Week 3)
1. **Update MSW mocks** with HATEOAS responses (extends existing fast-test-setup.ts)
2. **Extend fast tests** for new functionality (maintains <10ms execution target)
3. **Add E2E tests** for contextual actions (extends homepage-comprehensive.spec.ts)
4. **Performance validation** (<500ms filtering requirement from main spec)

## Data Migration Strategy

### Database Schema Extensions

#### Alignment with Main Specification Schema
```sql
-- IMPORTANT: Extends main spec items table (see MINECRAFT_MARKETPLACE_SPEC.md)
-- Main spec schema:
-- items (
--   id: uuid PRIMARY KEY,
--   owner_id: uuid REFERENCES users(id),
--   name: text NOT NULL,
--   description: text,
--   processed_description: text, -- BAML standardized  
--   category: item_category NOT NULL,
--   minecraft_id: text,
--   enchantments: jsonb, -- BAML extracted enchantment data
--   item_attributes: jsonb, -- BAML extracted attributes  
--   stock_quantity: integer DEFAULT 0 CHECK (stock_quantity >= 0),
--   is_available: boolean DEFAULT true,
--   server_name: text,
--   shop_location: text, -- EXISTING FIELD for shop location
--   created_at: timestamptz DEFAULT now(),
--   updated_at: timestamptz DEFAULT now()
-- )

-- Phase 1 Extensions: Add location and verification fields
ALTER TABLE public.items 
ADD COLUMN biome VARCHAR(20),
ADD COLUMN direction VARCHAR(10), 
ADD COLUMN warp_command VARCHAR(100),
ADD COLUMN coordinates_x INTEGER,
ADD COLUMN coordinates_z INTEGER,
ADD COLUMN last_verified timestamptz,
ADD COLUMN verified_by uuid REFERENCES users(id),
ADD COLUMN confidence_level confidence_level DEFAULT 'medium';

-- Extend main spec confidence_level enum if needed
-- ALTER TYPE confidence_level ADD VALUE 'unverified';

-- Update existing Safe Survival data with sample locations
UPDATE public.items SET 
  biome = 'jungle',
  direction = 'north', 
  warp_command = '/warp ' || LOWER(REPLACE(name, ' ', ''))
WHERE server_name = 'Safe Survival';
```

### Backward Compatibility
- All existing API endpoints continue working unchanged
- New fields are optional with sensible defaults
- Progressive enhancement ensures graceful degradation

## Testing Strategy

### Enhanced Fast Tests
```typescript
// Extension of existing fast-test-setup.ts
describe('Enhanced HATEOAS Filtering', () => {
  setupFastTests(); // Existing MSW infrastructure
  
  test('filters by biome with HATEOAS links', async () => {
    const { result, timeMs } = await measure(async () => {
      return await apiService.getItems({ 
        biome: 'jungle',
        includeLinks: true 
      });
    });
    
    expectFastExecution(timeMs, 10); // <10ms requirement
    expect(result).toHaveLength(5); // Jungle items
    expect(result[0]._links.copyWarp).toBeDefined();
  });
  
  test('shows contextual actions based on user permissions', async () => {
    const userContext = { 
      isAuthenticated: true,
      permissions: new Set(['VERIFY_PRICES']),
      ownedItemIds: new Set(['item_001'])
    };
    
    const actions = getAvailableActions(mockItem(), userContext);
    
    expect(actions).toContainEqual(
      expect.objectContaining({ action: 'verify' })
    );
  });
});
```

### E2E Validation
```typescript
// Extension of existing homepage-comprehensive.spec.ts
test('enhanced filtering with contextual actions', async ({ page }) => {
  await page.goto('/');
  
  // Test enhanced filters
  await page.selectOption('[data-testid="biome-filter"]', 'jungle');
  await page.selectOption('[data-testid="price-filter"]', 'premium');
  
  // Verify filtered results
  const items = page.locator('[data-testid="item-card"]');
  await expect(items.first()).toContainText('Jungle');
  
  // Test contextual actions
  const copyWarpBtn = items.first().locator('button:has-text("Copy /warp")');
  await expect(copyWarpBtn).toBeVisible();
  
  await copyWarpBtn.click();
  // Verify clipboard contains warp command
});
```

## Performance Requirements

### Existing Targets (Maintained)
- **Search**: <2s with 10,000+ items  
- **API**: <200ms (95th percentile)
- **Filtering**: <500ms
- **Fast Tests**: <10ms per test

### New Performance Targets
- **Enhanced Filtering**: <300ms with all filters active
- **HATEOAS Link Generation**: <50ms additional overhead
- **Action Handler Response**: <100ms for UI feedback
- **Progressive Disclosure**: <16ms for smooth animations

## Success Metrics

### Functional Validation
- ✅ All existing functionality preserved
- ✅ Enhanced filters reduce result sets effectively
- ✅ Contextual actions appear based on user permissions
- ✅ HATEOAS links generate correctly
- ✅ Performance targets met

### User Experience Validation
- Users can find items faster with enhanced filters
- Shop owners can manage listings directly from cards
- Price checkers can verify/report efficiently
- Copy warp functionality works reliably
- Progressive disclosure doesn't overwhelm interface

### Technical Validation
- No breaking changes to existing API endpoints
- Enhanced responses backward compatible
- Fast tests remain under 10ms execution
- E2E tests cover new interaction patterns
- Database migrations execute cleanly

## Future Phase Readiness

### Phase 2 Foundation
- User permission system enables real-time features
- Location data supports warp/coordinate systems
- HATEOAS links enable API evolution
- Enhanced filtering supports complex queries

### Architecture Benefits
- PostgREST API easily extends with new endpoints
- Component system supports progressive enhancement
- MSW mocking infrastructure scales with complexity
- Database schema allows non-breaking additions

## Project Structure Integration

### File Organization Compliance
This enhancement integrates with the PROJECT_STRUCTURE.md greenfield organization:

#### Backend Extensions (`backend/src/`)
- **`routes/items/enhanced-filtering.ts`** → Enhanced PostgREST query building
- **`routes/auth/permissions.ts`** → User permission detection
- **`services/hateoas/link-generator.ts`** → Contextual action link generation

#### Frontend Extensions (`frontend/src/`)
- **`components/marketplace/EnhancedFilterBar.svelte`** → Advanced filtering UI
- **`components/marketplace/ContextualActions.svelte`** → Action button system
- **`lib/hateoas/action-handlers.ts`** → Client-side action execution

#### Database Schema (`infrastructure/database/schema/`)
- **`007_enhanced_filtering.sql`** → Location and verification field extensions
- **`008_hateoas_functions.sql`** → PostgreSQL functions for link generation

#### Testing Extensions (`tests/`)
- **`unit/hateoas-filtering.fast.test.ts`** → Fast MSW-mocked tests
- **`e2e/contextual-actions.spec.ts`** → End-to-end interaction tests
- **`integration/enhanced-api.testcontainers.test.ts`** → Full-stack integration tests

---

This specification builds incrementally on our proven foundation while adding immediate user value and preparing for future enhancements. The approach respects existing architecture decisions, maintains compliance with all specifications, and preserves our commitment to fast, tested, deployable software.