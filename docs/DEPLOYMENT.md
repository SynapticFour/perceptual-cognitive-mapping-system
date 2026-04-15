# Deployment Guide
## Perceptual & Cognitive Mapping System

### Overview

This guide covers deployment options for PCMS v1.0, including Vercel, Docker, and self-hosted configurations.

### Prerequisites

- Node.js 18+
- Supabase account (for production data collection)
- Domain name (optional)
- SSL certificate (for production)

### Environment Configuration

#### Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Server-only Configuration
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEARCH_EXPORT_API_KEY=your_export_api_key
RESEARCH_API_KEY=your_research_api_key

# Optional Configuration
RESEARCH_COOKIE_SECRET=your_cookie_secret
NODE_ENV=production
LOG_LEVEL=warn
```

#### Environment-Specific Settings

**Development:**
```bash
NODE_ENV=development
LOG_LEVEL=debug
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
```

**Staging:**
```bash
NODE_ENV=production
LOG_LEVEL=info
RATE_LIMITING_ENABLED=true
MONITORING_ENABLED=true
```

**Production:**
```bash
NODE_ENV=production
LOG_LEVEL=warn
RATE_LIMITING_ENABLED=true
MONITORING_ENABLED=true
SECURITY_HEADERS_ENABLED=true
```

### Vercel Deployment (Recommended)

#### 1. Repository Setup

```bash
# Connect to Vercel
vercel link

# Import project
vercel import
```

#### 2. Environment Variables

```bash
# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add RESEARCH_EXPORT_API_KEY
vercel env add RESEARCH_API_KEY
```

#### 3. Build Configuration

Update `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, must-revalidate"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/((?!api|_next/static|_next/image|favicon.ico).*)",
      "destination": "/index.html"
    }
  ]
}
```

#### 4. Deploy

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

### Docker Deployment

#### 1. Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Build application
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "start"]
```

#### 2. Docker Compose

```yaml
version: '3.8'

services:
  pcms-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - RESEARCH_EXPORT_API_KEY=${RESEARCH_EXPORT_API_KEY}
      - RESEARCH_API_KEY=${RESEARCH_API_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - pcms-app
    restart: unless-stopped
```

#### 3. Nginx Configuration

```nginx
events {
    worker_connections 1024;
}

http {
    upstream pcms {
        server pcms-app:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/ssl/cert.pem;
        ssl_certificate_key /etc/ssl/key.pem;

        location / {
            proxy_pass http://pcms;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/ {
            proxy_pass http://pcms;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Rate limiting
            limit_req zone=api burst=20 nodelay;
        }
    }

    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
```

#### 4. Deploy with Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Update
docker-compose pull
docker-compose up -d
```

### Self-Hosted Deployment

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y
```

#### 2. Application Setup

```bash
# Clone repository
git clone https://github.com/your-org/perceptual-cognitive-mapping-system.git
cd perceptual-cognitive-mapping-system

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your values
```

#### 3. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'pcms',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

#### 4. Start Application

```bash
# Create logs directory
mkdir logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

#### 5. SSL Certificate

```bash
# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Setup auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Security Configuration

#### 1. Security Headers

Add to `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co;",
          },
        ],
      },
    ];
  },
};
```

#### 2. Rate Limiting

Apply to API routes:

```typescript
// middleware.ts
import { createRateLimitMiddleware } from '@/lib/rate-limiter';

export function middleware(request: Request) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimit = createRateLimitMiddleware(publicApiLimiter);
    return rateLimit(request);
  }
}
```

#### 3. Environment Security

```bash
# Secure .env.local
chmod 600 .env.local

# Add to .gitignore
echo ".env.local" >> .gitignore

# Use secrets management in production
# AWS Secrets Manager, Azure Key Vault, etc.
```

### Monitoring and Logging

#### 1. Application Monitoring

```typescript
// lib/monitoring.ts
// Already implemented in the codebase
// Enable in production:
const monitoring = new MonitoringService();
```

#### 2. Log Management

```bash
# Configure log rotation
sudo nano /etc/logrotate.d/pcms

# Content:
/path/to/pcms/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload pcms
    endscript
}
```

#### 3. Health Checks

```bash
# Add to crontab
*/5 * * * * curl -f http://localhost:3000/api/health || pm2 restart pcms
```

### Performance Optimization

#### 1. Build Optimization

```bash
# Analyze bundle size
npm run analyze

# Enable compression
# Already configured in next.config.ts
```

#### 2. Caching

```typescript
// Add to API routes
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

#### 3. CDN Configuration

```bash
# Configure CDN for static assets
# Vercel Edge Network automatically handles this
# For self-hosted: CloudFlare, AWS CloudFront
```

### Backup and Recovery

#### 1. Database Backups

```bash
# Supabase automated backups
# Configure in Supabase dashboard

# Manual backup
pg_dump -h db.supabase.co -U postgres -d postgres > backup.sql
```

#### 2. Application Backups

```bash
# Backup application code
tar -czf pcms-backup-$(date +%Y%m%d).tar.gz .

# Backup environment variables
cp .env.local .env.local.backup.$(date +%Y%m%d)
```

#### 3. Recovery Procedures

```bash
# Restore application
tar -xzf pcms-backup-20240101.tar.gz
npm ci
npm run build
pm2 restart pcms

# Restore database
psql -h db.supabase.co -U postgres -d postgres < backup.sql
```

### Troubleshooting

#### Common Issues

**Build Failures:**
```bash
# Clear cache
rm -rf .next
npm run build

# Check Node version
node --version  # Should be 18+
```

**Database Connection:**
```bash
# Test connection
curl -I https://your-project.supabase.co/rest/v1/

# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

**Performance Issues:**
```bash
# Check PM2 status
pm2 status

# Monitor resources
pm2 monit

# Check logs
pm2 logs
```

#### Health Check Endpoints

```bash
# Application health
curl http://localhost:3000/api/health

# Database health
curl http://localhost:3000/api/test/database

# Full system health
curl http://localhost:3000/api/test/health
```

### Maintenance

#### Regular Tasks

**Weekly:**
- Check application logs
- Monitor performance metrics
- Review security updates

**Monthly:**
- Update dependencies
- Review backup status
- Check SSL certificates

**Quarterly:**
- Security audit
- Performance review
- Capacity planning

#### Update Process

```bash
# Update dependencies
npm update

# Test in staging
npm run test
npm run build

# Deploy to production
git pull origin main
npm ci
npm run build
pm2 reload pcms
```

This deployment guide covers all major deployment scenarios for PCMS. Choose the option that best fits your infrastructure and requirements.
