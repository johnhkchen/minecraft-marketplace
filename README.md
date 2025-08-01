# Minecraft Marketplace

> **Discord-native community marketplace for Minecraft server economies with evidence-based reporting and AI-enhanced item processing**

## 📖 Documentation Guide
**New to the project? Start here to find what you need:**
- **🚀 Setup & Quick Start:** This README (you're here! - setup + quick tour)
- **💻 Development Guide:** [CLAUDE.md](CLAUDE.md) (complete context for coding & architecture)
- **📋 Requirements:** [specs/MINECRAFT_MARKETPLACE_SPEC.md](specs/MINECRAFT_MARKETPLACE_SPEC.md) (what we're building)
- **🤝 Contributing:** [docs/development/contributing.md](docs/development/contributing.md) (how to add features)
- **🆘 Troubleshooting:** [docs/setup/common-issues.md](docs/setup/common-issues.md) (when things go wrong)
- **🏗️ Deep Dive:** [docs/](docs/) directory (detailed guides & reports)

💡 **Newcomer tip:** Start with `just newcomer-setup` for guided onboarding!

## 🚀 **Quick Start**

### **🆕 For Newcomers (Recommended)**
**Never used this project before? Start here:**

```bash
# 1. Clone and enter directory
git clone <repository-url>
cd minecraft-marketplace

# 2. One-command setup (3-5 minutes)
just newcomer-setup

# 3. Start developing immediately
npm run test:newcomer      # See tests pass in <1 second
just ports                # Learn about our service ports
just tour                 # Understand project structure
```

**Need help?** Run `just newcomer-help` for troubleshooting.

### **For Human Developers: GitHub Codespace + Nix**
**The fastest way to start contributing**:

1. **Open in GitHub Codespace** (click "Code" → "Codespaces" → "Create codespace")
2. **Wait for automatic setup** (dependencies installed automatically)
3. **Start developing**:
   ```bash
   docker compose -f config/docker/compose.dev.yml up -d  # Start infrastructure
   npm run dev                    # Start frontend + backend with hot reload
   npm run test:fast              # Run 240 tests in ~80ms
   ```

**That's it!** You're ready to contribute with full hot-reload development.

### **Alternative: Local Development**
If you prefer local development:
```bash
git clone <repository-url>
cd minecraft-marketplace
npm install                      # Install dependencies
docker compose -f config/docker/compose.dev.yml up -d  # Start infrastructure
npm run dev                      # Start development servers
```

### **Fresh Install Guarantee**
Anyone can clone this repo and run it **without custom configuration**:

```bash
# Fresh install - single command deployment
git clone <repository-url>
cd minecraft-marketplace
./scripts/fresh-install.sh
```

That's it! The script handles everything:
- ✅ Environment setup (.env creation)
- ✅ Docker image building  
- ✅ Service orchestration
- ✅ Health validation
- ✅ Ready-to-use marketplace

**Access Points:**
- **🌐 Main Application**: http://localhost:7410
- **📚 API Documentation**: http://localhost:7410/docs  

## 🏗️ **Architecture Overview**

**Simple, Modern Stack:**
```
┌─ Frontend (Astro + Svelte) ──────────────┐
│  🌐 http://localhost:4321 (development)   │
│  • Server-side rendering                 │
│  • Interactive components                │ 
│  • Hot reload for fast iteration         │
└─────────────────┬─────────────────────────┘
                  │
┌─ Backend (Hono API) ─────────────────────┐
│  ⚡ http://localhost:3001 (development)   │
│  • External integrations                 │
│  • Discord webhooks                      │
│  • AI item processing                    │
└─────────────────┬─────────────────────────┘
                  │
┌─ Database API (PostgREST) ──────────────┐
│  🗄️  http://localhost:3000 (development)  │
│  • Auto-generated REST API               │
│  • No boilerplate code needed            │
│  • Row-level security built-in           │
└─────────────────┬─────────────────────────┘
                  │
┌─ Database (PostgreSQL) ─────────────────┐
│  🐘 postgresql://localhost:5432          │
│  • ACID transactions                     │
│  • Full-text search                      │
│  • JSON support for flexibility          │
└───────────────────────────────────────────┘
```

**Key Benefits:**
- ⚡ **Fast development**: MSW-mocked tests run in <1 second
- 🔒 **Secure by default**: Row-level security + JWT authentication  
- 🚀 **Deploy anywhere**: Single Docker command works everywhere
- 🧪 **Test-driven**: 320+ tests ensure reliability

## 📋 **Project Overview**

### **What This Is**
A micro-server marketplace application (5-10 users) built with **foundation-first architecture** to prevent technical debt. Features Discord authentication, AI-processed item descriptions, and community-driven price transparency.

### **Key Features**
- **🔐 Discord Native**: Primary authentication and notification platform
- **💎 Diamond Economy**: Human-readable pricing with trading units (per item/stack/shulker)
- **🤖 AI Enhanced**: BAML processing for structured item metadata
- **📊 Evidence-Based**: Community reporting with confidence scoring
- **⚡ Auto-Generated**: PostgREST + Swagger eliminate API boilerplate

### **Architecture Highlights**
```
Internet → nginx → Astro SSR + Hono Backend + PostgREST API + Swagger Docs
                           ↓
                   PostgreSQL + Valkey + BAML + Discord
```

## 🏗️ **Development**

### **Prerequisites**
- Docker & Docker Compose
- Node.js 22+ (for local development)
- Git

### **Architecture Philosophy**
This project uses **foundation-first development** with SOLID principles, dependency injection, and comprehensive testing built into the foundation rather than added later.

### **Development Workflow**
1. **Week 1**: Architectural Foundation (contracts, DI container, database schema)
2. **Week 2**: Data Layer (repositories, services, assembly)
3. **Week 3**: API Layer (PostgREST, Astro routes, Hono external)
4. **Week 4-6**: Features (authentication, items, community)
5. **Week 7-8**: Production (testing, security, deployment)

### **Key Commands**
```bash
# Development environment (Docker only)
docker compose -f config/docker/compose.dev.yml up -d

# Development with hot reload (after Docker infrastructure)
npm run dev

# Run tests
npm run test:fast          # Fast tests (240 tests in ~80ms)
npm test                   # All tests
npm run test:e2e          # Playwright end-to-end

# Code quality  
npm run lint              # ESLint + Prettier
npm run type-check        # TypeScript validation
```

## 📚 **Documentation**

### **Technical Specifications**
- **📋 [Complete Specification](specs/MINECRAFT_MARKETPLACE_SPEC.md)** - Technical blueprint and requirements
- **🏗️ [Project Structure](specs/PROJECT_STRUCTURE.md)** - Greenfield file tree organization  
- **⚡ [Implementation Gameplan](GAMEPLAN.md)** - Foundation-first development roadmap

### **Architecture Documentation**
- **🔧 Service Architecture**: Dependency injection with SOLID principles
- **🗄️ Database Design**: PostgreSQL schema with Row Level Security
- **🧪 Testing Strategy**: Vitest + Faker (Minecraft data) + Playwright
- **🛡️ Security Model**: Discord OAuth + JWT + database-enforced permissions

### **Development Documentation**
- **📖 [Setup Guide](docs/setup/quick-start.md)** - Fresh install instructions
- **🏃 [Contributing Guide](docs/development/contributing.md)** - Development workflow
- **🐛 [Debugging Guide](docs/development/debugging-guide.md)** - Common issues and solutions

## 🎯 **Project Status**

### **Current Phase**: 🏗️ **Initial Setup**
- [x] Technical specifications complete
- [x] Foundation-first implementation plan
- [ ] Project structure initialization
- [ ] Development tooling setup
- [ ] Database schema implementation

### **Tech Debt Avoidance Guarantees**
- ✅ **Fresh Install Works**: `docker compose up` with no manual configuration
- ⏳ **Live Demo Available**: Working deployment for stakeholder testing
- ⏳ **Clear Setup Instructions**: New developers can contribute without reverse-engineering  
- ⏳ **Deployable by Others**: Standard Docker deployment on any platform

## 🛠️ **Technology Stack**

### **Core Architecture**
- **Frontend**: [Astro](https://astro.build/) v5.12+ SSR + [Svelte](https://svelte.dev/) v5.37+ components
- **Backend**: [Hono](https://hono.dev/) v4.8+ framework for external integrations
- **Database**: [PostgreSQL](https://postgresql.org/) 17+ with [PostgREST](https://postgrest.org/) auto-API
- **Cache**: [Valkey](https://valkey.io/) v8.1+ (Redis-compatible) session storage
- **Reverse Proxy**: [nginx](https://nginx.org/) single entry point

### **Development & Quality**
- **Testing**: [Vitest](https://vitest.dev/) + [Faker](https://fakerjs.dev/) + [Playwright](https://playwright.dev/)
- **Code Quality**: ESLint + Prettier + TypeScript strict mode
- **Architecture**: SOLID principles + Dependency injection + TDD methodology
- **Documentation**: [Swagger UI](https://swagger.io/tools/swagger-ui/) auto-generated from database schema

### **External Integrations**
- **Authentication**: [Discord OAuth 2.0](https://discord.com/developers/docs/topics/oauth2)
- **AI Processing**: [BAML](https://baml.ai/) for item description standardization
- **Notifications**: Discord webhooks with reliable delivery

## 📈 **Success Metrics**

### **Technical Quality**
- **Test Coverage**: >80% across unit, integration, and E2E tests
- **Performance**: <2s search, <500ms filtering, <200ms API responses
- **Security**: Discord OAuth + JWT + PostgreSQL Row Level Security
- **Maintainability**: SOLID principles + dependency injection architecture

### **Business Goals** (3 months)
- **User Adoption**: 50+ monthly active users, 5+ active shops
- **System Quality**: 90% search accuracy, 80% reports include evidence  
- **Performance**: <1% error rate, <48h shop owner response time
- **Business Impact**: 60% price staleness reduction, 25% marketplace activity increase

## 🤝 **Contributing**

1. **Read Documentation**: Start with [Contributing Guide](docs/development/contributing.md)
2. **Follow Architecture**: Foundation-first development with SOLID principles
3. **Test Everything**: Comprehensive Vitest + Faker + Playwright coverage
4. **Quality Gates**: All architecture checkpoints must pass

## 📄 **License**

MIT

---

*Built with foundation-first architecture to prevent technical debt. The planned architecture becomes the actual architecture.*

