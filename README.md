<p align="center">
  <img src="docs/images/feen-logo.svg" alt="Feen Logo" width="120" height="120">
</p>

<h1 align="center">Feen</h1>

<p align="center">
  <strong>Secure API Key Sharing Platform</strong>
</p>

<p align="center">
  The open-source solution for managing, sharing, and monetizing your API keys securely.
  <br />
  Built for developers, teams, and enterprises.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
  <img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen" alt="Node Version">
</p>

---

## Why Feen?

Managing API keys across teams is challenging. Sharing them via Slack or email is insecure. Rotating keys is a pain. Tracking usage is nearly impossible.

**Feen solves this by providing:**

- **Secure Storage**: AES-256 encryption for all API keys
- **Granular Sharing**: Create access tokens with custom limits and restrictions
- **Usage Tracking**: Real-time analytics and audit logs
- **Team Collaboration**: Role-based access control for organizations
- **API Marketplace**: Buy and sell API access securely

## Features

### Core Features

- **End-to-End Encryption**: Your API keys are encrypted at rest using AES-256-GCM
- **Zero-Knowledge Architecture**: We never store or see your actual keys
- **Shared Access Tokens**: Create tokens with custom:
  - Rate limits (requests per minute)
  - Daily usage limits
  - IP whitelisting
  - Model restrictions
  - Expiration dates
- **Real-Time Analytics**: Track usage, costs, and performance
- **Audit Logging**: Complete history of all key access and modifications

### Supported Providers

| Provider | Status | Features |
|----------|--------|----------|
| OpenAI | ✅ Full Support | Chat, Completions, Embeddings, Images, Audio |
| Anthropic | ✅ Full Support | Messages, Completions |
| Google AI | ✅ Full Support | Gemini, PaLM |
| Azure OpenAI | ✅ Full Support | All Azure OpenAI endpoints |
| Cohere | ✅ Full Support | Generate, Embed, Classify |
| Mistral AI | ✅ Full Support | Chat, Embeddings |
| Groq | ✅ Full Support | Chat Completions |
| Together AI | ✅ Full Support | All models |
| Replicate | ✅ Full Support | All models |
| Hugging Face | ✅ Full Support | Inference API |
| Custom | ✅ Full Support | Any REST API |

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 7+

### Installation

```bash
# Clone the repository
git clone https://github.com/yethikrishna/feen.git
cd feen

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up the database
npm run db:push

# Seed demo data (optional)
npm run db:seed

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Using Docker

```bash
# Clone and start with Docker Compose
git clone https://github.com/yethikrishna/feen.git
cd feen

# Start all services
docker-compose up -d

# The app will be available at http://localhost:3000
```

## Usage

### 1. Add Your API Keys

```typescript
// Via the dashboard or API
POST /api/keys
{
  "name": "Production OpenAI",
  "provider": "OPENAI",
  "apiKey": "sk-..."
}
```

### 2. Create Shared Access

```typescript
// Create a limited access token
POST /api/shared
{
  "apiKeyId": "key_xxx",
  "name": "Team Access",
  "rateLimit": 100,
  "dailyLimit": 1000,
  "expiresAt": "2025-12-31T23:59:59Z",
  "allowedModels": ["gpt-4", "gpt-3.5-turbo"]
}
```

### 3. Use the Proxy

```bash
# Use your shared token through the Feen proxy
curl https://your-feen-instance.com/api/proxy/v1/chat/completions \
  -H "Authorization: Bearer feen_xxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client/App    │────▶│   Feen Proxy    │────▶│  AI Provider    │
│                 │◀────│   (Rate Limit)  │◀────│  (OpenAI, etc.) │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
              ┌─────▼─────┐ ┌────▼────┐ ┌─────▼─────┐
              │PostgreSQL │ │  Redis  │ │   Queue   │
              │ (Storage) │ │ (Cache) │ │  (Jobs)   │
              └───────────┘ └─────────┘ └───────────┘
```

See [Architecture Documentation](docs/architecture.md) for detailed system design.

## Documentation

- [Getting Started](docs/getting-started.md)
- [Configuration](docs/configuration.md)
- [API Reference](docs/api-reference.md)
- [Deployment Guide](docs/deployment.md)
- [Security](docs/security.md)
- [Contributing](CONTRIBUTING.md)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for session encryption | Yes |
| `NEXTAUTH_URL` | Base URL of your application | Yes |
| `ENCRYPTION_KEY` | 32-character key for API key encryption | Yes |

See [.env.example](.env.example) for all available options.

## Contributing

We love contributions! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a Pull Request.

### Development Setup

```bash
# Install dependencies
npm install

# Start development services
docker-compose -f docker-compose.dev.yml up -d

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Security

Security is our top priority. If you discover a security vulnerability, please send an email to yethikrishnarcvn7a@gmail.com instead of using the issue tracker.

See [SECURITY.md](SECURITY.md) for our security policy.

## License

Feen is open-source software licensed under the [MIT License](LICENSE).

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database ORM by [Prisma](https://prisma.io/)
- Authentication by [NextAuth.js](https://next-auth.js.org/)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/yethikrishna">Yethikrishna R</a>
</p>

<p align="center">
  <a href="https://github.com/yethikrishna/feen">GitHub</a> •
  <a href="https://feen.dev">Website</a> •
  <a href="https://twitter.com/yethikrishna">Twitter</a>
</p>
