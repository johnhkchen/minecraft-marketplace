# Technical Architecture Guidelines

> **Purpose**: Define architectural patterns and technical decisions that constrain implementation
> **Scope**: Bridge between requirements and implementation without over-specifying

---

## Architecture Principles

### **Discord-Native Integration**
The system must integrate deeply with Discord as the primary community platform, not treat it as an afterthought.

**Required Integrations**:
- OAuth 2.0 authentication flow with proper error handling
- Webhook notifications for real-time shop owner alerts
- User profile synchronization (username, avatar, email)
- Respect Discord API rate limits and best practices

**Implementation Flexibility**: 
- Choice of Discord library (discord.js, discord.py, etc.)
- Webhook delivery mechanism (direct HTTP, queue-based, etc.)
- OAuth state management approach

### **Evidence-Driven Trust Model**
Community reports must be backed by verifiable evidence to maintain system credibility.

**Required Evidence Types**:
- Screenshot uploads with metadata (timestamp, coordinates)
- Transaction records (trade completion messages)
- External links (server announcements, Discord messages)
- Shop visit confirmations with context

**Quality Mechanisms**:
- Confidence scoring based on evidence quantity/quality
- Auto-approval for high-confidence simple reports
- Manual review workflow for complex changes
- Reporter reputation tracking over time

### **Multi-Currency Price System**
Support Minecraft server economies with different currency standards while enabling comparison.

**Required Currencies**:
- Diamonds (base unit for comparisons)
- Diamond Blocks (9:1 diamond ratio)
- Emeralds (server-specific ratios)
- Iron Ingots/Blocks (server-specific ratios)

**Conversion Logic**:
- Automatic normalization to diamond equivalents
- Server-specific rate configuration
- Historical rate tracking for accuracy
- Real-time price display in multiple units

---

## Data Architecture

### **Core Entity Model**

```
Users
├── Authentication (Discord ID, email, password_hash)
├── Profile (username, avatar, shop_name, discord_contact)
├── Authorization (role, permissions, is_active)
└── Audit (created_at, updated_at, last_login)

Items
├── Identity (name, description, category, minecraft_id)
├── Inventory (stock_quantity, is_available, restock_frequency)
├── Location (user_id, shop_location, server_name)
├── Metadata (enchantments, custom_properties)
└── Audit (created_at, updated_at)

Prices
├── Value (amount, currency_unit, diamond_equivalent)
├── Context (price_type, quantity_discount, bulk_pricing)
├── Lifecycle (is_current, source, created_by)
└── Audit (created_at)

Community_Reports
├── Content (report_type, description, urgency)
├── Reporter (reporter_id, contact, ip_address)
├── Workflow (status, confidence_level, auto_approved)
├── Review (reviewed_by, reviewed_at, review_notes)
└── Metrics (affected_users, community_votes)

Evidence
├── Classification (evidence_type, confidence_level)
├── Content (description, file_id, external_url)
├── Context (timestamp_captured, minecraft_server, coordinates)
└── Verification (verified_by, verification_notes)
```

### **Required Relationships**
- User → Items (1:many, ownership with cascade delete)
- Item → Prices (1:many, historical pricing with current flag)
- Item → Reports (1:many, community feedback)
- Report → Evidence (1:many, supporting documentation)
- User → Sessions (1:many, authentication state)

### **Data Integrity Rules**
- All prices must have positive values and valid currency units
- Stock quantities cannot be negative
- Reports must reference existing, active items
- Evidence files must pass validation (type, size, content)
- Users cannot report on their own items (conflict of interest)

---

## Security Architecture

### **Authentication & Authorization**

**Discord OAuth Flow**:
```
1. User clicks "Login with Discord"
2. Redirect to Discord with proper scopes (identify, email)
3. Handle callback with authorization code
4. Exchange code for access token
5. Fetch user profile information
6. Create/update local user record
7. Generate secure session token
8. Set HTTP-only cookie with session ID
```

**Session Management**:
- Primary storage in Redis for performance
- Database backup for session persistence
- 7-day expiration with activity-based renewal
- Secure cookie configuration (httpOnly, secure, sameSite)

**Permission Model**:
- Role-based access control (user, shop_owner, admin)
- Feature-based permissions for granular control
- Context-aware authorization (users can only edit own items)

### **Input Security**

**API Validation**:
- All inputs validated at API boundary
- Type checking and range validation
- SQL injection prevention via parameterized queries
- Rate limiting on sensitive endpoints (reporting, authentication)

**File Upload Security**:
- MIME type validation with content verification
- File size limits (10MB maximum)
- Virus scanning capability (optional but recommended)
- UUID-based filenames to prevent path traversal
- Access control based on evidence ownership

**XSS Prevention**:
- Server-side input sanitization
- Content Security Policy headers
- Proper encoding in frontend templates
- No innerHTML usage with user content

---

## Performance Architecture

### **Database Performance**

**Required Indexes**:
- Full-text search on item names/descriptions
- Category and server filtering
- Price range queries on diamond_equivalent
- User ownership lookups
- Report status and date queries

**Query Optimization**:
- Search queries must complete <2 seconds with 10,000+ items
- Price filtering must complete <500ms
- Report dashboard loads must complete <1 second
- Connection pooling required for concurrent users

**Caching Strategy**:
- Redis for frequently accessed data (search results, user sessions)
- Application-level caching for conversion rates
- Browser caching for static assets
- Cache invalidation on data updates

### **File Serving**

**Upload Processing**:
- Async processing for large file uploads
- Progress indicators for user feedback
- Temporary storage with cleanup processes
- Metadata extraction and storage

**Serving Strategy**:
- Direct file serving for development
- CDN integration capability for production
- Access control via signed URLs or proxy
- Image optimization and resizing

---

## Integration Patterns

### **Discord Webhook Architecture**

**Notification Types**:
- New report submissions → Shop owner DM/channel
- Report approvals/rejections → Reporter notification
- System alerts → Admin channel
- Bulk updates → Summary notifications

**Delivery Requirements**:
- Retry logic for failed deliveries
- Graceful degradation if webhooks unavailable  
- Rate limit compliance with Discord API
- Structured message format with embeds

**Error Handling**:
- Log webhook failures for debugging
- Fallback to email notifications if configured
- Queue-based delivery for reliability
- Monitoring for webhook health

### **External Service Integration**

**File Storage Options**:
- Local filesystem (development/small scale)
- AWS S3/Digital Ocean Spaces (production scale)
- Image processing service integration
- Content delivery network support

**Monitoring Integration**:
- Health check endpoints for uptime monitoring
- Structured logging for error tracking
- Performance metrics collection
- Alert integration for critical issues

---

## Deployment Architecture

### **Container Strategy**

**Multi-Container Setup**:
```
web-app:
  - Astro/Node.js application server
  - Static file serving capability
  - Health check endpoint

database:
  - PostgreSQL with proper configuration
  - Volume mounting for data persistence
  - Backup automation capability

redis:
  - Session storage and caching
  - Persistence for session recovery
  - Memory optimization settings

worker (optional):
  - Background job processing
  - File upload processing
  - Notification delivery
```

### **Environment Configuration**

**Required Environment Variables**:
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db
DATABASE_MAX_CONNECTIONS=20

# Authentication
DISCORD_CLIENT_ID=oauth_client_id
DISCORD_CLIENT_SECRET=oauth_client_secret
SESSION_SECRET=32_char_random_string

# File Storage
UPLOAD_DIRECTORY=/app/uploads
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif

# Performance
REDIS_URL=redis://host:port
CACHE_TTL_SECONDS=3600
RATE_LIMIT_WINDOW_MS=60000

# Security
SECURE_COOKIES=true_in_production
CORS_ORIGINS=https://yourdomain.com
CSP_POLICY=default-src_'self'
```

### **Scaling Considerations**

**Horizontal Scaling Path**:
- Load balancer for multiple app instances
- Shared Redis for session consistency
- Database connection pooling optimization
- File storage migration to cloud services

**Monitoring Requirements**:
- Application performance metrics
- Database query performance
- File storage usage tracking
- User activity analytics

---

## Development Guidelines

### **Code Organization**

**Service Layer Pattern**:
- Business logic isolated from HTTP handling
- Dependency injection for testability
- Clear separation of concerns
- Consistent error handling patterns

**API Design**:
- RESTful endpoints with consistent patterns
- Proper HTTP status codes
- Structured error responses
- API versioning capability

**Testing Strategy**:
- Unit tests for business logic (>80% coverage)
- Integration tests for API endpoints
- Security tests for input validation
- Performance tests for critical paths

### **Quality Requirements**

**Code Quality**:
- TypeScript strict mode for type safety
- ESLint rules for consistency
- Prettier for code formatting
- Pre-commit hooks for quality gates

**Security Testing**:
- SQL injection prevention validation
- XSS vulnerability testing
- File upload security testing
- Authentication flow security review

**Performance Testing**:
- Load testing for concurrent users
- Database query performance testing
- File upload performance validation
- Search performance under load

---

*These architectural guidelines provide necessary constraints while allowing implementation flexibility. Teams can choose specific frameworks, libraries, and patterns within these boundaries to meet system requirements effectively.*