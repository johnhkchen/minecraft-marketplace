# Minecraft Marketplace - System Requirements Specification

> **Purpose**: Define WHAT the system must do and WHY, not HOW to implement it
> **Audience**: Developers, stakeholders, and future maintainers who need to understand system behavior

---

## Problem Statement

**Context**: Minecraft multiplayer server economies lack price transparency and community oversight.

**Current Issues**:
- Players cannot easily compare prices across different shops
- No mechanism to report outdated prices or stock information  
- Shop owners have limited visibility into community feedback
- Price information becomes stale without community maintenance
- New players struggle to understand fair market values

**Impact**: This leads to information asymmetry, potential scams, market inefficiency, and poor player experience.

---

## Solution Vision

**Core Hypothesis**: A community-driven marketplace with evidence-based reporting will create price transparency and improve market efficiency through collective oversight.

**Key Insight**: Discord is the primary communication platform for Minecraft communities, so integration should be native, not an afterthought.

**Value Propositions**:
1. **Price Discovery**: Players can find fair market prices across multiple shops
2. **Community Oversight**: Anyone can report price/stock changes with evidence
3. **Shop Owner Tools**: Efficient workflow for managing inventory and community feedback
4. **Trust Through Evidence**: Reports backed by screenshots/transactions have higher credibility
5. **Native Discord Integration**: Authentication and notifications through existing community platform

---

## User Stories & Acceptance Criteria

### **Epic 1: Price Discovery**

#### **As a player, I want to search for items so I can find the best prices**
- **Given** items exist in the marketplace
- **When** I search for "diamond sword"
- **Then** I see all available diamond swords with current prices
- **And** prices are shown in multiple currency units (diamonds, emeralds, iron)
- **And** results show stock availability and seller information
- **And** search results load in under 2 seconds

#### **As a player, I want to filter search results so I can find specific items**
- **Given** search results are displayed
- **When** I filter by category, server, or price range
- **Then** results update to match my criteria
- **And** I can sort by price, date, or relevance
- **And** filtering is instantaneous (<500ms)

#### **As a player, I want to see price history so I can understand market trends**
- **Given** an item has price change history
- **When** I view item details
- **Then** I see recent price changes with dates
- **And** I can see if prices are trending up or down
- **And** I understand why prices changed (community reports)

### **Epic 2: Community Reporting**

#### **As a community member, I want to report price changes so the marketplace stays accurate**
- **Given** I notice a price discrepancy
- **When** I submit a price change report with evidence
- **Then** the shop owner is notified via Discord
- **And** my report includes timestamp and confidence level
- **And** I receive confirmation that my report was submitted

**Evidence Requirements**:
- Screenshots of shop interfaces showing prices
- Transaction records (trade completion messages)
- Shop visit confirmations with timestamps
- External links to server announcements

#### **As a community member, I want to report stock status so players know availability**
- **Given** I notice an item is out of stock or back in stock
- **When** I submit a stock status report
- **Then** the marketplace immediately reflects this change
- **And** high-confidence reports are auto-approved
- **And** the shop owner can override if incorrect

#### **As a shop owner, I want to review community reports so I can maintain accurate listings**
- **Given** I receive a community report about my items
- **When** I access my shop dashboard
- **Then** I see all pending reports with evidence
- **And** I can approve or reject each report with reasons
- **And** approved reports automatically update my listings
- **And** I receive Discord notifications for new reports

### **Epic 3: Discord Integration**

#### **As a user, I want to login with Discord so I don't need another account**
- **Given** I want to access marketplace features
- **When** I click "Login with Discord"
- **Then** I authenticate through Discord OAuth
- **And** my Discord profile information is used for my marketplace account
- **And** I remain logged in across browser sessions

#### **As a shop owner, I want Discord notifications so I know about reports immediately**
- **Given** someone submits a report about my items
- **When** the report is created
- **Then** I receive a Discord DM or webhook notification
- **And** the notification includes report summary and evidence
- **And** I can click a link to review the full report

#### **As a community member, I want to use my existing Discord identity so others recognize me**
- **Given** I'm active in the server's Discord community
- **When** I submit reports or manage items
- **Then** my Discord username and avatar are displayed
- **And** other community members can identify me easily

### **Epic 4: Shop Management**

#### **As a shop owner, I want to list my items so players can find them**
- **Given** I have items to sell
- **When** I create a new listing
- **Then** I specify item details, price, and stock quantity
- **And** I can set prices in any supported currency unit
- **And** the system calculates equivalent values automatically
- **And** my listing appears in search results immediately

#### **As a shop owner, I want to manage my inventory so listings stay current**
- **Given** I have active listings
- **When** I access my shop dashboard
- **Then** I can update prices, stock quantities, and descriptions
- **And** I can mark items as temporarily unavailable
- **And** changes are reflected immediately in search results

#### **As a shop owner, I want to understand my shop's performance so I can optimize**
- **Given** I have been selling items over time
- **When** I view my analytics dashboard
- **Then** I see view counts, sales volume, and price trends
- **And** I understand which items are most popular
- **And** I can identify items that need price adjustments

---

## System Behaviors

### **Authentication & Authorization**

**Behavior**: The system shall authenticate users primarily through Discord OAuth
- Users can login with Discord account
- Traditional email/password available as fallback
- Sessions persist across browser restarts
- Automatic logout after 7 days of inactivity

**Behavior**: The system shall enforce role-based permissions
- Anonymous users can search and view items
- Authenticated users can submit reports
- Shop owners can manage their own items and review reports
- Administrators can manage any content

### **Data Integrity & Validation**

**Behavior**: The system shall maintain data consistency
- All prices automatically normalized to diamond equivalents for comparison
- Stock quantities cannot go negative
- Items cannot exist without valid owner
- Reports must reference existing items

**Behavior**: The system shall validate all user inputs
- File uploads limited to images under 10MB
- Price values must be positive numbers
- Required fields enforced at API level
- Malicious content filtered and rejected

### **Performance Requirements**

**Behavior**: The system shall respond quickly to user actions
- Search results display in under 2 seconds
- Item filtering occurs in under 500ms
- Price updates reflect immediately
- File uploads show progress indicators

**Behavior**: The system shall handle concurrent usage
- Multiple users can search simultaneously without degradation
- Report submissions don't block other operations
- Database connections pooled and managed efficiently

### **Security Requirements**

**Behavior**: The system shall protect user data and prevent attacks
- All database queries use parameterized statements
- User sessions stored securely with HTTP-only cookies
- File uploads validated for type and content
- Rate limiting prevents abuse of reporting system

**Behavior**: The system shall maintain audit trails
- All price changes logged with timestamps and sources
- Report approvals/rejections recorded with reasons
- User actions tracked for accountability
- System access logged for security monitoring

---

## Data Model Requirements

### **Core Entities**

**Users**
- Must have unique identifiers (username, email, Discord ID)
- Can have optional shop information (name, description, Discord contact)
- Have assigned roles determining permissions
- Track creation date and last activity

**Items**
- Must belong to a valid user (shop owner)
- Have descriptive information (name, description, category)
- Include Minecraft-specific metadata (item ID, enchantments)
- Track stock quantities and availability status
- Associated with specific server/location

**Prices**
- Must be positive values in supported currency units
- Automatically converted to standard equivalent for comparisons
- Track historical changes with timestamps and sources
- Support bulk pricing and quantity discounts

**Community Reports**
- Must reference existing items
- Include report type, description, and evidence
- Track workflow status and review process
- Store reporter information (may be anonymous)
- Calculate confidence levels based on evidence quality

**Evidence**
- Must be associated with a report
- Support multiple types (screenshots, transactions, links)
- Include metadata (timestamps, locations, amounts)
- Validate file types and sizes for uploads
- Track verification status

### **Relationships**

**User-Item**: One user can own many items (shop inventory)
**Item-Price**: One item can have many historical prices
**Item-Report**: One item can have many community reports
**Report-Evidence**: One report can have multiple pieces of evidence
**User-Session**: One user can have multiple active sessions

### **Business Rules**

**Price Conversion**: System maintains conversion rates between currency units
- 1 Diamond Block = 9 Diamonds
- 1 Emerald = 0.5 Diamonds  
- 1 Iron Block = 9 Iron Ingots = 0.9 Diamonds

**Report Confidence**: System calculates confidence based on evidence
- High: Multiple evidence types + good reporter history
- Medium: Some evidence or established reporter
- Low: Minimal evidence or new reporter

**Auto-Approval**: High-confidence stock status reports auto-approve
- Out of stock / Back in stock reports with screenshot evidence
- Price change reports require manual review
- Shop closure reports always require manual review

---

## Integration Requirements

### **Discord Integration**

**OAuth Authentication**
- Must integrate with Discord OAuth 2.0 flow
- Retrieve user profile information (username, avatar, email)
- Handle OAuth errors and edge cases gracefully
- Support account linking for existing users

**Webhook Notifications**
- Send structured notifications to shop owners
- Include report summaries with evidence previews
- Provide direct links to review interface
- Handle webhook failures with retry logic

### **File Storage**

**Evidence Upload**
- Support common image formats (PNG, JPEG, GIF, WebP)
- Generate unique identifiers to prevent conflicts
- Implement access control based on report ownership
- Provide secure serving with proper headers

**Storage Management**
- Organize files by date/type for maintenance
- Implement cleanup for expired or unused files
- Support future migration to cloud storage
- Track storage usage and limits

---

## Quality Requirements

### **Reliability**
- System uptime: 99.9% (less than 8.77 hours downtime per year)
- Data backup: Full database backup daily, point-in-time recovery
- Error recovery: Graceful handling of database/service failures
- Monitoring: Real-time alerts for system health issues

### **Scalability**
- Concurrent users: Support 100+ simultaneous users
- Data volume: Handle 10,000+ items and 50,000+ reports
- Search performance: Maintain sub-2s response times as data grows
- Storage growth: Accommodate increasing file upload volume

### **Usability**
- Mobile responsive: Full functionality on mobile devices
- Accessibility: Meet WCAG 2.1 AA standards
- Loading states: Clear feedback during operations
- Error messages: Helpful guidance for users

### **Maintainability**
- Code coverage: >80% test coverage on business logic
- Documentation: Up-to-date API and deployment docs
- Monitoring: Comprehensive logging and metrics
- Updates: Zero-downtime deployment capability

---

## Success Metrics

### **User Adoption**
- Monthly active users: 50+ within 3 months
- Shop owner registration: 5+ active shops
- Community engagement: 25+ reports submitted monthly
- Discord integration usage: 80%+ of users authenticate via Discord

### **System Quality**
- Search accuracy: Users find desired items 90%+ of the time
- Report quality: 80%+ of reports include evidence
- Response time: Shop owners respond to reports within 48 hours average
- System reliability: <1% error rate for core functions

### **Business Impact**
- Price accuracy: Community reports reduce price staleness by 60%
- Market efficiency: Price discovery time reduced by 50%
- User satisfaction: 4+ stars average rating from users
- Community growth: Server marketplace activity increases 25%

---

## Architectural Constraints

### **Technology Requirements**
- **Database**: PostgreSQL (relational model required for complex queries and data integrity)
- **API Layer**: PostgREST (auto-generated REST API from PostgreSQL schema)
- **Session Storage**: Valkey (Redis-compatible, open source, high performance)
- **Authentication**: Discord OAuth 2.0 integration (community platform requirement)
- **Runtime**: Node.js ecosystem (team expertise and Discord library support)
- **Web Framework**: Astro v5.x (SSR + API routes, component flexibility, performance)
- **Frontend Components**: Svelte (reactive components, minimal runtime overhead)
- **Testing Framework**: Vitest (fast, native ESM support, TypeScript integration)
- **Containerization**: Docker deployment (operational consistency requirement)

### **Integration Requirements**
- **Discord API**: OAuth flow, webhook notifications, user profile access
- **File Storage**: Secure upload/serving for evidence images (local or cloud)
- **Session Management**: Persistent user sessions with Valkey storage
- **Search Engine**: Full-text search capability for item discovery
- **Real-time Updates**: Price/stock changes reflected immediately

### **Performance Constraints**
- **Response Times**: Search <2s, filtering <500ms, updates immediate
- **Concurrency**: Support 100+ simultaneous users without degradation
- **Data Scale**: Handle 10,000+ items, 50,000+ reports efficiently
- **File Limits**: 10MB max upload size, common image formats only

### **Security Requirements**
- **SQL Injection**: Parameterized queries mandatory
- **Session Security**: HTTP-only cookies, secure transmission
- **File Validation**: Type/size checking, malware scanning capability
- **Rate Limiting**: Prevent abuse of reporting and API endpoints
- **Access Control**: Role-based permissions, evidence file protection

### **Operational Constraints**
- **Deployment**: Single-server deployment initially, cloud migration path
- **Monitoring**: Health checks, error logging, performance metrics
- **Backup**: Database backup/restore capability
- **Maintenance**: Zero-downtime deployment for updates
- **Team Size**: Maintainable by 1-2 developers maximum

### **Business Constraints**
- **Discord ToS**: Comply with Discord's Terms of Service and API limits
- **No Monetization**: Free service initially, no payment processing required
- **Community Standards**: Safe for Minecraft community (all ages)
- **Server Resources**: Typical VPS capabilities (2-4 CPU cores, 4-8GB RAM)

### **Assumptions & Dependencies**
- **Discord Adoption**: 80%+ of target users have Discord accounts
- **Community Participation**: Users will submit evidence-based reports
- **Shop Owner Engagement**: Owners will respond to community reports
- **Evidence Quality**: Screenshots/transactions sufficient for validation
- **Market Dynamics**: Community oversight will improve price accuracy

---

*This specification defines the system's required behaviors and success criteria without prescribing implementation details. Any solution meeting these requirements would be considered successful, regardless of specific technical choices.*