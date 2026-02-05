# Architecture

This document describes the system architecture of Feen.

## Overview

Feen is a secure API key management and sharing platform built with modern technologies:

- **Frontend**: Next.js 15 with React 19
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: NextAuth.js

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Web App  │  │   CLI    │  │   SDK    │  │  Agents  │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
└───────┼─────────────┼─────────────┼─────────────┼───────────────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             │
                    ┌────────▼────────┐
                    │   CDN / Edge    │
                    │  (CloudFront)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Load Balancer  │
                    │     (ALB)       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │      WAF        │
                    │  (Rate Limit)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐   ┌────────▼────────┐  ┌───────▼───────┐
│  Web Server   │   │   API Server    │  │ Proxy Server  │
│  (Next.js)    │   │  (API Routes)   │  │  (Proxy API)  │
└───────┬───────┘   └────────┬────────┘  └───────┬───────┘
        │                    │                   │
        └────────────────────┼───────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐   ┌────────▼────────┐  ┌───────▼───────┐
│  PostgreSQL   │   │     Redis       │  │  Message Queue│
│  (Database)   │   │    (Cache)      │  │    (BullMQ)   │
└───────────────┘   └─────────────────┘  └───────┬───────┘
                                                 │
                                         ┌───────▼───────┐
                                         │    Worker     │
                                         │  (Background) │
                                         └───────────────┘
```

## Component Details

### Web Application

The Next.js application serves both the frontend and backend:

```
src/
├── app/                  # Next.js App Router
│   ├── (marketing)/      # Public pages
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   └── dashboard/        # Protected dashboard
├── components/           # React components
├── lib/                  # Utility libraries
└── types/                # TypeScript types
```

### API Layer

RESTful API endpoints:

| Endpoint | Purpose |
|----------|---------|
| `/api/auth/*` | Authentication |
| `/api/keys` | API key management |
| `/api/shared` | Shared token management |
| `/api/proxy/*` | AI provider proxy |
| `/api/analytics` | Usage analytics |
| `/api/teams` | Team management |

### Database Schema

Core entities:

```
┌──────────────┐       ┌──────────────┐
│    User      │       │    Team      │
├──────────────┤       ├──────────────┤
│ id           │───┐   │ id           │
│ email        │   │   │ name         │
│ password     │   │   │ slug         │
│ name         │   └──▶│ ownerId      │
└──────┬───────┘       └──────────────┘
       │
       │  ┌──────────────┐
       │  │   ApiKey     │
       │  ├──────────────┤
       └─▶│ id           │
          │ name         │
          │ encryptedKey │
          │ provider     │
          │ userId       │
          └──────┬───────┘
                 │
                 │  ┌──────────────┐
                 │  │  SharedKey   │
                 │  ├──────────────┤
                 └─▶│ id           │
                    │ accessToken  │
                    │ rateLimit    │
                    │ apiKeyId     │
                    └──────────────┘
```

### Caching Strategy

Redis is used for:

1. **Session Data**: User sessions and tokens
2. **Rate Limiting**: Request counters per key/IP
3. **API Key Cache**: Decrypted keys (short TTL)
4. **Usage Counters**: Real-time usage tracking

```typescript
// Rate limit key structure
`ratelimit:${type}:${identifier}:${window}`

// Cache key structure
`cache:${resource}:${id}`
```

### Proxy Flow

```
1. Client sends request with Feen token
   ↓
2. Validate token (hash lookup)
   ↓
3. Check rate limits (Redis)
   ↓
4. Decrypt API key
   ↓
5. Forward to provider
   ↓
6. Log usage (async)
   ↓
7. Return response
```

### Background Jobs

BullMQ handles async tasks:

- Usage aggregation
- Email notifications
- Cleanup jobs
- Billing updates

## Security Architecture

### Encryption Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Plain Key  │────▶│   Encrypt   │────▶│  Encrypted  │
│   (Input)   │     │  (AES-256)  │     │  (Storage)  │
└─────────────┘     └─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Encrypted  │────▶│   Decrypt   │────▶│  Plain Key  │
│  (Storage)  │     │  (AES-256)  │     │  (Proxy)    │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Login  │────▶│ Verify  │────▶│  Issue  │────▶│  Store  │
│  Form   │     │Password │     │   JWT   │     │ Cookie  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
```

## Scaling Considerations

### Horizontal Scaling

- Stateless application servers
- Shared Redis for state
- Database connection pooling

### Vertical Scaling

| Component | Scaling Strategy |
|-----------|-----------------|
| App Server | Add replicas |
| Database | Read replicas, connection pooling |
| Redis | Redis Cluster |
| Queue | Multiple workers |

### High Availability

```
┌─────────────────────────────────────────┐
│           Load Balancer                  │
│         (Multi-AZ)                       │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼───┐   ┌───▼───┐   ┌───▼───┐
│ App 1 │   │ App 2 │   │ App 3 │
│ (AZ-a)│   │ (AZ-b)│   │ (AZ-c)│
└───────┘   └───────┘   └───────┘
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, React, Tailwind CSS |
| Backend | Next.js API Routes, Node.js |
| Database | PostgreSQL, Prisma ORM |
| Cache | Redis |
| Queue | BullMQ |
| Auth | NextAuth.js |
| Crypto | Node.js crypto, bcryptjs |

## Data Flow

### Create API Key

```
1. User submits key via UI
2. Server validates input
3. Key is encrypted (AES-256)
4. Hash is generated
5. Stored in database
6. Audit log created
```

### Use Proxy

```
1. Request with Feen token
2. Token hash lookup
3. Rate limit check
4. Key decryption
5. Provider request
6. Async logging
7. Response returned
```

## Monitoring Points

- Request latency
- Error rates
- Rate limit hits
- Token usage
- Database performance
- Cache hit ratio
