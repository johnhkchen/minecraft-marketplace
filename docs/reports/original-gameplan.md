# Minecraft Marketplace - Implementation Gameplan

> **Purpose**: Tactical implementation strategy and development roadmap  
> **Audience**: Development team executing the greenfield implementation  
> **Reference**: Technical requirements defined in [`specs/MINECRAFT_MARKETPLACE_SPEC.md`](./specs/MINECRAFT_MARKETPLACE_SPEC.md)

---

## 🎯 **Implementation Overview**

### **Current Status** ✅
- **✅ COMPLETED**: Foundation architecture (TypeScript monorepo, Docker orchestration, nginx proxy)
- **✅ COMPLETED**: Fresh install guarantee (`docker compose up` works on port 2888)
- **✅ COMPLETED**: Container orchestration (nginx + frontend + backend + database + valkey)
- **✅ COMPLETED**: PostgREST API with Minecraft marketplace data (filtering, search, sorting working)
- **✅ COMPLETED**: Core business logic (pricing service with 20 passing unit tests)
- **✅ COMPLETED**: Database schema with RLS policies and realistic test data
- **🎯 CURRENT**: Need to complete minimal throughline per spec requirements

### **⚠️ SPEC COMPLIANCE GAP ANALYSIS** 📋
Based on comprehensive spec review, we're missing critical components for Definition of Done:

**🚨 CRITICAL MISSING:**
1. **Astro SSR Frontend** - No web interface for users to search items
2. **Human-Readable Price Display** - "5 diamonds per item" logic not implemented in UI
3. **Comprehensive Testing (>80% coverage)** - Only unit tests exist, missing integration/E2E
4. **Automated Validation Gates** - Missing `npm run test:e2e`, `npm run test:integration`
5. **Swagger UI Documentation** - `/docs` endpoint not implemented
6. **Astro Secure Routes** - `/api/internal/*`, `/api/auth/*` routes missing

**✅ WHAT'S WORKING:**
- PostgREST API with filtering, search, sorting (`/api/data/public_items`)
- Database schema with RLS policies and realistic Minecraft data
- Pricing service business logic with TDD validation
- Fresh install guarantee and Docker orchestration

### **REVISED IMPLEMENTATION PRIORITY** 🎯
**Spec Requirements**: Epic 1 (Price Discovery) + Definition of Done + No Manual Verification

**Phase 1: Astro Frontend Implementation (CRITICAL)**
1. **Search Interface** - Astro SSR page with Svelte components for item search
2. **Human-Readable Pricing** - Display "5 diamonds per item" using our pricing service
3. **Category/Server Filtering** - UI for PostgREST filtering with <500ms response
4. **Price Comparison** - Side-by-side pricing across different shops

**Phase 2: Comprehensive Testing Suite (DEFINITION OF DONE)**
5. **Faker Data Generators** - Realistic Minecraft items/enchantments/pricing scenarios
6. **Integration Tests** - Database interactions, API endpoints, service integrations
7. **Playwright E2E Tests** - Complete user workflows and regression prevention
8. **Automated Validation** - `npm run test:e2e`, `npm run test:integration`, >80% coverage

**Phase 3: Architecture Completion (SYSTEM INTEGRATION)**
9. **Swagger UI Documentation** - `/docs` endpoint with PostgREST OpenAPI
10. **Astro Secure Routes** - `/api/internal/*` for shop management integration
11. **Astro + Hono Integration** - Demonstrate seamless backend communication

### **Target Deployment**
- **Scale**: Micro-server for 5-10 persistent users
- **Architecture**: Greenfield implementation using existing codebase as reference only
- **Quality Focus**: SOLID principles, TDD, comprehensive testing, maintainable code

### **Technology Decisions**
- **Testing Stack**: Vitest + Faker (Minecraft data) + Playwright
- **Code Quality**: SOLID principles, dependency injection, TDD methodology
- **Deployment**: Single Docker Compose stack with `docker compose up` fresh install (✅ WORKING)

---

## 🏗️ **Foundation-First Order of Attack**

> **Philosophy**: Build architectural foundation before features to prevent spaghetti code  
> **Approach**: Contracts → Data Layer → Services → API Layer → Features

### **Phase 0: Architectural Foundation (Week 1) - CRITICAL** ✅ COMPLETED

#### **✅ COMPLETED: Infrastructure & Deployment Foundation**
- **✅ TypeScript Monorepo**: Proper project references and shared module
- **✅ Docker Orchestration**: All services containerized and orchestrated
- **✅ nginx Reverse Proxy**: Single entry point on port 2888
- **✅ Fresh Install**: `docker compose up` works from clean state
- **✅ Service Health**: All containers healthy and communicating

#### **🎯 CURRENT: Minimal Feature Implementation**
Following our identified throughline - "Item Listing with Price Discovery":

#### **✅ COMPLETED: Core Abstractions & Interfaces**
- **✅ Domain Contracts**: Complete service interfaces in shared/types/service-interfaces.ts
  - ItemRepository, PriceRepository, PricingService with full CRUD and search capabilities
  - 20+ interface definitions covering all business entities and operations
- **✅ API Contracts**: Request/response types for item listing, search, pricing, reporting
- **✅ Domain Entities**: Item, Price, User, CommunityReport, Evidence with full typing
- **✅ Business Rules**: Trading unit enums, confidence levels, user roles, item categories

**✅ Architecture Checkpoint**: All contracts defined, TypeScript compiles successfully.

#### **✅ COMPLETED: Dependency Injection Container**
- **✅ Service Container**: Full implementation in shared/di/container.ts with lifecycle management
- **✅ Registration Patterns**: Singleton pattern, circular dependency detection, service graph resolution
- **✅ Lifecycle Management**: Container tested with 12 passing unit tests

**✅ Architecture Checkpoint**: Container working, all DI tests passing.

#### **✅ COMPLETED: Database Schema & PostgREST**
- **✅ Complete Schema**: Items, Prices, Users, Reports, Evidence tables with constraints
  ```sql
  001_initial_tables.sql    # All core tables with proper relationships
  002_row_level_security.sql # RLS policies with JWT integration
  003_test_data.sql        # 12 realistic Minecraft items with pricing
  ```
- **✅ PostgREST Integration**: Auto-generated API working with filtering, search, sorting
- **✅ Test Data**: Diamond swords, netherite gear, building blocks with realistic pricing
- **✅ Public Views**: Clean API with owner info and current pricing data

**✅ Architecture Checkpoint**: PostgREST API functional, test data accessible via HTTP.

**✅ VALIDATION GATE RESULTS**: 
```bash
✅ docker:fresh-install         # Fresh install works on port 2888
✅ postgrest:api-functional     # PostgREST API with filtering/search/sorting
✅ test:unit:pricing-service    # 20 passing unit tests for business logic
✅ test:unit:di-container       # 12 passing DI container tests  
✅ db:schema-working           # Database schema with RLS policies functional
✅ db:test-data-loaded         # 12 realistic Minecraft items with pricing
```

**🚨 NEXT VALIDATION GATE**: Must implement before calling minimal feature "done":
```bash
❌ npm run test:e2e             # Playwright E2E workflows (MISSING)
❌ npm run test:integration     # Database and API integration tests (MISSING)  
❌ npm run test:coverage        # >80% code coverage validation (MISSING)
❌ npm run frontend:search      # Astro search interface functional (MISSING)
❌ npm run frontend:pricing     # Human-readable price display (MISSING)
```

### **🎯 CURRENT PHASE: Frontend Implementation** 

Based on spec compliance gap analysis, we must prioritize:

#### **🚨 NEXT: Astro SSR Frontend (CRITICAL FOR EPIC 1)**
- [ ] **Search Interface**: Astro SSR page with Svelte components
  ```typescript
  // frontend/src/pages/index.astro - Main search interface
  // frontend/src/components/ItemSearch.svelte - Search component
  // frontend/src/components/PriceDisplay.svelte - Human-readable pricing
  ```
- [ ] **Human-Readable Pricing**: Implement "5 diamonds per item" display logic
- [ ] **Category Filtering**: UI for PostgREST filtering with <500ms response
- [ ] **Price Comparison**: Display pricing across different shops

**Architecture Checkpoint**: Users can search items via web interface with human-readable pricing.

#### **✅ COMPLETED: Repository & Service Layer**
- **✅ PostgreSQL Repositories**: Full ItemRepository and PriceRepository implementations
- **✅ Pricing Service**: Business logic with diamond block conversions and validation
- **✅ Service Integration**: All business logic tested and working
- **✅ PostgREST API**: Auto-generated endpoints with filtering, search, and sorting

**✅ Architecture Checkpoint**: All backend services functional, API responding correctly.

**⚠️ VALIDATION GATE**: 
```bash
npm run test:unit:repositories  # All repository unit tests pass
npm run test:integration:db     # Database integration tests pass
npm run db:test-crud           # All CRUD operations work via automated tests
```

#### **Day 3-4: Core Business Services** ⚠️ BUSINESS LOGIC
- [ ] **Service Implementations**: Build on repository foundation
  ```typescript
  // backend/src/services/
  class PricingService {
    constructor(private currencyConverter: CurrencyConverter) {}
    calculatePrice(item: Item, unit: TradingUnit): Price {
      // Pure business logic, no HTTP/database concerns
    }
  }
  ```
- [ ] **Service Unit Tests**: Mock all dependencies, test business rules
- [ ] **Validation Logic**: Input sanitization and business rule enforcement
- [ ] **Error Handling**: Business exceptions and error types

**Architecture Checkpoint**: Business logic tests pass with mock repositories, rules validated.

**⚠️ VALIDATION GATE**:
```bash
npm run test:unit:services      # All service unit tests pass with mocked dependencies
npm run test:business-rules     # Business validation rules work correctly
npm run test:error-handling     # Error scenarios handled properly
```

#### **Day 5: Service Registration & DI Wiring** ⚠️ ASSEMBLY
- [ ] **Service Graph**: Wire all dependencies together
  ```typescript
  // Infrastructure layer - assemble the application
  container.register('userRepository', () => new PostgreSQLUserRepository(db));
  container.register('pricingService', () => new PricingService(
    container.get('currencyConverter')
  ));
  ```
- [ ] **Circular Dependency Detection**: Validate service graph is acyclic
- [ ] **Integration Tests**: Services work together through container
- [ ] **Configuration Management**: Environment-specific service configuration

**Architecture Checkpoint**: Service graph resolves, no circular dependencies, integration tests pass.

**⚠️ VALIDATION GATE**:
```bash
npm run test:di-container       # Service graph resolves without circular dependencies
npm run test:integration:full   # All services work together via DI container
npm run test:configuration      # Environment-specific service configuration works
```

### **Phase 2: API Layer Foundation (Week 3)**

#### **Day 1-2: PostgREST Configuration** ⚠️ SCHEMA VALIDATION
- [ ] **PostgREST Setup**: Auto-generated API from schema
  ```yaml
  # Validates database schema design
  postgrest:
    db-uri: "postgres://..."
    db-schemas: "public"
    jwt-secret: "${JWT_SECRET}"
  ```
- [ ] **RLS Policy Testing**: Verify security policies work
- [ ] **API Documentation**: Swagger UI auto-generation
- [ ] **JWT Integration**: Token validation for API access

**Architecture Checkpoint**: Auto-generated API works, RLS policies enforce security.

**⚠️ VALIDATION GATE**:
```bash
npm run test:postgrest          # PostgREST API endpoints respond correctly
npm run test:rls-policies       # Row Level Security policies enforce access control
npm run test:jwt-validation     # JWT tokens work with PostgREST
npm run test:api-docs           # Swagger UI generates from schema
```

#### **Day 3-4: Astro Secure Routes** ⚠️ SECURE OPERATIONS
- [ ] **Secure API Routes**: Build on validated service layer
  ```typescript
  // frontend/src/pages/api/ - Use injected services
  export async function POST({ request }: APIRoute) {
    const service = container.get<ItemService>('itemService');
    return service.createItem(await request.json());
  }
  ```
- [ ] **Authentication Middleware**: Session validation and user context
- [ ] **File Upload Security**: Evidence handling with proper validation
- [ ] **Error Handling**: Consistent API error responses

**Architecture Checkpoint**: Secure routes use services, authentication works, file uploads secure.

**⚠️ VALIDATION GATE**:
```bash
npm run test:astro-routes       # All Astro API routes respond correctly
npm run test:authentication     # Authentication middleware works
npm run test:file-uploads       # File upload security and validation work
npm run test:api-errors         # Error handling returns consistent responses
```

#### **Day 5: Hono External Integration Setup** ⚠️ SERVICE SEPARATION
- [ ] **Hono Application**: External integrations as separate service
  ```typescript
  // backend/src/routes/ - External integrations only
  const app = new Hono();
  app.use('*', authMiddleware);
  app.post('/webhooks/discord', discordWebhookHandler);
  ```
- [ ] **Service Communication**: Astro ↔ Hono communication patterns
- [ ] **Webhook Handling**: Discord, BAML, external service integration
- [ ] **Load Balancing**: nginx configuration for service routing

**Architecture Checkpoint**: Service separation working, external integrations isolated.

**⚠️ VALIDATION GATE**:
```bash
npm run test:hono-routes        # Hono external API routes work
npm run test:service-separation # Astro ↔ Hono communication works
npm run test:webhooks           # Webhook handling works correctly
npm run docker:full-stack       # Complete container stack integration test
```

### **Phase 3: Feature Implementation (Weeks 4-6)**

#### **Week 4: Authentication & Session Foundation**
- [ ] **Discord OAuth**: Astro secure routes → JWT → Valkey sessions
- [ ] **User Management**: Built on established service patterns
- [ ] **Authorization Middleware**: Role-based access control
- [ ] **Session Persistence**: Valkey integration with proper TTL

**Architecture Checkpoint**: Authentication end-to-end, sessions persist, roles enforced.

**⚠️ VALIDATION GATE**:
```bash
npm run test:discord-oauth      # Discord OAuth flow works end-to-end
npm run test:session-management # Sessions persist and validate correctly
npm run test:authorization      # Role-based access control works
npm run test:e2e:auth          # Complete authentication user workflow (Playwright)
```

#### **Week 5: Core Business Features**
- [ ] **Item CRUD**: Using established service injection patterns
- [ ] **Pricing System**: Diamond block conversions, trading units
- [ ] **Search Implementation**: PostgreSQL full-text on validated schema
- [ ] **Business Logic Tests**: Comprehensive coverage using DI mocks

**Architecture Checkpoint**: Core features work, business logic well-tested, performance meets requirements.

**⚠️ VALIDATION GATE**:
```bash
npm run test:item-crud          # Item creation, editing, deletion work
npm run test:pricing-system     # Diamond block pricing and trading units work
npm run test:search-performance # Search responds in <2s with test data
npm run test:e2e:marketplace   # Complete marketplace workflow (Playwright)
```

#### **Week 6: External Integrations**
- [ ] **BAML Integration**: Through Hono service layer, isolated from Astro
- [ ] **Evidence Upload**: Astro secure routes with established file patterns
- [ ] **Discord Notifications**: Webhook patterns with queue handling
- [ ] **Integration Tests**: External services without coupling main application

**Architecture Checkpoint**: External services integrated, main application remains decoupled.

**⚠️ VALIDATION GATE**:
```bash
npm run test:baml-integration   # BAML AI processing works via Hono
npm run test:evidence-upload    # Evidence upload and storage work securely
npm run test:discord-webhooks   # Discord notifications deliver reliably
npm run test:e2e:community     # Complete community reporting workflow (Playwright)
```

### **Phase 4: Production Ready & Quality Assurance (Weeks 7-8)**

#### **Week 7: Testing & Code Quality** ⚠️ VALIDATION
- [ ] **Comprehensive Test Suite**: Easy because of dependency injection
  - Unit tests for all services (mocked dependencies)
  - Integration tests against real database
  - Faker with real Minecraft data scenarios
- [ ] **End-to-End Testing**: Complete workflows with Playwright
- [ ] **Code Quality Audit**: SOLID principles implementation review
- [ ] **Performance Benchmarking**: <2s search, <500ms filtering validation

**Architecture Checkpoint**: >80% test coverage, all architectural principles validated.

**⚠️ VALIDATION GATE**:
```bash
npm run test:coverage           # >80% code coverage achieved
npm run test:all               # All unit, integration, E2E tests pass
npm run test:performance       # All performance benchmarks met
npm run test:solid-principles  # Architecture validation passes
```

#### **Week 8: Production Deployment** ⚠️ HARDENING
- [ ] **Security Hardening**: Rate limiting, RLS validation, security headers
- [ ] **Performance Optimization**: Query optimization, caching strategies
- [ ] **Production Deployment**: SSL configuration, monitoring setup
- [ ] **Tech Debt Avoidance**: Fresh install validation, documentation completeness

**Architecture Checkpoint**: Production-ready deployment, all quality gates passed.

**🎯 FINAL VALIDATION GATE**:
```bash
npm run docker:fresh-install    # `docker compose up` works from clean state
npm run test:smoke             # Critical paths work in production environment
npm run test:security          # Security hardening verified
npm run test:performance:prod  # Production performance requirements met
npm run test:tech-debt-avoided # All tech debt avoidance guarantees verified
```

**🚨 DEPLOYMENT CRITERIA**: All automated validations must pass. No manual verification allowed.

---

## 🔧 **Technical Implementation Decisions**

### **Service Architecture Patterns**

#### **Dependency Injection Container**
```typescript
// shared/di/container.ts
class ServiceContainer {
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();
  
  register<T>(key: string, factory: () => T): void
  get<T>(key: string): T
}
```

#### **Repository Pattern with Interfaces**
```typescript
interface StorageRepository<T> {
  save(entity: T): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(criteria?: Partial<T>): Promise<T[]>;
}
```

### **Testing Strategy Implementation**

#### **Faker Configuration for Minecraft Data**
```typescript
// tests/fixtures/minecraft-faker.ts
const MINECRAFT_ITEMS = ['diamond_sword', 'netherite_helmet', 'shulker_box'];
const ENCHANTMENTS = { 'sharpness': { maxLevel: 5 }, 'mending': { maxLevel: 1 } };
const TRADING_UNITS = ['per_item', 'per_stack', 'per_shulker', 'per_dozen'];
```

#### **Test Organization Structure**
```
tests/
├── unit/          # Vitest - Pure logic tests
├── integration/   # Vitest - Service interaction tests  
├── e2e/          # Playwright - Complete workflows
└── fixtures/     # Faker + Minecraft data factories
```

### **Code Quality Standards**

#### **SOLID Principles Implementation**
- **Single Responsibility**: Each service handles one business concern
- **Open/Closed**: Extensible notification providers, storage implementations
- **Liskov Substitution**: Repository interfaces are fully interchangeable
- **Interface Segregation**: Small, focused interfaces for each service
- **Dependency Inversion**: High-level modules depend on abstractions

#### **TDD Methodology**
1. **Red**: Write failing test first
2. **Green**: Implement minimal code to pass
3. **Refactor**: Improve code quality without changing behavior

---

## 🎯 **Key Success Metrics**

### **Development Quality**
- [ ] **Test Coverage**: >80% across unit, integration, e2e tests
- [ ] **Performance**: <2s search, <500ms filtering, <200ms API responses
- [ ] **Code Quality**: SOLID principles implemented, dependency injection working
- [ ] **Fresh Install**: `docker compose up` works without manual configuration

### **Feature Completeness**
- [ ] **Authentication**: Discord OAuth with session management
- [ ] **Item Management**: Full CRUD with AI-enhanced descriptions
- [ ] **Community Features**: Reporting with evidence and confidence scoring
- [ ] **Notifications**: Discord webhooks with reliable delivery

### **Production Readiness**
- [ ] **Security**: RLS policies, rate limiting, file upload security
- [ ] **Documentation**: Complete setup instructions, API documentation
- [ ] **Monitoring**: Health checks, error tracking, performance metrics
- [ ] **Deployment**: Standard Docker deployment on any platform

---

## 📚 **Reference Materials from Existing Codebase**

### **Cherry-Pick Targets**
- **Price Display Logic**: `src/lib/price-display.ts` → Human-readable formatting patterns
- **Svelte Components**: Well-structured UI components for marketplace browsing
- **Business Logic**: Currency conversions, trading unit calculations
- **Test Patterns**: 152 existing tests as reference for comprehensive coverage
- **TypeScript Configs**: Strict mode and quality tooling approach

### **Implementation Notes**
- **Use as Reference Only**: Don't migrate code directly, implement fresh with better architecture
- **Extract Business Rules**: Core pricing logic, validation rules, data relationships
- **Preserve User Experience**: UI patterns, interaction flows, visual design concepts
- **Maintain Test Quality**: Same level of comprehensive testing, better organization

---

## ⚠️ **CRITICAL SUCCESS FACTORS**

### **Why Foundation-First Order Matters**

1. **Interfaces Before Implementations** → No refactoring when requirements change
2. **Schema Before Services** → Database validates business rules, not code
3. **Services Before Routes** → Business logic separate from HTTP concerns  
4. **Tests Alongside Code** → Easy because of dependency injection patterns

### **Architecture Checkpoints Are Non-Negotiable**

Each checkpoint validates the foundation before building on top:
- **Week 1**: All contracts defined, no spaghetti dependencies
- **Week 2**: Data layer solid, services properly isolated  
- **Week 3**: API layer uses services, security enforced at database level
- **Week 4+**: Features built on validated foundation, tests comprehensive

### **Quality Gates Prevent Technical Debt**

- **SOLID Principles**: Enforced by architecture, not added later
- **Dependency Injection**: Built into foundation, not retrofitted
- **Test Coverage**: Easy because of clean architecture
- **Performance**: Optimized from database design up

### **Foundation Payoff**

With proper foundation:
- **Adding Features**: Service + Route + Test (simple pattern)
- **Changing Requirements**: Modify interface, implementations adapt
- **Testing**: Mock dependencies easily, isolated business logic
- **Scaling**: Services can be extracted to separate containers

**Bottom Line**: Spend Week 1 on architecture foundation. Everything else becomes easy.

---

*This foundation-first gameplan prevents spaghetti code by building architectural contracts before implementations. The planned architecture becomes the actual architecture.*