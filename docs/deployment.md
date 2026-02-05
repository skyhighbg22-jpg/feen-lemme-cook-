# Deployment Guide

This guide covers deploying Feen to various platforms.

## Prerequisites

Before deploying, ensure you have:

- PostgreSQL database (managed or self-hosted)
- Redis instance (managed or self-hosted)
- Domain name (optional but recommended)
- SSL certificate (required for production)

## Environment Setup

Create these environment variables for production:

```env
# Required
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/feen
REDIS_URL=redis://host:6379
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secure-secret-min-32-chars
ENCRYPTION_KEY=your-32-character-encryption-key

# Optional
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

## Docker Deployment

### Using Docker Compose

```bash
# Clone the repository
git clone https://github.com/yethikrishna/feen.git
cd feen

# Create .env file
cp .env.example .env
# Edit .env with production values

# Build and start
docker-compose up -d --build

# Run migrations
docker-compose exec app npm run db:push
```

### Production Docker Compose

```yaml
# docker-compose.prod.yml
version: "3.9"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    restart: always
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
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: always
```

## Vercel Deployment

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yethikrishna/feen)

### Manual Setup

1. Fork the repository
2. Import to Vercel
3. Configure environment variables
4. Deploy

### Environment Variables in Vercel

Add these in Vercel dashboard → Settings → Environment Variables:

```
DATABASE_URL
REDIS_URL
NEXTAUTH_URL
NEXTAUTH_SECRET
ENCRYPTION_KEY
```

### Database Setup for Vercel

Use a managed PostgreSQL service:
- [Vercel Postgres](https://vercel.com/storage/postgres)
- [Supabase](https://supabase.com/)
- [Neon](https://neon.tech/)
- [PlanetScale](https://planetscale.com/) (MySQL)

### Redis Setup for Vercel

Use a managed Redis service:
- [Upstash](https://upstash.com/) (recommended)
- [Redis Cloud](https://redis.com/cloud/)

## AWS Deployment

### Using ECS

1. **Create ECR Repository**

```bash
aws ecr create-repository --repository-name feen
```

2. **Build and Push Image**

```bash
# Login to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URL

# Build
docker build -t feen .

# Tag and push
docker tag feen:latest $ECR_URL/feen:latest
docker push $ECR_URL/feen:latest
```

3. **Create ECS Task Definition**

```json
{
  "family": "feen",
  "containerDefinitions": [
    {
      "name": "feen",
      "image": "${ECR_URL}/feen:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..." },
        { "name": "ENCRYPTION_KEY", "valueFrom": "arn:aws:secretsmanager:..." }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/feen",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "512",
  "memory": "1024"
}
```

### Using AWS App Runner

1. Push code to GitHub
2. Create App Runner service
3. Configure environment variables
4. Deploy

## Google Cloud Deployment

### Using Cloud Run

```bash
# Build
gcloud builds submit --tag gcr.io/PROJECT_ID/feen

# Deploy
gcloud run deploy feen \
  --image gcr.io/PROJECT_ID/feen \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=feen-db:latest
```

## Kubernetes Deployment

### Helm Chart (coming soon)

```bash
helm repo add feen https://charts.feen.dev
helm install feen feen/feen \
  --set database.url=$DATABASE_URL \
  --set redis.url=$REDIS_URL
```

### Manual Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: feen
spec:
  replicas: 3
  selector:
    matchLabels:
      app: feen
  template:
    metadata:
      labels:
        app: feen
    spec:
      containers:
        - name: feen
          image: ghcr.io/yethikrishna/feen:latest
          ports:
            - containerPort: 3000
          envFrom:
            - secretRef:
                name: feen-secrets
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: feen
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 3000
  selector:
    app: feen
```

## SSL/TLS Configuration

### Using Nginx

```nginx
server {
    listen 80;
    server_name feen.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name feen.example.com;

    ssl_certificate /etc/letsencrypt/live/feen.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/feen.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Health Checks

Add a health check endpoint:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

## Monitoring

### Recommended Tools

- **Metrics**: Prometheus + Grafana
- **Logging**: ELK Stack or Loki
- **APM**: Sentry, New Relic, or Datadog

### Basic Monitoring Setup

```typescript
// Add to src/lib/monitoring.ts
export function trackMetric(name: string, value: number, tags?: Record<string, string>) {
  // Send to your monitoring service
}
```

## Scaling Considerations

### Horizontal Scaling

- Feen is stateless and can scale horizontally
- Use Redis for shared state (sessions, rate limits)
- Database connection pooling is recommended

### Recommended Resources

| Traffic | CPU | Memory | Replicas |
|---------|-----|--------|----------|
| Low (<1k/day) | 0.5 vCPU | 512MB | 1 |
| Medium (<10k/day) | 1 vCPU | 1GB | 2-3 |
| High (<100k/day) | 2 vCPU | 2GB | 3-5 |
| Very High | 4+ vCPU | 4GB+ | 5+ |

## Backup Strategy

### Database Backups

```bash
# Daily backup script
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Automated Backups

Use your cloud provider's backup features:
- AWS RDS: Automated snapshots
- GCP Cloud SQL: Automated backups
- Vercel Postgres: Point-in-time recovery
