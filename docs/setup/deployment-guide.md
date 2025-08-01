# Deployment Guide

> **Complete deployment instructions for all supported platforms**

## 🚀 Quick Deployment Options

### **For Impatient Deployers:**
```bash
# Local deployment (works anywhere with Docker)
git clone <repository-url>
cd minecraft-marketplace
just up

# Access: http://localhost:7410
```

### **For Production:**
Choose your platform:
- **🏠 Homelab/VPS**: [Coolify](#coolify-homelab-deployment) (recommended)
- **☁️ Cloud**: [Railway](#railway-deployment) or [Render](#render-deployment)
- **🐳 Any Docker Host**: [Generic Docker](#generic-docker-deployment)

---

## 🏠 Coolify Homelab Deployment

**Best for: Self-hosted, homelab, VPS with domain control**

Coolify provides the most complete deployment experience with automatic SSL, git integration, and service management.

### **Prerequisites**
- VPS or homelab server with Docker
- Domain name pointing to your server
- [Coolify installed](https://coolify.io/docs/installation) on your server

### **Deployment Steps**

#### **1. Create New Resource in Coolify**
1. **Log into Coolify dashboard**
2. **Click "Create New Resource"**
3. **Select "Docker Compose"**
4. **Choose "From Git Repository"**

#### **2. Repository Configuration**
```yaml
Repository URL: https://github.com/your-username/minecraft-marketplace
Branch: main
Docker Compose Location: config/docker/compose.yml
```

#### **3. Environment Variables**
Set these in Coolify's environment section:
```bash
# Database Configuration
POSTGRES_DB=minecraft_marketplace
POSTGRES_USER=marketplace_user  
POSTGRES_PASSWORD=<generate-secure-password>

# Application Configuration
NODE_ENV=production
APP_URL=https://your-domain.com

# Discord Integration (optional)
DISCORD_CLIENT_ID=<your-discord-client-id>
DISCORD_CLIENT_SECRET=<your-discord-client-secret>

# Security
JWT_SECRET=<generate-secure-jwt-secret>
```

#### **4. Domain & SSL Configuration**
1. **Set your domain** in Coolify (e.g., `marketplace.yourdomain.com`)
2. **Enable automatic SSL** (Let's Encrypt)
3. **Port mapping**: Coolify will handle this automatically

#### **5. Deploy**
1. **Click "Deploy"** in Coolify
2. **Monitor build logs** in real-time
3. **Wait for services to start** (~2-3 minutes)
4. **Access your marketplace** at your configured domain

#### **6. Verify Deployment**
```bash
# Check service health via Coolify dashboard or:
curl https://your-domain.com/api/data/health
```

### **Coolify Advantages**
- ✅ **Automatic SSL certificates** (Let's Encrypt)
- ✅ **Git integration** - auto-deploy on push
- ✅ **Built-in monitoring** and log aggregation
- ✅ **Easy rollbacks** to previous versions
- ✅ **Resource monitoring** (CPU, memory, disk)
- ✅ **Backup management** for databases
- ✅ **Zero-downtime deployments**

### **Coolify Management Commands**
```bash
# View logs
# Use Coolify dashboard → Services → Logs

# Manual deploy trigger
# Coolify dashboard → Deployments → Deploy

# Database backup
# Coolify dashboard → Databases → Backup

# Environment updates
# Coolify dashboard → Environment → Edit → Deploy
```

---

## ☁️ Railway Deployment

**Best for: Quick cloud deployment, managed services**

### **Prerequisites**
- Railway account ([railway.app](https://railway.app))
- GitHub repository with your code

### **Deployment Steps**

#### **1. Connect Repository**
1. **Visit** [railway.app/new](https://railway.app/new)
2. **Select "Deploy from GitHub"**
3. **Choose your minecraft-marketplace repository**

#### **2. Configure Services**
Railway will auto-detect the Docker setup. Configure these services:

##### **Frontend Service**
```yaml
Build Command: npm run build:frontend
Start Command: npm run start:frontend
Port: 4321
```

##### **Backend Service**  
```yaml
Build Command: npm run build:backend
Start Command: npm run start:backend
Port: 3001
```

##### **Database Service**
1. **Add PostgreSQL service** from Railway marketplace
2. **Note the connection details** (auto-populated)

#### **3. Environment Variables**
Set in Railway dashboard:
```bash
# Auto-populated by Railway PostgreSQL service
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Application Configuration
NODE_ENV=production
APP_URL=${{RAILWAY_STATIC_URL}}

# Discord Integration (optional)
DISCORD_CLIENT_ID=<your-discord-client-id>
DISCORD_CLIENT_SECRET=<your-discord-client-secret>

# Security
JWT_SECRET=<generate-secure-jwt-secret>
```

#### **4. Custom Domain (Optional)**
1. **Go to Settings** → **Domains** 
2. **Add your custom domain**
3. **Configure DNS** as instructed

#### **5. Deploy**
Railway auto-deploys on git push. Monitor in the dashboard.

### **Railway Management**
```bash
# CLI management (optional)
npm install -g @railway/cli
railway login
railway status
railway logs
railway shell
```

---

## 🌊 Render Deployment

**Best for: Simple cloud deployment, automatic scaling**

### **Prerequisites**
- Render account ([render.com](https://render.com))
- GitHub repository

### **Deployment Steps**

#### **1. Create Web Service**
1. **Visit Render dashboard**
2. **New** → **Web Service**
3. **Connect GitHub repository**

#### **2. Service Configuration**
```yaml
Name: minecraft-marketplace
Environment: Docker
Docker Context Directory: .
Dockerfile Path: config/docker/Dockerfile.frontend
```

#### **3. Add PostgreSQL Database**
1. **New** → **PostgreSQL**
2. **Note connection details**

#### **4. Environment Variables**
```bash
# Database (from Render PostgreSQL service)
DATABASE_URL=<render-postgresql-connection-string>

# Application
NODE_ENV=production
PORT=10000

# Discord Integration (optional)
DISCORD_CLIENT_ID=<your-discord-client-id>
DISCORD_CLIENT_SECRET=<your-discord-client-secret>

# Security
JWT_SECRET=<generate-secure-jwt-secret>
```

#### **5. Deploy**
Render auto-deploys on git push to main branch.

---

## 🐳 Generic Docker Deployment

**Best for: Any VPS, dedicated server, or cloud instance**

### **Prerequisites**
- Linux server with Docker and Docker Compose
- Domain name (recommended) or public IP

### **Deployment Steps**

#### **1. Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login to activate docker group
```

#### **2. Deploy Application**
```bash
# Clone repository
git clone <repository-url>
cd minecraft-marketplace

# Create environment file
cp .env.example .env

# Edit environment variables
nano .env
```

#### **3. Environment Configuration**
```bash
# .env file
POSTGRES_DB=minecraft_marketplace
POSTGRES_USER=marketplace_user
POSTGRES_PASSWORD=<generate-secure-password>

NODE_ENV=production
APP_URL=https://your-domain.com

# Discord Integration (optional)
DISCORD_CLIENT_ID=<your-discord-client-id>
DISCORD_CLIENT_SECRET=<your-discord-client-secret>

# Security
JWT_SECRET=<generate-secure-jwt-secret>
```

#### **4. Start Services**
```bash
# Start production services
just up

# Or manually:
docker compose -f config/docker/compose.yml up -d

# Verify deployment
curl http://localhost:7410
```

#### **5. Reverse Proxy Setup (Recommended)**

##### **Option A: nginx**
```nginx
# /etc/nginx/sites-available/minecraft-marketplace
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:7410;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

##### **Option B: Caddy**
```caddy
# Caddyfile
your-domain.com {
    reverse_proxy localhost:7410
}
```

#### **6. SSL Certificate**
```bash
# Using Certbot with nginx
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# Using Caddy (automatic HTTPS)
# SSL is automatic with Caddy configuration above
```

---

## 🔧 Configuration Options

### **Environment Variables Reference**

#### **Required Variables**
```bash
POSTGRES_DB=minecraft_marketplace
POSTGRES_USER=marketplace_user
POSTGRES_PASSWORD=<secure-password>
NODE_ENV=production
```

#### **Optional Variables**
```bash
# Application
APP_URL=https://your-domain.com
PORT=4321
API_PORT=3001

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Discord Integration
DISCORD_CLIENT_ID=<discord-app-client-id>
DISCORD_CLIENT_SECRET=<discord-app-client-secret>
DISCORD_REDIRECT_URI=${APP_URL}/api/auth/discord/callback

# Security
JWT_SECRET=<64-character-random-string>
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Performance
CACHE_TTL=300
MAX_CONNECTIONS=10

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
```

### **Performance Tuning**

#### **Database Optimization**
```bash
# PostgreSQL tuning in docker-compose
environment:
  - POSTGRES_SHARED_PRELOAD_LIBRARIES=pg_stat_statements
  - POSTGRES_MAX_CONNECTIONS=100
  - POSTGRES_SHARED_BUFFERS=256MB
  - POSTGRES_EFFECTIVE_CACHE_SIZE=1GB
```

#### **Application Optimization**
```bash
# Node.js performance
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=2048"
UV_THREADPOOL_SIZE=4
```

---

## 📊 Monitoring & Management

### **Health Checks**
```bash
# Application health
curl https://your-domain.com/api/health

# Database health  
curl https://your-domain.com/api/data/health

# Service status
just status  # or docker compose ps
```

### **Backup Strategy**

#### **Database Backups**
```bash
# Manual backup
just db-backup

# Automated backups (add to crontab)
0 2 * * * cd /path/to/minecraft-marketplace && just db-backup

# Backup retention (keep 7 days)
find ./tmp/backups -name "*.db" -mtime +7 -delete
```

#### **Application Backups**
```bash
# Configuration backup
tar -czf marketplace-config-$(date +%Y%m%d).tar.gz .env config/
```

### **Log Management**
```bash
# View logs
just logs

# Rotate logs (add to logrotate)
/var/log/containers/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
}
```

---

## 🚨 Troubleshooting

### **Common Issues**

#### **Services Won't Start**
```bash
# Check logs
just logs

# Check port conflicts
sudo netstat -tulpn | grep :7410

# Restart services
just down && just up
```

#### **Database Connection Issues**
```bash
# Test database connection
docker compose exec db psql -U marketplace_user -d minecraft_marketplace -c "SELECT 1;"

# Reset database (DESTRUCTIVE!)
just db-reset
```

#### **SSL Certificate Issues**
```bash
# Renew Certbot certificates
sudo certbot renew

# Check certificate expiry
openssl s_client -connect your-domain.com:443 -servername your-domain.com 2>/dev/null | openssl x509 -noout -dates
```

#### **Performance Issues**
```bash
# Check resource usage
just stats

# Monitor database
docker compose exec db psql -U marketplace_user -d minecraft_marketplace -c "SELECT * FROM pg_stat_activity;"

# Clear application cache
docker compose restart valkey
```

---

## 🔄 Update & Maintenance

### **Application Updates**
```bash
# Pull latest code
git pull origin main

# Update and rebuild
just update

# Or manually:
just down
git pull
just build
just up
```

### **Database Migrations**
```bash
# Check migration status
just db-status

# Run migrations
just db-migrate

# Rollback (if supported)
just db-rollback
```

### **Security Updates**
```bash
# Update base images
docker compose pull
just build --no-cache
just up

# Update system packages (server)
sudo apt update && sudo apt upgrade -y
```

---

## 📋 Deployment Checklist

### **Pre-Deployment**
- [ ] Domain configured and DNS propagated
- [ ] SSL certificate ready (or auto-configured)
- [ ] Environment variables configured
- [ ] Discord application created (if using Discord features)
- [ ] Database backup strategy planned

### **Post-Deployment**
- [ ] Health checks passing (`just health`)
- [ ] SSL certificate working
- [ ] All features tested manually
- [ ] Monitoring configured
- [ ] Backup automated
- [ ] Documentation updated with deployment details

### **Security Checklist**
- [ ] Environment variables secured (not in git)
- [ ] Database password strong and unique
- [ ] JWT secret generated and secured
- [ ] Firewall configured (only necessary ports open)
- [ ] SSL/TLS configured and working
- [ ] Regular security updates planned

---

## 🎯 Platform Comparison

| Feature | Coolify | Railway | Render | Generic Docker |
|---------|---------|---------|--------|----------------|
| **Setup Time** | 10 min | 5 min | 5 min | 30 min |
| **Auto SSL** | ✅ | ✅ | ✅ | Manual |
| **Git Integration** | ✅ | ✅ | ✅ | Manual |
| **Monitoring** | ✅ Built-in | ✅ Built-in | Basic | Manual |
| **Backups** | ✅ Automated | Manual | Manual | Manual |
| **Cost** | Self-hosted | $5+/month | $7+/month | Server only |
| **Control** | Full | Limited | Limited | Full |
| **Best For** | Homelab/VPS | Quick start | Simple apps | Custom setups |

---

**🎉 Your Minecraft Marketplace is now deployed and ready for your community!**