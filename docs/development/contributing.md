# Contributing Guide

> **Foundation-First Development**: Learn how to follow architectural principles to maintain code quality

## 🏗️ **Development Philosophy**

This project uses **foundation-first architecture** with SOLID principles, dependency injection, and comprehensive testing built into the foundation rather than added later.

### **Core Principles**
- **Contracts Before Code**: Define interfaces before implementations
- **Dependency Injection**: All services use DI container for testability
- **Test-Driven Development**: Write tests first, implement to pass
- **SOLID Architecture**: Single responsibility, open/closed, Liskov substitution, interface segregation, dependency inversion

## 🚀 **Getting Started**

### **Prerequisites**
- Docker & Docker Compose
- Node.js 22+
- Git
- Basic understanding of TypeScript, PostgreSQL, Astro, and Svelte

### **Initial Setup**
```bash
# Clone and setup
git clone <repository-url>
cd minecraft-marketplace
cp .env.example .env

# Configure minimum environment variables
# (See docs/setup/quick-start.md for details)

# Start development environment  
docker compose -f infrastructure/docker/compose.dev.yml up
```

### **Development Workflow**
```bash
# Install dependencies
npm install

# Start development servers
npm run dev:frontend  # Astro + Svelte (port 4321)
npm run dev:backend   # Hono API (port 3001)

# Run tests continuously
npm run test:watch
```

## 📋 **Architecture Overview**

### **Service Layer Structure**
```
┌─ Interfaces (shared/types/) ──────────┐
│  Define contracts for all services    │
└────────────────────────────────────────┘
           │
┌─ DI Container (shared/di/) ───────────┐
│  Service registration and resolution  │
└────────────────────────────────────────┘
           │
┌─ Repositories (backend/repositories/) ┐
│  Data access layer implementations    │
└────────────────────────────────────────┘
           │
┌─ Services (backend/services/) ────────┐
│  Business logic implementations       │
└────────────────────────────────────────┘
           │
┌─ API Routes (frontend/api/, backend/) ┐
│  HTTP endpoints using injected services│
└────────────────────────────────────────┘
```

### **Key Directories**
- **`shared/`**: Types, interfaces, DI container, utilities
- **`frontend/`**: Astro SSR pages, Svelte components, secure API routes
- **`backend/`**: Hono external integrations, business logic services
- **`infrastructure/`**: Docker, database schema, configuration
- **`tests/`**: Unit, integration, and end-to-end tests

## 🔧 **Development Guidelines**

### **1. Adding New Features**

#### **Step 1: Define Interfaces**
```typescript
// shared/types/service-interfaces.ts
export interface YourNewService {
  doSomething(input: Input): Promise<Output>;
}

export interface YourNewRepository extends StorageRepository<YourEntity> {
  findBySpecialCriteria(criteria: Criteria): Promise<YourEntity[]>;
}
```

#### **Step 2: Implement Repository**
```typescript
// backend/src/repositories/your-repository.ts
export class PostgreSQLYourRepository implements YourNewRepository {
  constructor(private db: Database) {}
  
  async save(entity: YourEntity): Promise<YourEntity> {
    // Implementation
  }
  
  // Implement all interface methods
}
```

#### **Step 3: Implement Service**
```typescript
// backend/src/services/your-service.ts
export class YourNewServiceImpl implements YourNewService {
  constructor(
    private repository: YourNewRepository,
    private otherService: OtherService
  ) {}
  
  async doSomething(input: Input): Promise<Output> {
    // Business logic implementation
  }
}
```

#### **Step 4: Register with DI Container**
```typescript
// backend/src/container-setup.ts
container.register('yourNewRepository', () => 
  new PostgreSQLYourRepository(container.get('database'))
);

container.register('yourNewService', () => 
  new YourNewServiceImpl(
    container.get('yourNewRepository'),
    container.get('otherService')
  )
);
```

#### **Step 5: Create API Routes**
```typescript
// frontend/src/pages/api/your-endpoint.ts (secure operations)
export async function POST({ request }: APIRoute) {
  const service = container.get<YourNewService>('yourNewService');
  const result = await service.doSomething(await request.json());
  return new Response(JSON.stringify(result));
}

// backend/src/routes/your-external-endpoint.ts (external integrations)
app.post('/your-endpoint', async (c) => {
  const service = container.get<YourNewService>('yourNewService');
  const result = await service.doSomething(await c.req.json());
  return c.json(result);
});
```

#### **Step 6: Write Tests**
```typescript
// tests/unit/services/your-service.test.ts
describe('YourNewService', () => {
  let service: YourNewService;
  let mockRepository: jest.Mocked<YourNewRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findBySpecialCriteria: jest.fn(),
      // Mock all methods
    };
    service = new YourNewServiceImpl(mockRepository, mockOtherService);
  });

  it('should do something correctly', async () => {
    // Arrange
    const input = { /* test data */ };
    mockRepository.save.mockResolvedValue(expectedResult);

    // Act
    const result = await service.doSomething(input);

    // Assert
    expect(result).toEqual(expectedOutput);
    expect(mockRepository.save).toHaveBeenCalledWith(expectedData);
  });
});
```

### **2. Database Changes**

#### **Schema Changes**
```sql
-- infrastructure/database/schema/XXX_your_change.sql
CREATE TABLE your_new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE your_new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY your_policy ON your_new_table FOR ALL USING (true);
```

#### **Migration Process**
```bash
# Create migration
npm run db:create-migration "Add your new table"

# Apply migrations
npm run db:migrate

# Verify schema
docker compose exec db psql -U marketplace_user -d minecraft_marketplace -c "\d your_new_table"
```

### **3. Testing Requirements**

#### **Test Types**
- **Unit Tests**: Pure logic, mocked dependencies
- **Integration Tests**: Database interactions, API endpoints
- **End-to-End Tests**: Complete user workflows

#### **Test Structure**
```
tests/
├── unit/                  # Pure logic tests
│   ├── services/         # Business logic
│   └── utils/            # Utility functions
├── integration/          # Service interaction tests
│   ├── api/              # API endpoint testing
│   ├── database/         # PostgreSQL integration
│   └── external/         # Discord, BAML integrations
├── e2e/                  # Complete workflows (Playwright)
└── fixtures/             # Test data factories
    └── minecraft-faker.ts # Realistic Minecraft data
```

#### **Writing Tests**
```typescript
// Use Faker for realistic test data
import { MinecraftFaker } from '@/tests/fixtures/minecraft-faker';

describe('ItemService', () => {
  it('should create enchanted items correctly', async () => {
    const enchantedSword = MinecraftFaker.item();
    enchantedSword.enchantments = { sharpness: 5, unbreaking: 3 };
    
    const result = await itemService.createItem(enchantedSword, userId);
    
    expect(result.enchantments).toEqual({ sharpness: 5, unbreaking: 3 });
  });
});
```

### **4. Code Quality Standards**

#### **TypeScript Configuration**
- Strict mode enabled
- No `any` types (use proper typing)
- Explicit return types for public methods
- Comprehensive interface definitions

#### **ESLint + Prettier**
```bash
# Run linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format code
npm run format
```

#### **Testing Coverage**
- Minimum 80% code coverage
- All business logic must have unit tests
- Critical paths must have integration tests
- Main user flows must have E2E tests

## 🧪 **Testing Guide**

### **Running Tests**
```bash
# All tests
npm test

# Specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests only

# With coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### **Test Data Management**
```typescript
// Use factories for consistent test data
const testUser = UserFactory.create({
  role: 'shop_owner',
  shopName: 'Test Shop'
});

const testItem = MinecraftFaker.item();
testItem.enchantments = { mending: 1 };
```

### **Database Testing**
```typescript
// Each test gets isolated database
describe('ItemRepository', () => {
  let repository: ItemRepository;
  let testDb: Database;

  beforeEach(async () => {
    testDb = await createTestDatabase();
    repository = new PostgreSQLItemRepository(testDb);
  });

  afterEach(async () => {
    await cleanupTestDatabase(testDb);
  });

  // Tests...
});
```

## 🚀 **Deployment Process**

### **Local Development**
```bash
# Development mode with hot reload
docker compose -f infrastructure/docker/compose.dev.yml up

# Production mode locally
docker compose up
```

### **Testing Changes**
```bash
# Run full test suite
npm run test:all

# Check code quality
npm run lint
npm run type-check

# Performance tests
npm run test:performance
```

### **Submitting Changes**
1. Create feature branch: `git checkout -b feature/your-feature`
2. Follow TDD approach: write tests first
3. Implement feature following architecture guidelines
4. Ensure all tests pass: `npm run test:all`
5. Check code quality: `npm run lint && npm run type-check`
6. Commit with clear message: `git commit -m "Add feature: description"`
7. Create pull request with description

## 📚 **Resources**

### **Architecture Documentation**
- [`GAMEPLAN.md`](../../GAMEPLAN.md) - Implementation roadmap
- [`specs/MINECRAFT_MARKETPLACE_SPEC.md`](../../specs/MINECRAFT_MARKETPLACE_SPEC.md) - Technical requirements
- [`specs/PROJECT_STRUCTURE.md`](../../specs/PROJECT_STRUCTURE.md) - File organization

### **Technical References**
- [Astro Documentation](https://docs.astro.build/)
- [Svelte Documentation](https://svelte.dev/docs)
- [Hono Documentation](https://hono.dev/)
- [PostgREST Documentation](https://postgrest.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### **Testing Frameworks**
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Faker.js Documentation](https://fakerjs.dev/)

## ❓ **Getting Help**

### **Common Issues**
1. **Service Registration Errors**: Check DI container setup
2. **Database Connection Issues**: Verify PostgreSQL is running
3. **Test Failures**: Ensure test database is properly isolated
4. **Type Errors**: Check interface definitions match implementations

### **Communication**
- Create GitHub issues for bugs
- Use discussions for architectural questions
- Follow pull request template for submissions

---

**Remember**: Foundation-first development means the architecture guides the implementation, not the other way around. When in doubt, refer to the interfaces and follow the dependency injection patterns.