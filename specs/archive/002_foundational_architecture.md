# Foundational Architecture & User Flows

> **Purpose**: Define core user journeys, data patterns, and update mechanisms before implementation  
> **Audience**: Wh1rledPeas (backend) + Lead dev (frontend) - foundational decisions

---

## Core User Flow Definitions

### 1. **Anonymous Browser Flow** (Primary Entry Point)
```
Landing Page → Browse Items → View Item Details → Contact Seller
└─ No auth required, fastest path to value
```

**Critical Decisions**:
- **Where does data come from?** Static generation vs API calls vs hybrid
- **How fresh is the data?** Real-time, cached, or periodic updates
- **Mobile performance?** How do we ensure <2s loads on slow connections

**Data Requirements**:
- Item list with price, seller, stock status
- PostgreSQL full-text search with GIN indexing
- Cached content with smart invalidation for speed

### 2. **Shop Owner Management Flow**
```
Register → Verify → Dashboard → Add/Edit Items → Manage Reports
└─ Authentication required, full CRUD operations
```

**Critical Decisions**:
- **Authentication pattern?** Sessions vs JWT, where stored
- **Authorization scope?** Can owners edit others' items, see all reports
- **Data validation?** Client-side vs server-side, real-time feedback

**Data Requirements**:
- User state management across sessions
- Item ownership validation
- Form state persistence (draft items, bulk operations)

### 3. **Community Reporting Flow**
```
Browse → Find Issue → Report → [Owner Notified] → Resolution
└─ Minimal friction, anonymous or light auth
```

**Critical Decisions (proper implementation)**:
- **Report storage?** Immediate DB write with transaction safety
- **Notification system?** Email + Discord webhook with async queue
- **Evidence handling?** File uploads + external links (proper storage system)

**Data Requirements**:
- Report tracking and status updates
- Link reports to items and users
- Evidence storage and retrieval

---

## Data Architecture by Sector

### Sector A: Item Data & Pricing System

> **Reference**: Complete pricing system architecture defined in `000_consolidated_specification.md`

**Core Challenge**: Multi-unit price entry with normalization

**Key Design Decision**: Separate `item_prices` table for clean relational design instead of embedded price data.

**Deliverables**:
- [ ] **Price conversion system** using relational `item_prices` table
- [ ] **Smart price entry components** with real-time conversion display
- [ ] **Price display components** with historical price support
- [ ] **Currency conversion API** with proper rate management

**Implementation Notes**:
- Use consolidated TypeScript interfaces for consistency
- PostgreSQL ENUMs for type safety at database level
- Proper foreign key relationships for data integrity

### Sector B: User Authentication & State Management

> **Reference**: Complete authentication system defined in `000_consolidated_specification.md`

**Core Challenge**: Simple auth that scales to community features

**Key Design Decisions**: 
- Role-based authentication with extensible permissions array
- HTTP-only cookies for session security
- PostgreSQL ENUMs for type safety

**Deliverables**:
- [ ] **Registration/login system** using consolidated interfaces
- [ ] **Session management** with HTTP-only cookies
- [ ] **Role-based authorization** middleware
- [ ] **Permission system** supporting future feature extensions

**Implementation Notes**:
- Use consolidated `UserSession` and `AuthState` interfaces
- Leverage PostgreSQL `user_role` ENUM for database consistency
- Implement extensible permissions for future community features

### Sector C: Community Reporting & Updates

> **Reference**: Complete reporting system architecture in `000_consolidated_specification.md`

**Core Challenge**: Low-friction reporting with owner notification

**Key Design Decisions**: 
- Separate `report_evidence` table for clean evidence handling
- `report_price_changes` table for structured price change data
- PostgreSQL ENUMs for type safety and consistency

**Deliverables**:
- [ ] **Report submission system** using normalized database design
- [ ] **Evidence upload system** with proper file management
- [ ] **Notification system** with pluggable providers (email, Discord)
- [ ] **Report review workflow** for shop owners and admins

**Implementation Standards**:
- Use consolidated interfaces for `CommunityReport` and evidence handling
- Leverage relational design for better query performance and data integrity
- Implement clean separation between report data and evidence data

---

## Update Mechanisms & Data Flow

### Real-time vs Eventual Consistency

**Philosophy**: Alpha prioritizes simplicity over real-time features

```
┌─ Anonymous Browse ─┐    ┌─ Shop Owner Edits ─┐    ┌─ Community Reports ─┐
│ • Static/cached    │    │ • Immediate writes  │    │ • Async processing   │
│ • 5-minute refresh │    │ • Real-time preview │    │ • Batched notifications│
│ • Fast loading     │    │ • Form validation   │    │ • Eventually consistent│
└───────────────────┘    └────────────────────┘    └─────────────────────┘
            │                        │                         │
            └────────── Periodic Rebuild ←─────── Update Events
```

**Implementation Strategy**:
1. **Browse experience**: Pre-generated or cached, rebuilt on item changes
2. **Owner dashboard**: Real-time for editing, immediate feedback
3. **Community reports**: Async processing, notification queues

### Data Consistency Patterns

**Item Updates**:
```typescript
// SINGLE SOURCE OF TRUTH
async function updateItem(itemId: number, changes: Partial<Item>) {
  // 1. Validate changes (owner permissions, data format)
  const validation = await validateItemUpdate(itemId, changes);
  if (!validation.valid) throw new Error(validation.error);
  
  // 2. Write to database (atomic transaction)
  const updated = await db.transaction(async (tx) => {
    const item = await tx.updateItem(itemId, changes);
    await tx.logItemChange(itemId, changes, userId);
    return item;
  });
  
  // 3. Trigger cache invalidation/rebuild
  await invalidateItemCache(itemId);
  
  // 4. Send notifications (async, can fail gracefully)
  queueNotification({
    type: 'item_updated',
    item_id: itemId,
    changes: changes
  });
  
  return updated;
}
```

**Report Processing**:
```typescript
// ASYNC PROCESSING PIPELINE
async function processReport(report: CommunityReport) {
  // 1. Basic validation
  const isValid = await validateReport(report);
  if (!isValid) return reject(report, 'Invalid data');
  
  // 2. Confidence scoring
  const confidence = calculateReportConfidence(report);
  
  // 3. Auto-approval logic
  if (confidence > 0.8) {
    return await autoApproveReport(report);
  }
  
  // 4. Queue for manual review
  await queueForReview(report);
  
  // 5. Notify shop owner
  await notifyShopOwner(report.item_id, report);
}
```

---

## Foundational Deliverables by Priority

### Week 1: Core Data Foundations
**Wh1rledPeas Priority**:
- [ ] **Database schema implementation** (users, items, price_reports tables)
- [ ] **Price conversion system** (PriceConverter class, validation)
- [ ] **Basic API structure** (items CRUD, authentication endpoints)
- [ ] **Session management** (login/logout, middleware)

**Lead Dev Priority**:
- [ ] **Repository structure** (component organization, routing)
- [ ] **Basic UI components** (item cards, price display, forms)
- [ ] **Authentication context** (login state, protected routes)
- [ ] **Mobile-first layouts** (responsive item listing)

### Week 2: User Flow Integration
**Joint Priority**:
- [ ] **Complete anonymous browse flow** (landing → browse → item detail)
- [ ] **Shop owner registration/login** (form → validation → dashboard)
- [ ] **Item management flow** (add item → price entry → preview → save)
- [ ] **Basic search/filtering** (name search, category filter)

### Week 3: Community Features
**Backend Priority**:
- [ ] **Report submission API** (validation, storage, notification queues)
- [ ] **Shop owner notification system** (Discord webhook integration)
- [ ] **Report review endpoints** (admin approval/rejection)

**Frontend Priority**:
- [ ] **Report submission form** (evidence upload, multi-step flow)
- [ ] **Shop owner dashboard** (pending reports, item status)
- [ ] **Admin review interface** (report queue, batch actions)

---

## Critical Architecture Decisions Needed

### 1. Backend Framework Choice (Wh1rledPeas Decision)
**Question**: Astro API routes vs separate Express/Fastify server?
**Impacts**: Development velocity, real-time features, deployment complexity
**Deadline**: Week 1, Day 1

### 2. File Upload & Storage Strategy
**Question**: Local storage vs cloud storage for uploaded evidence?
**Decision Needed**: Week 1, Day 3
**Approach**: Start with secure local storage, design for easy cloud migration
**Implementation**: Proper file validation, access control, organized directory structure

### 3. Notification System Architecture
**Question**: Email service integration vs Discord-only vs both?
**Decision Needed**: Week 2, Day 1  
**Approach**: Async queue system supporting multiple delivery methods
**Implementation**: Pluggable notification providers (email, Discord, future: SMS, push)

### 4. Cache/Static Generation Strategy
**Question**: Full static generation vs ISR vs API-driven?
**Impacts**: Performance, data freshness, deployment pipeline
**Deadline**: Week 1, Day 2

---

## PostgreSQL + Docker Setup

> **Reference**: Complete Docker configuration, schema, and setup instructions in `000_consolidated_specification.md`

**Key Benefits**: Eliminates SQLite file permission issues, provides production parity, enterprise tooling, and clean development workflow with `docker compose down -v && docker compose up` for fresh database resets.

---

*This document defines the foundational patterns that all features will build upon. PostgreSQL + Docker eliminates SQLite file permission headaches while providing production-ready database foundations. Changes here affect the entire codebase - review carefully with Wh1rledPeas.*