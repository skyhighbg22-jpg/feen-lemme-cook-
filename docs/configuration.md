# Configuration

This guide covers all configuration options for Feen.

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/feen` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `NEXTAUTH_URL` | Base URL of your application | `https://feen.example.com` |
| `NEXTAUTH_SECRET` | Secret for session encryption (min 32 chars) | `your-super-secret-key-here` |
| `ENCRYPTION_KEY` | Key for API key encryption (exactly 32 chars) | `your-32-char-encryption-key!!` |

### Optional Variables

#### OAuth Providers

```env
# GitHub OAuth
GITHUB_CLIENT_ID="your-client-id"
GITHUB_CLIENT_SECRET="your-client-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

#### Stripe (Billing)

```env
STRIPE_SECRET_KEY="sk_..."
STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

#### Email (Notifications)

```env
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-username"
SMTP_PASS="your-password"
EMAIL_FROM="noreply@feen.example.com"
```

#### Application Settings

```env
# Default rate limits for new keys
DEFAULT_RATE_LIMIT=1000
DEFAULT_DAILY_LIMIT=10000

# Application info
APP_NAME="Feen"
APP_URL="https://feen.example.com"
```

## Database Configuration

### PostgreSQL Settings

For production, consider these PostgreSQL settings:

```sql
-- Recommended for production
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '16MB';
```

### Connection Pooling

For high-traffic deployments, use connection pooling:

```env
# With PgBouncer
DATABASE_URL="postgresql://user:pass@pgbouncer:6432/feen?pgbouncer=true"
```

## Redis Configuration

### Basic Setup

```env
REDIS_URL="redis://localhost:6379"

# With password
REDIS_URL="redis://:password@localhost:6379"

# With TLS
REDIS_URL="rediss://user:password@redis.example.com:6379"
```

### Redis Cluster

For Redis Cluster deployments, configure via code in `src/lib/redis.ts`.

## Rate Limiting

### Default Limits

```typescript
// In src/lib/redis.ts
const DEFAULT_RATE_LIMITS = {
  // Requests per minute for shared tokens
  sharedToken: 100,

  // Requests per minute for API endpoints
  api: 60,

  // Login attempts per minute
  auth: 5,
};
```

### Custom Limits per Token

When creating shared tokens, you can specify custom limits:

```json
{
  "rateLimit": 200,     // Requests per minute
  "dailyLimit": 5000    // Requests per day
}
```

## Security Settings

### Session Configuration

```typescript
// In src/lib/auth.ts
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 days
}
```

### CORS Configuration

```typescript
// In next.config.ts
async headers() {
  return [
    {
      source: "/api/:path*",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "https://your-domain.com" },
        { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
        { key: "Access-Control-Allow-Headers", value: "Authorization,Content-Type" },
      ],
    },
  ];
}
```

## Feature Flags

Control features via environment variables:

```env
# Enable/disable features
ENABLE_MARKETPLACE=true
ENABLE_TEAMS=true
ENABLE_BILLING=true
ENABLE_OAUTH=true
```

## Logging

### Log Levels

```env
# Log level: debug, info, warn, error
LOG_LEVEL=info

# Enable detailed request logging
DEBUG_REQUESTS=false
```

### Audit Log Retention

```env
# Days to retain audit logs
AUDIT_LOG_RETENTION_DAYS=90
```

## Performance Tuning

### Caching

```env
# Cache TTL in seconds
CACHE_TTL_SECONDS=3600

# Enable response caching
ENABLE_RESPONSE_CACHE=true
```

### Proxy Settings

```env
# Proxy timeout in milliseconds
PROXY_TIMEOUT_MS=30000

# Maximum request body size
MAX_BODY_SIZE="2mb"
```

## Deployment-Specific

### Vercel

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### Docker

See `docker-compose.yml` for Docker configuration.

### Kubernetes

Example ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: feen-config
data:
  NODE_ENV: "production"
  NEXTAUTH_URL: "https://feen.example.com"
```

## Troubleshooting Configuration

### Validate Configuration

```bash
# Check environment variables
npm run config:validate

# Test database connection
npm run db:test

# Test Redis connection
npm run redis:test
```

### Common Issues

1. **Invalid ENCRYPTION_KEY**: Must be exactly 32 characters
2. **Database connection failed**: Check DATABASE_URL format
3. **Redis connection failed**: Ensure Redis is running
4. **OAuth not working**: Verify callback URLs match NEXTAUTH_URL
