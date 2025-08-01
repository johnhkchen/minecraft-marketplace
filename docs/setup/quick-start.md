# Quick Start Guide

> **Fresh Install Guarantee**: Complete setup with a single command

## 🚀 **One-Command Setup**

```bash
# Clone and start the entire marketplace
git clone <repository-url>
cd minecraft-marketplace
docker compose up
```

**That's it!** The marketplace will be available at:
- **Frontend**: http://localhost:7410
- **API Documentation**: http://localhost:7410/docs
- **Direct API**: http://localhost:7413

## ✅ **What Gets Set Up Automatically**

### **Services Started**
- **nginx**: Reverse proxy and static file serving
- **PostgreSQL**: Database with schema and seed data
- **PostgREST**: Auto-generated REST API
- **Valkey**: Session storage (Redis-compatible)
- **Swagger UI**: Interactive API documentation
- **Astro Frontend**: Server-side rendered marketplace
- **Hono Backend**: External integration service

### **Database Initialized**
- Complete PostgreSQL schema with all tables
- Row Level Security policies enforced
- Sample Minecraft items and users loaded
- Database migrations applied automatically

### **Security Configured**
- Discord OAuth ready (configure with your credentials)
- JWT tokens for API authentication
- File upload security with validation
- Rate limiting and CORS protection

## 🔧 **Environment Configuration**

### **Required Setup** (Before First Run)
1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Configure Discord OAuth (minimum required):
   ```bash
   # Edit .env file
   DISCORD_CLIENT_ID=your_discord_client_id
   DISCORD_CLIENT_SECRET=your_discord_client_secret
   DISCORD_WEBHOOK_URL=your_discord_webhook_url
   ```

3. Generate JWT secrets:
   ```bash
   # Use any method to generate 32+ character secrets
   POSTGREST_JWT_SECRET=your_jwt_secret_here_minimum_32_characters
   ASTRO_SECRET_KEY=your_astro_secret_key_here
   ASTRO_SESSION_SECRET=your_session_secret_here
   HONO_JWT_SECRET=your_hono_jwt_secret_here
   ```

### **Optional Configuration**
- **BAML AI Processing**: Configure `BAML_API_KEY` for enhanced item descriptions
- **Custom Domains**: Update `CORS_ORIGIN` and `DISCORD_REDIRECT_URI`
- **Database Credentials**: Change default PostgreSQL credentials
- **Upload Limits**: Adjust `UPLOAD_MAX_SIZE` and allowed file types

## 📊 **Verify Installation**

### **Health Checks**
```bash
# Check all services are running
docker compose ps

# Test database connection
docker compose exec db pg_isready -U marketplace_user -d minecraft_marketplace

# Test API endpoints
curl http://localhost:7413/items
curl http://localhost:7412/health
```

### **Access Points**
- **Marketplace**: http://localhost:7410 - Browse items, create accounts
- **API Docs**: http://localhost:7410/docs - Interactive Swagger documentation
- **Direct API**: http://localhost:7413 - PostgREST auto-generated endpoints
- **Admin Panel**: http://localhost:7410/admin - Shop owner dashboard (after login)

## 🛠️ **Development Mode**

### **Start Development Environment**
```bash
# Use development compose with live reload
docker compose -f infrastructure/docker/compose.dev.yml up

# Or run frontend/backend separately for faster iteration
cd frontend && npm run dev  # Port 7411
cd backend && npm run dev   # Port 7412
```

### **Development Tools**
```bash
# Run tests
npm test                    # Unit and integration tests
npm run test:e2e           # Playwright end-to-end tests

# Code quality
npm run lint               # ESLint + Prettier
npm run type-check         # TypeScript validation

# Database operations
npm run db:migrate         # Apply database migrations
npm run db:seed            # Load sample data
npm run db:reset           # Reset database (destructive!)
```

## 🗄️ **Data Management**

### **Database Access**
```bash
# Connect to PostgreSQL
docker compose exec db psql -U marketplace_user -d minecraft_marketplace

# View tables
\dt

# Sample queries
SELECT * FROM users LIMIT 5;
SELECT * FROM items WHERE is_available = true;
```

### **Sample Data**
The installation includes realistic sample data:
- **Users**: Sample Discord users with shops
- **Items**: Minecraft items with enchantments and pricing
- **Reports**: Community reports with evidence
- **Authentication**: Test users for development

### **Backup & Restore**
```bash
# Create backup
docker compose exec db pg_dump -U marketplace_user minecraft_marketplace > backup.sql

# Restore backup
docker compose exec -i db psql -U marketplace_user minecraft_marketplace < backup.sql
```

## 🔐 **Security Setup**

### **Discord OAuth Configuration**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application
3. Add OAuth2 redirect URL: `http://localhost:7410/api/auth/discord-callback`
4. Copy Client ID and Secret to `.env`

### **Production Security**
- Change all default passwords
- Use secure JWT secrets (32+ characters)
- Configure proper CORS origins
- Set up SSL certificates for HTTPS
- Review file upload restrictions

## ❗ **Troubleshooting**

### **Common Issues**

**Services won't start:**
```bash
# Check logs
docker compose logs

# Rebuild containers
docker compose down
docker compose build --no-cache
docker compose up
```

**Database connection errors:**
```bash
# Check PostgreSQL is ready
docker compose exec db pg_isready

# Verify environment variables
docker compose exec frontend env | grep POSTGRES
```

**Discord OAuth errors:**
- Verify Client ID/Secret are correct
- Check redirect URI matches exactly
- Ensure Discord application is configured properly

**Port conflicts:**
```bash
# Check what's using ports (uncommon ports 7410-7419 used to avoid conflicts)
sudo lsof -i :7410
sudo lsof -i :7411

# Use different ports if needed
docker compose down
# Edit compose.yml to change port mappings
```

### **Getting Help**

1. **Check Logs**: `docker compose logs <service-name>`
2. **Verify Environment**: All required variables in `.env`
3. **Database Status**: `docker compose exec db pg_isready`
4. **Service Health**: `docker compose ps`

## 🎯 **Next Steps**

1. **Configure Discord**: Set up OAuth for authentication
2. **Explore API**: Visit http://localhost:7410/docs for interactive documentation
3. **Add Items**: Create your first marketplace listing
4. **Test Features**: Try community reporting and evidence upload
5. **Review Architecture**: Check [`GAMEPLAN.md`](../../GAMEPLAN.md) for development details

---

**Fresh Install Guarantee**: If `docker compose up` doesn't work immediately, it's a bug. Please report it!