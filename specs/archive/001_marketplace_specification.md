# Minecraft Marketplace Specification

> **Core Assumption**: Discord trading is inadequate → Community will adopt a proper marketplace  
> **Team**: Lead dev + Wh1rledPeas (25yrs enterprise experience)  
> **Approach**: 4-week validation alpha, hypothesis-driven development

---

## Primary Validation Hypotheses

### 🎯 **Core Value**: "Server players will use web marketplace instead of Discord trading"
**Learn**: Do people find, use, and complete transactions through the platform?  
**Week 2 targets**: 25+ visitors, 3+ shop owners, 10+ items, evidence of 1+ transaction

### 🎯 **Pricing UX**: "Multi-unit price entry solves calculation friction"  
**Background**: Diamond block system failed - users had to calculate "2 diamonds = 0.222 diamond blocks"  
**Learn**: Can users enter prices without confusion? Do they understand conversions?  
**Method**: Single approach with usability observation, track completion rates & errors

### 🎯 **Community Validation**: "Community will help maintain price/inventory accuracy"
**Learn**: Will non-owners report changes? Do owners respond?  
**4-week targets**: 2+ price reports, 1+ owner response, improved accuracy

---

## Critical Dependencies & Unknowns

**Must validate first**:
- [ ] Server community size and active trader count
- [ ] Current Discord trading volume (baseline)
- [ ] Community leadership buy-in
- [ ] Economic activity level sufficient for marketplace

**Technical unknowns**:
- [ ] Astro API limits (auth, uploads, real-time features)
- [ ] PostgreSQL connection pooling requirements for concurrent users
- [ ] Mobile performance on slow connections

---

## 4-Week Development Sprint

### Week 1: Foundation
**Goal**: Can we build and deploy something usable?
- [ ] Repository setup (both devs contributing)
- [ ] Architecture decision (Astro API vs Express - Wh1rledPeas leads)
- [ ] Basic item listing (public, no auth)
- [ ] Simple shop owner registration

### Week 2: Core Value Test  
**Goal**: Do people find and use this?
- [ ] Smart price entry (multi-unit input with real-time conversions)
- [ ] Mobile responsive design
- [ ] Basic search/filtering (PostgreSQL full-text search)
- [ ] Analytics setup
**Targets**: 25+ visitors, 3+ shop owners, 10+ items

### Week 3: Community Features
**Goal**: Will community help maintain data?
- [ ] Price reporting system with evidence options
- [ ] Inventory status reporting
- [ ] Shop owner notification workflow
- [ ] Basic moderation tools
**Targets**: 2+ price reports, 1+ owner response

### Week 4: Integration & Polish
**Goal**: Can this integrate with existing workflows?
- [ ] Discord bot PoC (search marketplace from Discord)
- [ ] Performance optimization (<2 second loads)
- [ ] User feedback collection
- [ ] Prepare for broader testing

---

## Technical Architecture

### Core Decisions
- **Database**: PostgreSQL + Docker Compose (eliminates file permission issues, production-ready)
- **Backend**: Astro v5.x with API routes (unified SSR + API, simpler than separate Express server)
- **Auth**: Session-based with HTTP-only cookies (secure, scalable)
- **Deployment**: Docker Compose for development, container-based for production
- **Runtime**: Node.js 22 LTS with npm (latest stable, best TypeScript support)

### Smart Pricing System
> **Reference**: See `000_consolidated_specification.md` for complete database schema and TypeScript interfaces

**Key Architecture**: Clean relational design with separate `item_prices` table for price history and conversions.

**Key UX**: Real-time conversion display shows "2.5 D / 0.28 DB / 3.1 EM" - no mental math required

### Database Schema
> **Reference**: Complete PostgreSQL schema with ENUMs, constraints, and indexes defined in `000_consolidated_specification.md`

**Key Features**: Normalized pricing system, role-based permissions, evidence handling, and file management with UUID access control.

### API Design
> **Reference**: See `000_consolidated_specification.md` for complete TypeScript interfaces and request/response contracts

**Core Endpoints**:
- Items CRUD with price management
- Authentication with role-based permissions
- Community reports with evidence handling
- File uploads with access control
- Price conversion utilities

**Key Features**:
- Consistent TypeScript interfaces across frontend/backend
- Proper validation using consolidated type definitions
- Clean separation of concerns (items, prices, reports, evidence)

---

## Success Criteria (4 weeks)

### User Adoption
- [ ] 50+ unique visitors total
- [ ] 5+ registered shop owners
- [ ] 25+ items listed across categories
- [ ] 3+ returning weekly users
- [ ] 80%+ price entry completion rate

### Community Engagement  
- [ ] 3+ price reports submitted
- [ ] 1+ shop owner responds to reports
- [ ] Reported prices more accurate than stale listings
- [ ] 1+ community member becomes regular contributor

### Technical Health
- [ ] <2 second page loads on mobile
- [ ] 99%+ uptime during testing
- [ ] Both developers contributing regularly
- [ ] Clear deployment process

### Learning (Most Important)
- [ ] Clear data on feature usage drivers
- [ ] User workflow patterns understood
- [ ] Pricing UX approach validated/invalidated
- [ ] Community engagement model proven/disproven
- [ ] Clear path forward or pivot direction

---

## Failure Modes & Pivots

### Week 2 Signals
**Failures**: <10 visitors, 0 shop owners, high bounce on price entry  
**Pivots**: Discord bot only, read-only aggregator, different community

### Week 3 Signals
**Failures**: 0 price reports, owners ignore reports, no return visitors  
**Pivots**: Owner-only updates, automated Discord scraping, discovery focus

### Week 4 Signals  
**Failures**: No Discord integration usage, complex feature requests, performance complaints  
**Pivots**: Full Discord integration, architecture change, feature simplification

---

## Collaboration Workflow

### Responsibility Distribution
**Wh1rledPeas (Enterprise Experience)**:
- Backend architecture decisions and implementation
- Database design and API security
- Authentication system

**Lead Developer (Modern Frontend)**:
- Astro components and UX design
- Mobile responsiveness and client-side validation
- Integration testing

**Shared**: Code reviews (24hrs), sprint planning, documentation

### Alpha Feature Priorities (Focus, Not Limitations)
**Week 1-2 Focus**:
- ✅ **Proper file upload system** (local storage with migration path to cloud)
- ✅ **Clean price normalization** (proper enum types, validation)
- ✅ **Session-based auth** (HTTP-only cookies, proper security)
- ✅ **Real API endpoints** (proper validation, error handling)

**Week 3-4 Focus**:
- ✅ **Evidence-based reporting** (screenshot uploads, proper storage)
- ✅ **Email + Discord notifications** (proper async queue system)
- ✅ **Basic admin dashboard** (proper permission system)

**Post-Alpha Expansion**:
- 🔄 **Payment processing integration**
- 🔄 **Advanced search with indexing**
- 🔄 **Multi-server architecture**
- 🔄 **In-app messaging system**

---

## Immediate Next Steps

### This Week (Critical Blockers)
1. **Backend architecture decision** (Wh1rledPeas)
2. **Repository setup** with collaboration guidelines
3. **Database schema implementation**
4. **Basic item listing deployment**

**Focus**: Validate we can build and deploy, not feature completeness

---

*This specification prioritizes validated learning over feature completion. Every element exists to test assumptions about user behavior and technical approach.*