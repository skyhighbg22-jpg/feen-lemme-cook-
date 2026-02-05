# Getting Started with Feen

This guide will walk you through setting up Feen for the first time.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 20+**: [Download](https://nodejs.org/)
- **PostgreSQL 14+**: [Download](https://www.postgresql.org/download/)
- **Redis 7+**: [Download](https://redis.io/download/)
- **Git**: [Download](https://git-scm.com/)

## Installation

### Option 1: Local Development

```bash
# Clone the repository
git clone https://github.com/yethikrishna/feen.git
cd feen

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/feen"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"

# Encryption (IMPORTANT: Use a secure 32-character key)
ENCRYPTION_KEY="your-32-character-encryption-key"
```

Set up the database:

```bash
# Push schema to database
npm run db:push

# Seed demo data (optional)
npm run db:seed
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 2: Docker

```bash
# Clone the repository
git clone https://github.com/yethikrishna/feen.git
cd feen

# Create environment file
cp .env.example .env
# Edit .env with your NEXTAUTH_SECRET and ENCRYPTION_KEY

# Start all services
docker-compose up -d
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## First Steps

### 1. Create an Account

Navigate to the signup page and create your account:

1. Go to `http://localhost:3000/auth/signup`
2. Enter your name, email, and password
3. Click "Create Account"

### 2. Add Your First API Key

Once logged in, add your first API key:

1. Go to **Dashboard** → **API Keys**
2. Click **Add API Key**
3. Select your provider (e.g., OpenAI)
4. Enter a name for the key
5. Paste your API key
6. Click **Add API Key**

Your key is now securely encrypted and stored.

### 3. Create a Shared Access Token

Share your API key securely:

1. Go to **Dashboard** → **Shared Access**
2. Click **Create Shared Access**
3. Select the API key to share
4. Configure limits:
   - Rate limit (requests per minute)
   - Daily limit
   - Expiration date (optional)
   - IP restrictions (optional)
5. Click **Create**

Copy the generated access token - this is shown only once!

### 4. Use the Proxy

Use your shared token to make API calls:

```bash
# Replace YOUR_FEEN_TOKEN with your shared access token
curl http://localhost:3000/api/proxy/v1/chat/completions \
  -H "Authorization: Bearer feen_your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Next Steps

- [Configuration Guide](configuration.md) - Customize your Feen instance
- [API Reference](api-reference.md) - Full API documentation
- [Deployment Guide](deployment.md) - Deploy to production
- [Security Best Practices](security.md) - Secure your installation

## Troubleshooting

### Database Connection Error

If you see a database connection error:

1. Ensure PostgreSQL is running
2. Verify your `DATABASE_URL` is correct
3. Check that the database exists

```bash
# Create database manually if needed
createdb feen
```

### Redis Connection Error

If Redis fails to connect:

1. Ensure Redis is running
2. Verify your `REDIS_URL` is correct

```bash
# Start Redis (macOS)
brew services start redis

# Start Redis (Linux)
sudo systemctl start redis
```

### Encryption Key Error

If you see an encryption key error:

1. Ensure `ENCRYPTION_KEY` is exactly 32 characters
2. Use only alphanumeric characters

```bash
# Generate a secure key
openssl rand -base64 24
```

## Getting Help

- [GitHub Issues](https://github.com/yethikrishna/feen/issues)
- [GitHub Discussions](https://github.com/yethikrishna/feen/discussions)
- Email: yethikrishnarcvn7a@gmail.com
