# Technology Guide for Newcomers

> **🎯 Why These Technologies?** Understanding the stack without overwhelm

## 🚀 Quick Start Philosophy

**Don't learn everything at once!** Each technology serves a specific purpose. You can contribute effectively by understanding just the piece you're working on.

**Recommended learning path:**
1. Run `npm run test:newcomer` to see what works
2. Pick one failing test 
3. Learn only the technology needed for that test
4. Repeat until comfortable

## 🏗️ Core Architecture

### **PostgREST** - Instant REST API from PostgreSQL
**What it does:** Automatically generates REST API endpoints from your database schema
**Why we use it:** No API boilerplate code to write or maintain

```bash
# Database table 'items' automatically becomes:
GET    /api/data/items     # List all items
POST   /api/data/items     # Create new item
PATCH  /api/data/items?id=eq.123  # Update item
DELETE /api/data/items?id=eq.123  # Delete item
```

**Learn more:**
- 📖 [PostgREST Tutorial](https://postgrest.org/en/stable/tutorials/tut0.html)
- 🔍 See it in action: http://localhost:7410/api/data (when running)
- 📚 [Query examples](https://postgrest.org/en/stable/references/api/resource_representation.html)

**Newcomer tip:** Don't worry about mastering PostgREST syntax. Our tests show you the patterns to use.

### **Valkey** - High-performance Redis-compatible cache
**What it does:** In-memory data store for session management and caching
**Why we use it:** Drop-in Redis replacement with better performance

```bash
# Same Redis commands you know:
SET user:123 '{"username": "steve"}'
GET user:123
EXPIRE user:123 3600
```

**Learn more:**
- 📖 [Redis commands cheat sheet](https://redis.io/commands) (same syntax)
- 🔍 See it running: `just status` shows Valkey service

**Newcomer tip:** If you know Redis, you know Valkey. If not, it's just a key-value store.

### **MSW (Mock Service Worker)** - API mocking for fast tests
**What it does:** Intercepts HTTP requests in tests and returns mock data
**Why we use it:** Tests run in <1s instead of 30s+ with real databases

```typescript
// Instead of waiting for real PostgREST:
const server = setupServer(
  http.get('/api/data/items', () => {
    return HttpResponse.json([
      { id: 1, name: 'Diamond Sword', price_diamonds: 5 }
    ]);
  })
);

// Test runs instantly with predictable data
```

**Learn more:**
- 📖 [MSW Quick Start](https://mswjs.io/docs/getting-started)
- 🔍 See it in action: `npm run test:newcomer`

**Newcomer tip:** MSW lets you test business logic without infrastructure. Perfect for rapid development.

## 🎨 Frontend Technologies

### **Astro v5.12+** - Modern static site generator with SSR
**What it does:** Builds fast websites with minimal JavaScript
**Why we use it:** Server-side rendering + component islands for performance

```astro
---
// Server-side code (runs at build time)
const items = await fetch('/api/data/items').then(r => r.json());
---

<!-- HTML with optional interactive components -->
<MarketplaceBrowser items={items} client:load />
```

**Learn more:**
- 📖 [Astro Tutorial](https://docs.astro.build/en/tutorial/0-introduction/)
- 🔍 Files: `workspaces/frontend/src/pages/`

**Newcomer tip:** Astro is like HTML with superpowers. Start with `.astro` files in the pages directory.

### **Svelte v5.37+** - Reactive UI components
**What it does:** Component framework with built-in reactivity
**Why we use it:** Less boilerplate than React, better performance

```svelte
<script>
  let items = [];
  let searchTerm = '';
  
  // Reactive statement - runs when searchTerm changes
  $: filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
</script>

<input bind:value={searchTerm} placeholder="Search items..." />
{#each filteredItems as item}
  <div>{item.name} - {item.price_diamonds} diamonds</div>
{/each}
```

**Learn more:**
- 📖 [Svelte Tutorial](https://learn.svelte.dev/)
- 🔍 Files: `workspaces/frontend/src/components/`

**Newcomer tip:** Svelte is like vanilla JavaScript with reactive magic. Very approachable if you know HTML/CSS/JS.

## ⚙️ Backend Technologies

### **Hono v4.8+** - Lightweight web framework
**What it does:** Handles HTTP requests, similar to Express but faster
**Why we use it:** Type-safe, minimal, works everywhere (Node.js, Deno, Bun, Workers)

```typescript
import { Hono } from 'hono';

const app = new Hono();

app.get('/api/v1/items', async (c) => {
  // Business logic here
  const items = await itemService.getAll();
  return c.json(items);
});
```

**Learn more:**
- 📖 [Hono Documentation](https://hono.dev/)
- 🔍 Files: `workspaces/backend/src/`

**Newcomer tip:** If you know Express.js, Hono will feel familiar but simpler.

### **BAML** - AI processing language
**What it does:** Structured way to process items with AI
**Why we use it:** Type-safe AI interactions for item categorization

```baml
function ClassifyItem(description: string) -> ItemCategory {
  client "gpt-4"
  prompt #"
    Classify this Minecraft item: {{ description }}
    Categories: weapons, tools, blocks, food, misc
  "#
}
```

**Learn more:**
- 📖 [BAML Documentation](https://docs.boundaryml.com/)
- 🔍 Files: Look for `.baml` files

**Newcomer tip:** BAML is optional for most development. Focus on core features first.

## 🗄️ Database & Storage

### **PostgreSQL 17+** - Relational database
**What it does:** Stores all application data with ACID guarantees
**Why we use it:** Mature, reliable, excellent tooling, works with PostgREST

```sql
-- Simple, clean schema
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_diamonds INTEGER NOT NULL,
  owner_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Learn more:**
- 📖 [PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html)
- 🔍 Schema: `config/docker/database/schema/`

**Newcomer tip:** Standard SQL works great. PostgREST handles most database interactions for you.

## 🧪 Testing Technologies

### **Vitest v3.2+** - Fast test runner
**What it does:** Runs tests with great TypeScript support
**Why we use it:** 10x faster than Jest, better error messages

```typescript
import { describe, it, expect } from 'vitest';

describe('Item validation', () => {
  it('should accept valid diamond price', () => {
    const item = { name: 'Diamond Sword', price_diamonds: 5 };
    expect(validateItem(item)).toBe(true);
  });
});
```

**Learn more:**
- 📖 [Vitest Guide](https://vitest.dev/guide/)
- 🔍 Run: `npm run test:newcomer`

**Newcomer tip:** If you know Jest, Vitest is the same but faster. If not, it's just assertions in functions.

### **Faker v9.9+** - Test data generation
**What it does:** Generates realistic fake data for tests
**Why we use it:** Consistent, varied test data without hardcoding

```typescript
import { faker } from '@faker-js/faker';

const fakeItem = {
  name: faker.commerce.productName(),
  price_diamonds: faker.number.int({ min: 1, max: 100 }),
  owner_id: faker.person.firstName().toLowerCase()
};
```

**Learn more:**
- 📖 [Faker.js Documentation](https://fakerjs.dev/)
- 🔍 Files: `tests/utils/`

**Newcomer tip:** Faker makes tests more realistic. Our centralized test framework handles most data generation for you.

## 🐳 Development Environment

### **Docker Compose** - Container orchestration
**What it does:** Runs all services together with one command
**Why we use it:** Consistent environment across all machines

```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      - POSTGRES_DB=minecraft_marketplace
  
  postgrest:
    image: postgrest/postgrest:v12.2.0
    depends_on: [postgres]
```

**Learn more:**
- 📖 [Docker Compose Tutorial](https://docs.docker.com/compose/gettingstarted/)
- 🔍 Files: `config/docker/compose*.yml`

**Newcomer tip:** You don't need to understand Docker deeply. Use `just up` to start everything.

### **Nix** - Reproducible development environments
**What it does:** Same development environment on every machine
**Why we use it:** No "works on my machine" problems

```nix
{
  description = "Minecraft Marketplace dev environment";
  
  outputs = { nixpkgs, ... }: {
    devShells.default = pkgs.mkShell {
      packages = with pkgs; [
        nodejs_22
        docker
        postgresql_17
      ];
    };
  };
}
```

**Learn more:**
- 📖 [Nix Development Guide](https://nix.dev/)
- 🔍 Files: `config/nix/flake.nix`

**Newcomer tip:** Nix handles setup automatically in GitHub Codespaces. Locally, you can use Docker instead.

## 🚦 Getting Started - Recommended Learning Order

### Week 1: Core Testing & Development
1. **Run tests**: `npm run test:newcomer` 
2. **Pick one failing test** in `tests/unit/`
3. **Learn just enough** of the relevant technology to fix it
4. **Make it pass** using TDD (Red → Green → Refactor)

### Week 2: Frontend Development  
1. **Explore Astro pages** in `workspaces/frontend/src/pages/`
2. **Try modifying a Svelte component** in `workspaces/frontend/src/components/`
3. **See changes live** with `just dev` (hot reload)

### Week 3: Backend & Database
1. **Look at Hono routes** in `workspaces/backend/src/`
2. **Try PostgREST queries** at http://localhost:7410/api/data/items
3. **Understand the data model** in CLAUDE.md

### Week 4: Advanced Features
1. **MSW test patterns** for complex scenarios
2. **Database migrations** and schema changes
3. **AI integration** with BAML (optional)

## 🆘 When You Get Stuck

**Don't try to learn everything at once!** Focus on one piece at a time.

- **Overwhelmed by technology stack?** → Run `npm run test:newcomer` and focus on one failing test
- **Can't find relevant documentation?** → Check the links above or run `just newcomer-help`
- **Technology not working as expected?** → See [docs/setup/common-issues.md](common-issues.md)
- **Want to contribute but don't know where?** → Run `just tour` for project structure

**Remember:** You can be productive without understanding every technology deeply. Start small, learn incrementally, and ask for help when needed!

## 🎯 Success Metrics

You'll know you're making progress when:
- ✅ You can run `npm run test:newcomer` and understand the output
- ✅ You can pick a failing test and make it pass
- ✅ You can explain one technology to another newcomer
- ✅ You can add a new feature following existing patterns

**The goal isn't mastery of every tool - it's productive contribution to the project!**