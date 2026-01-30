# Local Vendor AI Marketplace - Deployment Guide

## 🚀 Quick Start Deployment

Your Local Vendor AI Marketplace is ready for production deployment! Follow these steps to get your application running.

### Prerequisites

- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)
- **OpenSSL** (for SSL certificate generation)
- **curl** (for health checks)

### 1. Environment Configuration

1. Copy the production environment template:
   ```bash
   cp .env.production .env
   ```

2. Edit `.env` file with your production values:
   ```bash
   nano .env
   ```

   **Required Configuration:**
   - Database passwords (PostgreSQL, MongoDB, Redis)
   - JWT secrets (use strong, unique values)
   - External API keys (Google Translate, Twilio, etc.)
   - Domain names and URLs

### 2. SSL Certificates

For production, you have two options:

#### Option A: Use Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/nginx/ssl/key.pem
```

#### Option B: Self-signed (Development/Testing)
The deployment script will automatically generate self-signed certificates if none are found.

### 3. Deploy the Application

Run the deployment script:
```bash
./scripts/deploy.sh
```

The script will:
- ✅ Check prerequisites
- ✅ Generate SSL certificates (if needed)
- ✅ Create data backups
- ✅ Build and deploy all services
- ✅ Run health checks
- ✅ Show deployment status

### 4. Verify Deployment

After deployment, your application will be available at:

- **Frontend**: https://localhost (or your domain)
- **API**: https://localhost/api
- **AI Services**: https://localhost/ai
- **Health Check**: https://localhost/health

## 📋 Management Commands

### View Logs
```bash
./scripts/deploy.sh logs
```

### Check Status
```bash
./scripts/deploy.sh status
```

### Create Backup
```bash
./scripts/deploy.sh backup
```

### Run Health Checks
```bash
./scripts/deploy.sh health
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Restart Services
```bash
docker-compose -f docker-compose.prod.yml restart
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NGINX Proxy   │────│   Frontend      │    │   Backend API   │
│   (Port 80/443) │    │   (Next.js)     │────│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              │
         │              ┌─────────────────┐            │
         └──────────────│   AI Services   │────────────┘
                        │   (FastAPI)     │
                        └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │    MongoDB      │    │     Redis       │
│   (User Data)   │    │ (Market Data)   │    │    (Cache)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Configuration Details

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_PASSWORD` | PostgreSQL database password | ✅ |
| `MONGO_PASSWORD` | MongoDB database password | ✅ |
| `REDIS_PASSWORD` | Redis cache password | ✅ |
| `JWT_SECRET` | JWT signing secret (32+ chars) | ✅ |
| `JWT_REFRESH_SECRET` | JWT refresh secret | ✅ |
| `GOOGLE_TRANSLATE_API_KEY` | Google Translate API key | ⚠️ |
| `TWILIO_ACCOUNT_SID` | Twilio SMS service SID | ⚠️ |
| `TWILIO_AUTH_TOKEN` | Twilio SMS auth token | ⚠️ |
| `SMTP_HOST` | Email SMTP server | ⚠️ |
| `SMTP_USER` | Email username | ⚠️ |
| `SMTP_PASS` | Email password | ⚠️ |

⚠️ = Required for full functionality

### Port Configuration

| Service | Internal Port | External Port | Description |
|---------|---------------|---------------|-------------|
| NGINX | 80, 443 | 80, 443 | Web server and SSL termination |
| Frontend | 3000 | - | Next.js application |
| Backend | 5000 | - | Node.js API server |
| AI Services | 8000 | - | Python FastAPI services |
| PostgreSQL | 5432 | 5432* | User and transaction data |
| MongoDB | 27017 | 27017* | Market analytics data |
| Redis | 6379 | 6379* | Caching and sessions |

*External ports can be customized in `.env` file

## 🔒 Security Features

### Built-in Security
- **SSL/TLS Encryption**: All traffic encrypted with HTTPS
- **Rate Limiting**: API rate limiting to prevent abuse
- **Security Headers**: HSTS, CSP, XSS protection
- **Authentication**: JWT-based authentication with refresh tokens
- **Input Validation**: Comprehensive input validation and sanitization
- **Database Security**: Parameterized queries, connection pooling

### Security Headers
```nginx
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
```

### Rate Limiting
- **API Endpoints**: 10 requests/second
- **Authentication**: 5 requests/second
- **Burst Handling**: Configurable burst limits

## 📊 Monitoring and Logging

### Health Checks
All services include health check endpoints:
- **Backend**: `GET /health`
- **AI Services**: `GET /health`
- **Frontend**: `GET /` (homepage)
- **NGINX**: `GET /health`

### Log Files
```
logs/
├── deploy.log          # Deployment logs
├── nginx/
│   ├── access.log      # NGINX access logs
│   └── error.log       # NGINX error logs
└── docker-compose.log  # Container logs
```

### Monitoring Commands
```bash
# View all service logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Monitor resource usage
docker stats

# Check service health
curl https://localhost/health
```

## 🔄 Backup and Recovery

### Automated Backups
The deployment script automatically creates backups before deployment:
```
backups/
└── backup_YYYYMMDD_HHMMSS/
    ├── postgres_backup.sql
    └── mongodb_backup/
```

### Manual Backup
```bash
# Create backup
./scripts/deploy.sh backup

# Restore PostgreSQL
docker exec -i local-vendor-postgres-prod psql -U postgres < backup.sql

# Restore MongoDB
docker exec -i local-vendor-mongodb-prod mongorestore /backup/path
```

### Data Persistence
All data is stored in Docker volumes:
- `postgres_data`: PostgreSQL database files
- `mongodb_data`: MongoDB database files
- `redis_data`: Redis persistence files

## 🚀 Scaling and Performance

### Horizontal Scaling
To scale individual services:
```bash
# Scale backend API
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale AI services
docker-compose -f docker-compose.prod.yml up -d --scale ai-services=2
```

### Performance Tuning
1. **Database Optimization**:
   - Adjust PostgreSQL `shared_buffers` and `work_mem`
   - Configure MongoDB `wiredTigerCacheSizeGB`
   - Tune Redis `maxmemory` settings

2. **Application Tuning**:
   - Increase Node.js worker processes
   - Adjust Python FastAPI worker count
   - Configure NGINX worker processes

3. **Caching Strategy**:
   - Redis for session storage
   - NGINX static file caching
   - Application-level caching

## 🐛 Troubleshooting

### Common Issues

#### Services Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check system resources
docker system df
free -h
```

#### Database Connection Issues
```bash
# Check database status
docker-compose -f docker-compose.prod.yml ps

# Test database connectivity
docker exec local-vendor-postgres-prod pg_isready -U postgres
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in docker/nginx/ssl/cert.pem -text -noout

# Regenerate self-signed certificates
rm docker/nginx/ssl/*
./scripts/deploy.sh
```

#### Performance Issues
```bash
# Monitor resource usage
docker stats

# Check application logs
docker-compose -f docker-compose.prod.yml logs backend | grep ERROR
```

### Getting Help
1. Check the logs: `./scripts/deploy.sh logs`
2. Verify health checks: `./scripts/deploy.sh health`
3. Review configuration: `./scripts/deploy.sh status`
4. Check system resources: `docker system df && free -h`

## 🔄 Updates and Maintenance

### Application Updates
```bash
# Pull latest code
git pull origin main

# Redeploy
./scripts/deploy.sh
```

### Security Updates
```bash
# Update base images
docker-compose -f docker-compose.prod.yml pull

# Rebuild with latest security patches
docker-compose -f docker-compose.prod.yml build --no-cache

# Deploy updates
./scripts/deploy.sh
```

### Database Maintenance
```bash
# PostgreSQL maintenance
docker exec local-vendor-postgres-prod psql -U postgres -c "VACUUM ANALYZE;"

# MongoDB maintenance
docker exec local-vendor-mongodb-prod mongo --eval "db.runCommand({compact: 'collection_name'})"
```

## 📈 Production Checklist

Before going live, ensure:

- [ ] **Security**
  - [ ] Strong passwords for all databases
  - [ ] Valid SSL certificates installed
  - [ ] Firewall configured (only ports 80, 443 open)
  - [ ] Regular security updates scheduled

- [ ] **Performance**
  - [ ] Load testing completed
  - [ ] Database indexes optimized
  - [ ] Caching configured
  - [ ] CDN setup (if needed)

- [ ] **Monitoring**
  - [ ] Health checks configured
  - [ ] Log aggregation setup
  - [ ] Alerting configured
  - [ ] Backup verification scheduled

- [ ] **External Services**
  - [ ] Google Translate API configured
  - [ ] Twilio SMS service setup
  - [ ] Email SMTP configured
  - [ ] Domain DNS configured

- [ ] **Documentation**
  - [ ] API documentation updated
  - [ ] User guides created
  - [ ] Admin procedures documented
  - [ ] Emergency contacts listed

## 🎉 Success!

Your Local Vendor AI Marketplace is now deployed and ready for production use! 

**Next Steps:**
1. Configure your domain DNS to point to your server
2. Set up monitoring and alerting
3. Create user documentation
4. Plan your launch strategy

**Support:**
- Check logs: `./scripts/deploy.sh logs`
- Monitor health: `./scripts/deploy.sh health`
- View status: `./scripts/deploy.sh status`

Happy selling! 🛒✨