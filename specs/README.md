# Minecraft Marketplace - Project Specification

## 📋 **TECHNICAL SPECIFICATION**

**Complete Project Blueprint**: [`MINECRAFT_MARKETPLACE_SPEC.md`](./MINECRAFT_MARKETPLACE_SPEC.md)

**Project Organization**: [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md)

> **Purpose**: Technical blueprint and file tree organization for Discord-native Minecraft marketplace
> **Audience**: Developers implementing the system from scratch

### **Specification Coverage**
1. **Problem & Solution** - Core value propositions and technical vision
2. **Technology Stack** - Architecture decisions with integration flow
3. **Data Model** - Complete PostgreSQL schema with relationships
4. **Business Rules** - Currency system, evidence scoring, auto-approval logic
5. **User Requirements** - Four epics covering all core functionality
6. **Technical Requirements** - Performance, security, scalability constraints
7. **Deployment Architecture** - Single-container Docker setup with nginx
8. **Quality Gates** - Definition of done and success metrics

---

## 🎯 **SPECIFICATION PRINCIPLES**

### **Technical Intent Focus**
- **Blueprint Not Implementation**: Captures architectural decisions without code drift
- **Schema Driven**: Complete PostgreSQL schema guides PostgREST API generation
- **Integration Patterns**: Clear workflows for Discord OAuth, BAML processing, notifications
- **Single Container**: nginx reverse proxy for production-ready deployment

### **Core Architecture**
```
Internet → nginx → Astro SSR + Hono Backend + PostgREST API + Swagger Docs
                           ↓
                   PostgreSQL + Valkey + BAML + Discord
```

### **Key Differentiators**
- **Hybrid Architecture**: Astro SSR for security + Hono for external integrations
- **Discord Native**: Primary authentication and notification platform
- **Evidence Based**: Community reporting with confidence scoring
- **AI Enhanced**: BAML processing for item metadata extraction
- **Human Readable**: Context-aware pricing display ("5 diamonds per item")
- **Auto Generated**: PostgREST + Swagger UI eliminate API boilerplate

---

## 📚 **ARCHIVE & DECISION RECORDS**

**Historical Documents**: [`archive/`](./archive/)

### **📋 Current Implementation Reference**
- `IMPLEMENTATION_STRATEGY.md` - **ACTIVE**: 8-week phased migration plan and patterns for building from existing codebase

### **🏛️ Decision Records (Historical Context)**
- `003_database_evaluation.md` - PostgreSQL vs alternatives evaluation rationale
- `TECHNICAL_ARCHITECTURE.md` - Detailed security patterns and deployment considerations
- `SYSTEM_REQUIREMENTS.md` - Original comprehensive user stories and acceptance criteria

### **📜 Superseded Documents (Historical Only)**
- `TECH_STACK.md` - ⚠️ SUPERSEDED: Technology decisions now in main spec
- `000_consolidated_specification.md` - ⚠️ SUPERSEDED: Early draft replaced by current spec
- `001_marketplace_specification.md` - ⚠️ SUPERSEDED: Outdated technical approach

### **Archive Purpose**
- **Decision Records**: Provide "why" context for architectural choices
- **Implementation Guidance**: Active migration strategies and development patterns  
- **Historical Context**: Show evolution from SQLite → PostgreSQL, API routes → PostgREST
- **⚠️ Note**: Only the main specification represents current technical decisions

---

*This specification serves as the authoritative technical blueprint. Archive documents provide implementation guidance and historical decision context but should not be used for current technical decisions.*