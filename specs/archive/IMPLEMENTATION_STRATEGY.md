# Implementation Strategy: Reference-Based Architecture Migration

> **Approach**: Use current SQLite implementation as reference while building proper PostgreSQL + PostgREST architecture
> **Goal**: Leverage existing business logic, UI components, and tests while implementing specification-compliant backend

---

## 1. Reference Implementation Assets

### **✅ Keep and Leverage (High Value)**

#### **Frontend Components & Logic**
- **Price Display System** (`/src/lib/price-display.ts`): Sophisticated diamond economy formatting - matches spec perfectly
- **Svelte Components**: Well-structured components with proper typing and reactive patterns
- **Form Handling**: Item listing forms with trading unit selection (per item/stack/shulker/dozen)
- **TypeScript Interfaces**: Clean type definitions that can guide PostgreSQL schema design

#### **Business Logic Patterns**
- **Currency Conversion Logic**: Diamond block to diamond calculations with intelligent display
- **Trading Unit Calculations**: Stack (64), Shulker (1,728), Dozen (12) item conversions
- **Special Case Handling**: "Make offer" (zero price) and "Free" (negative price) logic
- **Total Cost Calculations**: Smart formatting for different price ranges

#### **Test Infrastructure**
- **152 Test Files**: Comprehensive Vitest test suite provides excellent regression coverage
- **Test Patterns**: Well-established testing approaches that can validate new PostgreSQL backend
- **Mocking Strategies**: Database abstraction patterns that translate well to PostgREST integration

#### **Development Tooling**
- **Docker Setup**: Container configuration provides foundation for PostgreSQL/PostgREST stack
- **TypeScript Configuration**: Strict mode setup ensures type safety in new implementation
- **Code Quality Tools**: ESLint, Prettier configurations maintain consistency

### **🔄 Adapt and Migrate (Medium Value)**

#### **Database Schema Patterns**
- **Table Structure**: Current SQLite schema provides starting point for PostgreSQL design
- **Relationship Patterns**: Foreign keys and data relationships translate directly
- **Field Naming**: Consistent naming conventions can guide new schema

#### **API Route Patterns**
- **Endpoint Structure**: Current API routes show required functionality that PostgREST must support
- **Request/Response Patterns**: Data shapes and validation logic inform new API design
- **Error Handling**: Established error patterns guide PostgREST integration approach

### **❌ Replace Completely (Low Value)**

#### **Database Implementation**
- **SQLite Database**: Replace with PostgreSQL + PostgREST architecture
- **Database Client Logic**: Replace with PostgREST API calls and JWT authentication
- **Session Management**: Replace with Valkey-based session storage

#### **Authentication System**
- **Current Auth**: Replace with Discord OAuth + JWT token generation
- **Session Handling**: Replace with secure HTTP-only cookies and Valkey storage

---

## 2. Implementation Phases

### **Phase 1: Infrastructure Foundation (Week 1-2)**

#### **Container Stack Setup**
```yaml
# Priority 1: Core services running
✅ nginx reverse proxy as single entry point (ports 80/443)
✅ PostgreSQL 15 container with proper configuration
✅ PostgREST container with OpenAPI generation
✅ Valkey container for session storage
✅ Swagger UI container for API debugging
✅ All services internally networked (no exposed ports except nginx)
```

#### **Database Schema Migration**
```sql
-- Reference current SQLite schema
-- Implement PostgreSQL version with:
✅ UUID primary keys (vs current auto-increment)
✅ ENUM types for categories, trading units
✅ JSONB fields for BAML-processed metadata
✅ Row Level Security policies
✅ Full-text search indexes
```

#### **Basic PostgREST Integration**
```typescript
// Replace current database calls with PostgREST endpoints
✅ Configure JWT authentication
✅ Test basic CRUD operations
✅ Verify OpenAPI spec generation
✅ Set up Swagger UI debug page
```

### **Phase 2: Core Feature Migration (Week 3-4)**

#### **Authentication System**
```typescript
// Implement Discord OAuth + JWT flow
✅ Discord OAuth 2.0 integration
✅ JWT token generation for PostgREST
✅ Valkey session storage
✅ Maintain existing UI flows with new backend
```

#### **Item Listing System**
```typescript
// Migrate current listing logic to PostgreSQL
✅ Port price display logic (keep existing functions)
✅ Integrate BAML processing for descriptions
✅ Connect to PostgREST for data persistence
✅ Maintain current UI components
```

#### **Search and Filtering**
```sql
-- Upgrade current SQLite search to PostgreSQL full-text
✅ Implement PostgreSQL full-text search indexes
✅ Port current filtering logic to PostgREST queries
✅ Maintain sub-2s search performance requirements
✅ Keep existing Svelte search components
```

### **Phase 3: Advanced Features (Week 5-6)**

#### **BAML Integration**
```typescript
// Add AI processing for item descriptions
✅ Implement BAML processing pipeline
✅ Extract enchantments, attributes, categories
✅ Store structured data in PostgreSQL JSONB fields
✅ Enhance search with extracted metadata
```

#### **Evidence and File Upload System**
```typescript
// Implement community reporting with evidence
✅ Secure file upload with UUID naming
✅ Evidence confidence scoring algorithm
✅ Auto-approval business logic
✅ File serving with access control
```

#### **Discord Notifications**
```typescript
// Implement webhook notification system
✅ PostgreSQL triggers for report events
✅ Discord webhook delivery with retry logic
✅ Shop owner notification workflow
✅ Notification preferences management
```

### **Phase 4: Quality and Performance (Week 7-8)**

#### **Testing Integration**
```typescript
// Ensure existing test suite covers new backend
✅ Port existing tests to PostgreSQL/PostgREST
✅ Add integration tests for new features
✅ Performance testing for search and API responses
✅ Security testing for authentication and RLS
```

#### **Production Readiness**
```bash
# Deployment and monitoring setup
✅ Production container configuration
✅ Database backup and recovery procedures
✅ Performance monitoring and alerting
✅ Security hardening and rate limiting
```

---

## 3. Migration Strategy Details

### **Database Migration Approach**

#### **Schema Translation Pattern**
```sql
-- Current SQLite → Target PostgreSQL
INTEGER PRIMARY KEY → uuid PRIMARY KEY DEFAULT gen_random_uuid()
TEXT → text with proper constraints
BLOB → bytea or file references
JSON → jsonb for better indexing
-- Add ENUM types for structured data
-- Add full-text search indexes
-- Add Row Level Security policies
```

#### **Data Preservation Strategy**
```typescript
// Export current SQLite data
const exportData = await sqlite.all("SELECT * FROM items");

// Transform for PostgreSQL
const transformedData = exportData.map(item => ({
  ...item,
  id: crypto.randomUUID(), // Convert to UUID
  price_diamond_blocks: item.price, // Rename fields
  trading_unit: 'per_item', // Add new required fields
}));

// Import to PostgreSQL via PostgREST
await fetch('/api/items', {
  method: 'POST',
  body: JSON.stringify(transformedData)
});
```

### **API Integration Pattern**

#### **Replace Database Calls**
```typescript
// Before (SQLite)
const items = await db.all(
  "SELECT * FROM items WHERE category = ? AND price < ?",
  [category, maxPrice]
);

// After (PostgREST)
const response = await fetch(
  `/api/items?category=eq.${category}&price_diamond_blocks=lt.${maxPrice}`,
  { headers: { Authorization: `Bearer ${jwt}` }}
);
const items = await response.json();
```

#### **Maintain UI Components**
```svelte
<!-- Keep existing Svelte components -->
<!-- Update only the data fetching layer -->
<script>
  import { formatPrice } from '$lib/price-display'; // ✅ Keep existing
  
  // ❌ Remove SQLite calls
  // ✅ Add PostgREST calls
  async function loadItems() {
    const response = await fetch('/api/items', {
      headers: { Authorization: `Bearer ${$jwt}` }
    });
    return response.json();
  }
</script>

<!-- ✅ Keep existing UI components unchanged -->
{#each items as item}
  <div class="item">
    <h3>{item.name}</h3>
    <p>{formatPrice(item.price_diamond_blocks, item.trading_unit)}</p>
  </div>
{/each}
```

### **BAML Integration Strategy**

#### **Processing Pipeline**
```typescript
// New item listing workflow
export async function createListing(formData: ItemFormData) {
  // 1. Process description with BAML
  const bamlResult = await baml.processDescription(formData.description);
  
  // 2. Create item with enhanced metadata
  const item = {
    ...formData,
    processed_description: bamlResult.standardizedDescription,
    enchantments: bamlResult.enchantments,
    item_attributes: bamlResult.attributes,
    category: bamlResult.suggestedCategory || formData.category
  };
  
  // 3. Store via PostgREST
  const response = await fetch('/api/items', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(item)
  });
  
  return response.json();
}
```

### **Swagger UI Debug Integration**

#### **Development Workflow**
```typescript
// Automatic API documentation
// PostgREST generates OpenAPI spec from PostgreSQL schema
// Swagger UI serves interactive docs at localhost:3002

// Developers can:
// 1. Explore all database tables as REST endpoints
// 2. Test authentication with JWT tokens
// 3. Validate API calls before implementing in frontend
// 4. See real-time schema updates as database evolves
```

---

## 4. Success Metrics

### **Migration Validation Criteria**

#### **Functional Parity**
- [ ] All current features work with new backend
- [ ] Price display logic maintains exact same output
- [ ] Search performance meets <2s requirement
- [ ] File upload and download functionality working

#### **Architecture Compliance**
- [ ] PostgreSQL database with proper schema
- [ ] PostgREST API with OpenAPI documentation
- [ ] Discord OAuth authentication functional
- [ ] BAML processing enhances item listings
- [ ] Swagger UI provides usable debug interface

#### **Quality Maintenance**
- [ ] All existing tests pass with new backend
- [ ] No regression in user experience
- [ ] Performance equal or better than current implementation
- [ ] Security improved with RLS and JWT authentication

---

## 5. Risk Mitigation

### **Data Migration Risks**
- **Backup Strategy**: Full SQLite export before migration
- **Validation**: Compare data integrity before/after migration
- **Rollback Plan**: Keep SQLite implementation until PostgreSQL proven stable

### **Feature Regression Risks**
- **Test Coverage**: Comprehensive test suite validates functionality
- **UI Preservation**: Keep existing Svelte components to minimize UI changes
- **Gradual Migration**: Phase-by-phase approach allows testing at each step

### **Performance Risks**
- **Monitoring**: Implement performance tracking during migration
- **Indexing**: Proper PostgreSQL indexes for search performance
- **Caching**: Valkey integration for session and query caching

---

*This strategy leverages the strong foundation of the current implementation while systematically upgrading to the specification-compliant architecture. The phased approach minimizes risk while ensuring all valuable existing work is preserved and enhanced.*