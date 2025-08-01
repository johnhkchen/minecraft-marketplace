# Archive Document Status

> **⚠️ IMPORTANT**: Only `/specs/MINECRAFT_MARKETPLACE_SPEC.md` represents current technical decisions

## Document Status Guide

### **📋 ACTIVE** - Current Implementation Reference
- `IMPLEMENTATION_STRATEGY.md` - 8-week phased migration plan and patterns

### **🏛️ HISTORICAL CONTEXT** - Decision Records
- `003_database_evaluation.md` - PostgreSQL selection rationale
- `TECHNICAL_ARCHITECTURE.md` - Detailed security patterns and deployment considerations
- `SYSTEM_REQUIREMENTS.md` - Original comprehensive user stories

### **📜 SUPERSEDED** - Historical Only
- `TECH_STACK.md` - ⚠️ Technology decisions moved to main spec
- `000_consolidated_specification.md` - ⚠️ Early draft replaced
- `001_marketplace_specification.md` - ⚠️ Outdated technical approach
- `002_foundational_architecture.md` - ⚠️ Architecture consolidated into main spec
- `004_project_organization_analysis.md` - ⚠️ Project structure superseded

## Archive Evolution

**Technology Stack Evolution:**
- SQLite → PostgreSQL 15+
- Custom API routes → PostgREST auto-generated API
- Redis → Valkey (Redis-compatible)
- Manual documentation → Swagger UI auto-generation
- No AI processing → BAML integration

**Architecture Evolution:**
- Multi-service exposure → Single nginx entry point
- Basic auth → Discord OAuth + JWT + PostgreSQL RLS
- Simple file handling → Evidence system with confidence scoring

**Purpose**: These documents show the decision-making process and provide implementation guidance, but should not be used for current technical decisions.