# Minecraft Marketplace - Consolidated Technical Specification

> **Status**: Testing infrastructure complete ✅, core features needed
> **For Development**: Use `DEV_SPEC.md` for quick reference and implementation guidance
> **For Architecture**: This file contains complete technical details and schema

## Implementation Status (Current)

### ✅ COMPLETED FOUNDATIONS
- **Database Schema**: Complete PostgreSQL with 11+ tables, ENUMs, constraints
- **Testing Infrastructure**: Comprehensive Vitest setup (61 tests passing)
  - Unit tests: 22/22 passing, 85.87% coverage
  - Integration tests: 14/14 passing  
  - Security tests: 14/14 passing (zero SQL injection vulnerabilities)
  - Performance tests: 11/11 passing (queries 90%+ faster than targets)
- **Docker Environment**: PostgreSQL + Redis with health checks
- **TypeScript System**: Unified type definitions matching database schema
- **Core API Layer**: Items and market-data endpoints functional
- **Project Structure**: Clean organization with proper separation

### ❌ CRITICAL MISSING FEATURES
- **Authentication System**: No user registration/login/session management
- **Community Reporting**: No report submission, evidence handling, or notifications
- **Price Conversion Service**: Missing real-time multi-unit conversion display
- **File Upload System**: No secure evidence upload with access control
- **Mobile Responsiveness**: Not validated against <2s load time requirements

## Specification Hierarchy

**For Quick Development**: Use `DEV_SPEC.md` - compact, actionable implementation guide
**For Complete Architecture**: This file contains full technical specification
**Historical Context**: 
- `003_database_evaluation.md` - PostgreSQL choice rationale (decision complete)
- `SPRINT_PLAN.md` - 4-week roadmap (reference for priorities)

---

## Core Architecture Principles

### **Clean Implementation Standards**
- **Single Source of Truth**: Each concern has one authoritative definition
- **Elegant Abstractions**: Simple interfaces hiding complex implementation details  
- **Extensible Design**: Built to grow without architectural rewrites
- **Type Safety**: Full TypeScript throughout with proper validation
- **Production Mindset**: No "alpha shortcuts" - build it right once

---

## Database Architecture (PostgreSQL)

### **Consolidated Schema**
```sql
-- Users: Clean role-based system with extensible permissions
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Shop information (optional)
  shop_name VARCHAR(100),
  discord_contact VARCHAR(50),
  
  -- Access control
  role user_role NOT NULL DEFAULT 'user',
  permissions TEXT[] DEFAULT '{}', -- Extensible permissions for future features
  is_active BOOLEAN DEFAULT true,
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Define role enum for type safety
CREATE TYPE user_role AS ENUM ('user', 'shop_owner', 'admin');

-- Items: Clean relational pricing
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category item_category,
  
  -- Inventory
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  is_available BOOLEAN DEFAULT true,
  
  -- Ownership
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Item prices: Proper relational design
CREATE TABLE item_prices (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  
  -- Original user input
  amount DECIMAL(12,4) NOT NULL CHECK (amount > 0),
  currency_unit currency_unit NOT NULL,
  
  -- Normalized for comparisons (calculated on insert/update)
  diamond_equivalent DECIMAL(12,4) NOT NULL,
  
  -- Optional pricing notes
  notes VARCHAR(500),
  
  -- Price validity
  is_current BOOLEAN DEFAULT true,
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Item categories for organization
CREATE TYPE item_category AS ENUM (
  'blocks', 'items', 'tools', 'armor', 'food', 'redstone', 'decorative', 'other'
);

-- Community reports: Proper relational design
CREATE TABLE community_reports (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  
  -- Report details
  report_type report_type NOT NULL,
  description TEXT NOT NULL,
  
  -- Reporter information
  reporter_contact VARCHAR(100),
  reporter_ip INET,
  
  -- Workflow
  status report_status DEFAULT 'pending',
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report evidence: Separate normalized table
CREATE TABLE report_evidence (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL REFERENCES community_reports(id) ON DELETE CASCADE,
  
  -- Evidence type and details
  evidence_type evidence_type NOT NULL,
  description TEXT NOT NULL,
  
  -- File or URL reference
  file_id INTEGER REFERENCES uploaded_files(id),
  external_url VARCHAR(1000),
  
  -- Metadata
  confidence_level confidence_level DEFAULT 'medium',
  timestamp_captured TIMESTAMP WITH TIME ZONE,
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report suggested changes: Specific to report type
CREATE TABLE report_price_changes (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL REFERENCES community_reports(id) ON DELETE CASCADE,
  
  -- Current price (what reporter believes is wrong)
  current_amount DECIMAL(12,4),
  current_currency currency_unit,
  
  -- Suggested price (what reporter believes is correct)
  suggested_amount DECIMAL(12,4) NOT NULL,
  suggested_currency currency_unit NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report types
CREATE TYPE report_type AS ENUM (
  'price_change', 'out_of_stock', 'back_in_stock', 'shop_closed', 'incorrect_info'
);

-- Report statuses
CREATE TYPE report_status AS ENUM ('pending', 'approved', 'rejected', 'auto_approved');

-- File management: Secure and organized
CREATE TABLE uploaded_files (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE,
  
  -- File details
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0),
  
  -- Storage
  storage_path VARCHAR(500) NOT NULL,
  storage_provider VARCHAR(50) DEFAULT 'local',
  
  -- Access control
  uploaded_by INTEGER REFERENCES users(id),
  access_level file_access DEFAULT 'private',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- File access levels
CREATE TYPE file_access AS ENUM ('public', 'authenticated', 'private');

-- Currency units
CREATE TYPE currency_unit AS ENUM (
  'diamonds', 'diamond_blocks', 'emeralds', 'emerald_blocks', 'iron_ingots', 'iron_blocks'
);

-- Evidence types
CREATE TYPE evidence_type AS ENUM (
  'screenshot', 'transaction', 'shop_visit', 'external_link', 'word_of_mouth'
);

-- Confidence levels
CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low');

-- Performance indexes
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_available ON items(is_available) WHERE is_available = true;
CREATE INDEX idx_items_search ON items USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

CREATE INDEX idx_item_prices_item_id ON item_prices(item_id);
CREATE INDEX idx_item_prices_current ON item_prices(is_current) WHERE is_current = true;
CREATE INDEX idx_item_prices_diamond_equiv ON item_prices(diamond_equivalent);

CREATE INDEX idx_reports_item_id ON community_reports(item_id);
CREATE INDEX idx_reports_status ON community_reports(status);
CREATE INDEX idx_reports_created ON community_reports(created_at);

CREATE INDEX idx_report_evidence_report_id ON report_evidence(report_id);
CREATE INDEX idx_report_price_changes_report_id ON report_price_changes(report_id);

CREATE INDEX idx_files_uuid ON uploaded_files(uuid);
CREATE INDEX idx_files_uploader ON uploaded_files(uploaded_by);

-- Trade history: Track completed transactions for market analytics
CREATE TABLE trade_history (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  
  -- Trade participants (optional for privacy)
  buyer_id INTEGER REFERENCES users(id),
  seller_id INTEGER REFERENCES users(id),
  
  -- Trade details
  qty_traded INTEGER NOT NULL CHECK (qty_traded > 0),
  price_per_unit DECIMAL(12,4) NOT NULL CHECK (price_per_unit > 0),
  currency_unit currency_unit NOT NULL,
  total_value DECIMAL(12,4) NOT NULL CHECK (total_value > 0),
  diamond_equivalent_total DECIMAL(12,4) NOT NULL,
  
  -- Source and metadata
  trade_source VARCHAR(50) DEFAULT 'marketplace',
  notes TEXT,
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Market references: Aggregated market data for performance
CREATE TABLE market_references (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  
  -- Current market prices
  current_sell_low DECIMAL(12,4),
  current_sell_high DECIMAL(12,4),
  current_buy_high DECIMAL(12,4), 
  current_buy_low DECIMAL(12,4),
  
  -- Recent trade data
  last_trade_price DECIMAL(12,4),
  last_trade_date TIMESTAMP WITH TIME ZONE,
  
  -- Market volume and activity
  total_sell_volume INTEGER DEFAULT 0,
  total_buy_interest INTEGER DEFAULT 0,
  market_activity market_activity DEFAULT 'dead',
  
  -- Calculated metrics
  spread_percentage DECIMAL(8,2),
  active_sellers INTEGER DEFAULT 0,
  active_buyers INTEGER DEFAULT 0,
  
  -- Update tracking
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(item_id)
);

-- Market activity levels
CREATE TYPE market_activity AS ENUM ('dead', 'low', 'medium', 'high');

-- Additional indexes for market data
CREATE INDEX idx_trade_history_item_id ON trade_history(item_id);
CREATE INDEX idx_trade_history_created ON trade_history(created_at);
CREATE INDEX idx_trade_history_price ON trade_history(diamond_equivalent_total);

CREATE INDEX idx_market_refs_item_id ON market_references(item_id);
CREATE INDEX idx_market_refs_activity ON market_references(market_activity);
CREATE INDEX idx_market_refs_updated ON market_references(last_updated);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Type System (TypeScript)

### **Pricing System**
```typescript
// Currency units with proper hierarchy
export enum CurrencyUnit {
  DIAMONDS = 'diamonds',
  DIAMOND_BLOCKS = 'diamond_blocks',
  EMERALDS = 'emeralds', 
  EMERALD_BLOCKS = 'emerald_blocks',
  IRON_INGOTS = 'iron_ingots',
  IRON_BLOCKS = 'iron_blocks'
}

// Price input interface
export interface PriceInput {
  amount: number;
  unit: CurrencyUnit;
  notes?: string;
}

// Item price (relational database record)
export interface ItemPrice {
  id: number;
  item_id: number;
  amount: number;
  currency_unit: CurrencyUnit;
  diamond_equivalent: number;
  notes?: string;
  is_current: boolean;
  created_at: Date;
}

// Price display interface
export interface DisplayPrice {
  primary: string; // "2.5 Diamonds"
  conversions?: string[]; // ["0.28 DB", "3.1 EM"]
  age_indicator?: string; // "Updated 2 days ago"
  confidence?: 'high' | 'medium' | 'low'; // Based on report history
}
```

### **Authentication & Authorization**
```typescript
// User roles with clear hierarchy
export enum UserRole {
  USER = 'user',
  SHOP_OWNER = 'shop_owner', 
  ADMIN = 'admin'
}

// Extensible permissions system
export enum Permission {
  // Item management
  CREATE_ITEMS = 'create_items',
  EDIT_OWN_ITEMS = 'edit_own_items',
  EDIT_ANY_ITEMS = 'edit_any_items',
  DELETE_OWN_ITEMS = 'delete_own_items',
  DELETE_ANY_ITEMS = 'delete_any_items',
  
  // Reports
  SUBMIT_REPORTS = 'submit_reports',
  REVIEW_REPORTS = 'review_reports',
  VIEW_ALL_REPORTS = 'view_all_reports',
  
  // Users
  VIEW_USERS = 'view_users',
  MANAGE_USERS = 'manage_users',
  
  // System
  ACCESS_ADMIN = 'access_admin'
}

// User session interface
export interface UserSession {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  shop_name?: string;
  expires_at: Date;
}

// Authentication state
export interface AuthState {
  isAuthenticated: boolean;
  user?: UserSession;
  loading: boolean;
  error?: string;
}
```

### **Community Reports**
```typescript
// Report types with clear semantics
export enum ReportType {
  PRICE_CHANGE = 'price_change',
  OUT_OF_STOCK = 'out_of_stock', 
  BACK_IN_STOCK = 'back_in_stock',
  SHOP_CLOSED = 'shop_closed',
  INCORRECT_INFO = 'incorrect_info'
}

// Evidence structure
export interface Evidence {
  type: 'screenshot' | 'transaction' | 'shop_visit' | 'external_link' | 'word_of_mouth';
  
  // File evidence
  file_uuid?: string;
  
  // External evidence
  external_url?: string;
  
  // Context
  description: string;
  timestamp?: string; // When evidence was captured
  confidence_level: 'high' | 'medium' | 'low';
}

// Report submission
export interface ReportSubmission {
  item_id: number;
  type: ReportType;
  description: string;
  suggested_changes?: Record<string, any>; // Flexible based on report type
  evidence: Evidence[];
  reporter_contact?: string;
}

// Stored report
export interface CommunityReport {
  id: number;
  item_id: number;
  type: ReportType;
  description: string;
  suggested_changes?: Record<string, any>;
  evidence: Evidence[];
  
  // Reporter info
  reporter_contact?: string;
  reporter_ip: string;
  
  // Review workflow
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  reviewed_by?: number;
  reviewed_at?: Date;
  review_notes?: string;
  
  created_at: Date;
}
```

---

## API Design (RESTful + GraphQL Ready)

### **Authentication Endpoints**
```typescript
// POST /api/auth/register
interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  shop_name?: string;
  discord_contact?: string;
}

interface RegisterResponse {
  user: PublicUser;
  session: UserSession;
}

// POST /api/auth/login  
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: PublicUser;
  session: UserSession;
}

// GET /api/auth/me
interface MeResponse {
  user: PublicUser;
  session: UserSession;
}
```

### **Items API**
```typescript
// GET /api/items
interface ItemsQuery {
  category?: ItemCategory;
  search?: string;
  min_price?: number;
  max_price?: number;
  currency?: CurrencyUnit;
  available_only?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'created_desc' | 'updated_desc';
  page?: number;
  limit?: number;
}

interface ItemsResponse {
  items: PublicItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filters_applied: ItemsQuery;
}

// POST /api/items
interface CreateItemRequest {
  name: string;
  description?: string;
  category: ItemCategory;
  price: PriceInput;
  stock_quantity: number;
}

interface CreateItemResponse {
  item: PrivateItem; // Includes private fields for owner
}
```

### **Reports API**
```typescript
// POST /api/reports
interface CreateReportRequest {
  item_id: number;
  type: ReportType;
  description: string;
  suggested_changes?: Record<string, any>;
  evidence: Evidence[];
  reporter_contact?: string;
}

interface CreateReportResponse {
  report: CommunityReport;
  message: string;
}

// GET /api/reports (admin/owner filtered)
interface ReportsQuery {
  item_id?: number;
  status?: ReportStatus;
  type?: ReportType;
  page?: number;
  limit?: number;
}

interface ReportsResponse {
  reports: CommunityReport[];
  pagination: PaginationMeta;
}
```

---

## Clean Architecture Patterns

### **Service Layer Design**
```typescript
// Price conversion service
export class PriceService {
  private conversionRates: Map<CurrencyUnit, number>;
  
  constructor(private config: PriceConfig) {
    this.loadConversionRates();
  }
  
  convertPrice(price: PriceInput): PriceData {
    // Clean conversion logic
  }
  
  displayPrice(priceData: PriceData, context: DisplayContext): DisplayPrice {
    // Sophisticated display formatting
  }
  
  private loadConversionRates(): void {
    // Load from database with caching
  }
}

// Authentication service
export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private sessionManager: SessionManager
  ) {}
  
  async authenticate(credentials: LoginRequest): Promise<UserSession> {
    // Clean authentication logic
  }
  
  hasPermission(user: UserSession, permission: Permission): boolean {
    // Role-based + permission-based authorization
  }
}

// Report processing service
export class ReportService {
  constructor(
    private reportRepo: ReportRepository,
    private notificationService: NotificationService,
    private confidenceAnalyzer: ConfidenceAnalyzer
  ) {}
  
  async submitReport(submission: ReportSubmission): Promise<CommunityReport> {
    // Validation, confidence scoring, auto-approval logic
  }
  
  async processReport(reportId: number): Promise<void> {
    // Workflow management
  }
}
```

### **Notification System**
```typescript
// Clean, extensible notification system
export interface NotificationProvider {
  send(notification: Notification): Promise<NotificationResult>;
}

export class EmailProvider implements NotificationProvider {
  async send(notification: Notification): Promise<NotificationResult> {
    // Email implementation
  }
}

export class DiscordProvider implements NotificationProvider {
  async send(notification: Notification): Promise<NotificationResult> {
    // Discord webhook implementation
  }
}

export class NotificationService {
  private providers: Map<NotificationChannel, NotificationProvider>;
  
  constructor() {
    this.providers = new Map([
      ['email', new EmailProvider()],
      ['discord', new DiscordProvider()]
    ]);
  }
  
  async notify(notification: Notification): Promise<void> {
    // Route to appropriate providers with retry logic
  }
}
```

---

## Development Environment

### **Docker Configuration**
```yaml
# compose.yml (modern) or docker-compose.yml (legacy compatibility)
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: minecraft_marketplace
      POSTGRES_USER: marketplace_user
      POSTGRES_PASSWORD: dev_password_123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/01-init.sql
      - ./database/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U marketplace_user -d minecraft_marketplace"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://marketplace_user:dev_password_123@db:5432/minecraft_marketplace
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=development
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules
      - uploads:/app/uploads

volumes:
  postgres_data:
  redis_data:
  uploads:
```

---

## Implementation Requirements

### **Technology Stack (July 2025)**
- **Framework**: Astro v5.x (latest stable) with Node.js adapter for SSR + API routes
- **Runtime**: Node.js 22 LTS (latest LTS with best TypeScript support)
- **Database**: PostgreSQL 16 (latest stable) with proper ENUM types
- **Caching**: Redis 7.x for sessions and query caching
- **Testing**: Vitest (latest) for all test types (unit, integration, performance)
- **Container**: Docker with compose plugin (modern `docker compose` commands)

### **Required Configuration Files**
Implementation agent must create:
- `package.json` with all required dependencies and npm scripts (see Required NPM Scripts below)
- `astro.config.mjs` with Node.js adapter and proper TypeScript paths
- `compose.yml` for development environment with PostgreSQL + Redis
- `tsconfig.json` with strict mode and path mapping
- `.env.example` with all required environment variables
- `vitest.config.ts` with PostgreSQL test database setup

### **Required NPM Scripts**
Package.json must include these exact script names referenced in specs:
```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build", 
    "db:migrate": "tsx database/migrate.ts",
    "db:seed": "tsx database/seed.ts",
    "db:reset": "tsx database/reset.ts",
    "db:status": "tsx database/status.ts",
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration", 
    "test:security": "vitest run tests/security",
    "test:performance": "vitest run tests/performance",
    "lint": "eslint . --ext .js,.ts,.astro",
    "typecheck": "astro check"
  }
}
```

### **Environment Variables (Required)**
```bash
# Database (no hardcoded passwords)
DATABASE_URL=postgresql://user:password@host:port/database
# Redis for sessions
REDIS_URL=redis://host:port
# Security
SESSION_SECRET=minimum_32_character_secret
# File uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
# Notifications
SMTP_HOST=smtp.example.com
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### **Implementation Priorities (Updated)**

#### **Phase 1: Authentication Foundation (NEXT)**
- [x] Database schema implementation with migrations ✅
- [ ] Authentication service with role-based permissions ❌ CRITICAL
- [ ] User registration and session management ❌ CRITICAL
- [ ] Authorization middleware for protected routes ❌

#### **Phase 2: Community Features (HIGH PRIORITY)**
- [x] Items CRUD with sophisticated pricing ✅ (partial - no auth)
- [x] Basic search with PostgreSQL full-text search ✅
- [ ] Report submission with evidence handling ❌ 
- [ ] File upload system with security controls ❌
- [ ] Notification system with email/Discord ❌
- [ ] Shop owner dashboard with report management ❌

#### **Phase 3: UX & Polish (LATER)**
- [ ] Price conversion system with real-time display ❌
- [ ] Mobile-responsive UI optimization ❌
- [ ] Performance optimization with caching (database ✅, API ❌)
- [ ] Discord bot integration PoC ❌

#### **COMPLETED FOUNDATIONS** ✅
- [x] Docker environment with PostgreSQL + Redis
- [x] TypeScript system with unified interfaces  
- [x] Comprehensive testing infrastructure (61 tests)
- [x] Security validation (SQL injection prevention)
- [x] Performance benchmarking (sub-100ms queries)

---

## Testing Strategy with Vitest

### **Testing Philosophy**
Comprehensive testing ensures system reliability, data integrity, and user experience quality. Our testing strategy covers all architectural layers with appropriate test types.

### **Vitest Configuration & Setup**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // For API and database tests
    setupFiles: ['./tests/setup/test-db-setup.ts'],
    globalSetup: './tests/setup/global-setup.ts',
    globalTeardown: './tests/setup/global-teardown.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      exclude: [
        'tests/**',
        'database/migrations/**',
        '**/*.d.ts'
      ]
    }
  }
});
```

### **Test Organization & Suites**

#### **Unit Tests** (Fast, Isolated Logic)
**Price Conversion System**:
```typescript
// tests/unit/services/price-converter.test.ts
describe('PriceConverter', () => {
  test('converts diamond blocks to diamonds accurately', () => {
    const converter = new PriceConverter(standardRates);
    expect(converter.convertToDiamonds(1, CurrencyUnit.DIAMOND_BLOCKS)).toBe(9);
  });
  
  test('normalizes prices for database storage', () => {
    const price: PriceInput = { amount: 2.5, unit: CurrencyUnit.EMERALDS };
    const normalized = converter.normalize(price);
    expect(normalized.diamond_equivalent).toBeCloseTo(1.25, 2);
  });
});
```

**Authentication & Security**:
```typescript
// tests/unit/services/auth-service.test.ts
describe('AuthService', () => {
  test('validates user permissions correctly', () => {
    const shopOwner = createMockUser('shop_owner');
    expect(authService.hasPermission(shopOwner, Permission.EDIT_OWN_ITEMS)).toBe(true);
    expect(authService.hasPermission(shopOwner, Permission.MANAGE_USERS)).toBe(false);
  });
  
  test('generates secure session tokens', () => {
    const session = authService.createSession(mockUser);
    expect(session.expires_at).toBeInstanceOf(Date);
    expect(session.expires_at.getTime()).toBeGreaterThan(Date.now());
  });
});
```

#### **Integration Tests** (Database + API)
**Database Schema & Operations**:
```typescript
// tests/integration/database/schema.test.ts
describe('Database Schema', () => {
  test('enforces foreign key constraints', async () => {
    const item = await createTestItem();
    
    // Should fail when referencing non-existent user
    await expect(
      db.query('UPDATE items SET user_id = 99999 WHERE id = $1', [item.id])
    ).rejects.toThrow('foreign key constraint');
  });
  
  test('ENUM constraints work properly', async () => {
    await expect(
      db.query("INSERT INTO users (username, email, role) VALUES ('test', 'test@example.com', 'invalid_role')")
    ).rejects.toThrow('invalid input value for enum user_role');
  });
});
```

**API Endpoint Testing**:
```typescript
// tests/integration/api/items-endpoints.test.ts
describe('Items API', () => {
  test('POST /api/items creates item with proper price normalization', async () => {
    const shopOwner = await createTestUser('shop_owner');
    const authCookie = await getAuthCookie(shopOwner);
    
    const itemData: CreateItemRequest = {
      name: 'Diamond Pickaxe',
      category: 'tools',
      price: { amount: 3, unit: CurrencyUnit.DIAMONDS },
      stock_quantity: 5
    };
    
    const response = await request(app)
      .post('/api/items')
      .set('Cookie', authCookie)
      .send(itemData);
      
    expect(response.status).toBe(201);
    
    // Verify price stored correctly in database
    const prices = await db.query(
      'SELECT * FROM item_prices WHERE item_id = $1 AND is_current = true',
      [response.body.item.id]
    );
    expect(prices[0].diamond_equivalent).toBe(3);
    expect(prices[0].currency_unit).toBe('diamonds');
  });
});
```

#### **Workflow Tests** (End-to-End User Journeys)
**Community Reporting Flow**:
```typescript
// tests/integration/workflows/community-reporting.test.ts
describe('Community Reporting Workflow', () => {
  test('complete price report submission and approval', async () => {
    // Setup test data
    const shopOwner = await createTestUser('shop_owner');
    const item = await createTestItem(shopOwner.id);
    
    // Submit price report
    const reportData = {
      item_id: item.id,
      type: ReportType.PRICE_CHANGE,
      description: 'Price has decreased to 2 diamonds',
      evidence: [{
        type: 'screenshot',
        description: 'Screenshot of shop showing new price',
        file_uuid: await uploadTestEvidence()
      }],
      price_changes: {
        current_amount: 3,
        current_currency: CurrencyUnit.DIAMONDS,
        suggested_amount: 2,
        suggested_currency: CurrencyUnit.DIAMONDS
      }
    };
    
    const reportResponse = await request(app)
      .post('/api/reports')
      .send(reportData);
      
    expect(reportResponse.status).toBe(201);
    
    // Verify notification sent to shop owner
    const notifications = await getNotificationsFor(shopOwner.id);
    expect(notifications.some(n => n.type === 'new_report')).toBe(true);
    
    // Shop owner approves report
    const authCookie = await getAuthCookie(shopOwner);
    const approvalResponse = await request(app)
      .put(`/api/reports/${reportResponse.body.report.id}/approve`)
      .set('Cookie', authCookie);
      
    expect(approvalResponse.status).toBe(200);
    
    // Verify price updated
    const updatedPrices = await db.query(
      'SELECT * FROM item_prices WHERE item_id = $1 AND is_current = true',
      [item.id]
    );
    expect(updatedPrices[0].diamond_equivalent).toBe(2);
  });
});
```

#### **Performance & Security Tests**
**Query Performance**:
```typescript
// tests/performance/database-queries.test.ts
describe('Database Performance', () => {
  test('item search completes under 100ms with large dataset', async () => {
    await seedLargeItemDataset(1000); // 1000 items
    
    const startTime = performance.now();
    const results = await searchItems('diamond');
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(100);
    expect(results.length).toBeGreaterThan(0);
  });
});
```

**Security Validation**:
```typescript
// tests/security/input-validation.test.ts
describe('Security Tests', () => {
  test('prevents SQL injection in search queries', async () => {
    const maliciousInput = "'; DROP TABLE items; --";
    
    const response = await request(app)
      .get('/api/items')
      .query({ search: maliciousInput });
      
    expect(response.status).toBe(200);
    
    // Verify items table still exists
    const itemCount = await db.query('SELECT COUNT(*) FROM items');
    expect(parseInt(itemCount[0].count)).toBeGreaterThan(0);
  });
});
```

### **Testing Automation & CI/CD**
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run test:unit          # Fast unit tests
      - run: npm run test:integration   # Database integration tests  
      - run: npm run test:security      # Security validation tests
      - run: npm run test:performance   # Performance benchmarks
```

### **Test Coverage Goals**
- **Unit Tests**: >90% coverage for business logic (price conversion, validation, calculations)
- **Integration Tests**: 100% coverage for API endpoints and database operations
- **Security Tests**: All input validation paths and authentication flows
- **Performance Tests**: Critical queries and concurrent operation handling

### **Test Data Management**
```typescript
// tests/fixtures/database-helpers.ts
export async function setupTestDatabase() {
  await runMigrations();
  await db.query('TRUNCATE TABLE users, items, item_prices, community_reports CASCADE');
}

export async function seedTestData() {
  const users = await createTestUsers(['user', 'shop_owner', 'admin']);
  const items = await createTestItems(users[1].id); // Shop owner's items
  return { users, items };
}

export async function cleanupTestDatabase() {
  await db.query('TRUNCATE TABLE users, items, item_prices, community_reports CASCADE');
}
```

---

## Implementation Agent Guidance

### **Critical Setup Order**
1. **Initialize Node.js project** with package.json using exact npm scripts above
2. **Create Docker environment** with `compose.yml` at root level (not in docker/ subdirectory)
3. **Set up Astro v5.x** with Node.js adapter for SSR + API routes  
4. **Configure PostgreSQL** with proper ENUMs and constraints from consolidated schema
5. **Add Redis** for session storage and caching
6. **Implement Vitest** with test database isolation

### **Key Architecture Decisions Made**
- **Framework**: Astro v5.x (not Express) - unified SSR + API routes
- **File Structure**: Root-level compose files (not docker/ subdirectory)  
- **Database**: PostgreSQL 16 with proper relational design (no JSONB misuse)
- **Auth**: Session-based with HTTP-only cookies and Redis storage
- **Testing**: Vitest with PostgreSQL test database (not SQLite)

### **Must Avoid**
- ❌ Hardcoded passwords in compose files - use .env variables
- ❌ JSONB for structured data - use proper normalized tables
- ❌ SQLite for testing - use PostgreSQL for consistency
- ❌ docker-compose command - use modern `docker compose`
- ❌ Separate Express server - use Astro API routes

---

*This specification represents a consolidated, production-ready architecture that eliminates inconsistencies while maintaining sophisticated design patterns. Every decision prioritizes long-term maintainability over short-term convenience.*