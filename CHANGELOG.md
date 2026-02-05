# Changelog

All notable changes to Feen will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-02-05

### Added

- **Security Hardening**
  - Token scoping system with granular endpoint/operation restrictions
  - HMAC request signing for tamper-proof requests
  - Automatic token rotation on suspicious activity detection
  - Two-factor authentication (TOTP) for sensitive operations
  - Replay attack prevention with nonce validation

- **Production Readiness**
  - Comprehensive health check endpoints (`/api/health`, `/api/health/ready`, `/api/health/live`)
  - Standardized error handling with `FeenError` class and error codes
  - Webhook notification system for usage alerts and security events
  - Zod validation schemas for all API inputs

- **User Experience**
  - Interactive usage dashboard with Recharts visualizations
  - Copy-paste SDK snippets (Python, Node.js, TypeScript, cURL)
  - 4-step onboarding flow for new users
  - Real-time usage indicators

- **Infrastructure**
  - CI/CD pipeline with GitHub Actions (lint, test, build, deploy)
  - Terraform configurations for AWS infrastructure (VPC, ECS, RDS, Redis, ALB, WAF)
  - Prometheus/Grafana monitoring stack with pre-configured dashboards
  - Alert rules for application, database, and infrastructure monitoring
  - Loki/Promtail log aggregation setup

### Changed

- Updated package.json with `type-check` script alias
- Improved error messages across API endpoints

### Security

- Added request signing verification middleware
- Implemented suspicious activity detection and automatic token rotation
- Added TOTP-based 2FA for key reveal, token creation, and sensitive actions
- WAF rules for common attack protection

---

## [1.0.0] - 2024-01-15

### Added

- **Core Features**
  - End-to-end AES-256-GCM encryption for all API keys
  - Multi-provider support (OpenAI, Anthropic, Google, Azure, Cohere, Mistral, Groq, Together, Replicate, Hugging Face)
  - Secure shared access tokens with granular permissions
  - Real-time usage analytics and audit logging
  - Team collaboration with role-based access control (RBAC)

- **Security**
  - Zero-knowledge architecture for API key storage
  - bcrypt password hashing with cost factor 12
  - JWT-based session management
  - Rate limiting at multiple levels
  - IP whitelisting for shared tokens
  - Comprehensive audit logging

- **Dashboard**
  - Modern, responsive UI built with Next.js 15 and React 19
  - API key management interface
  - Shared token management with custom limits
  - Usage analytics and charts
  - Team management
  - Settings and profile management

- **API**
  - RESTful API for all operations
  - Proxy API for AI provider requests
  - Rate limiting with Redis
  - Comprehensive error handling

- **Marketplace** (Foundation)
  - Listing creation for API access
  - Purchase flow structure
  - Rating and review system

- **Deployment**
  - Docker and Docker Compose support
  - Kubernetes-ready configuration
  - Vercel deployment support
  - Environment variable configuration

- **Documentation**
  - Getting Started guide
  - Configuration reference
  - API documentation
  - Security best practices
  - Deployment guides

### Security

- Initial security review completed
- Encryption implementation audited
- Rate limiting tested

---

## [Unreleased]

### Planned

- API SDK packages (JavaScript, Python) - npm/pip publishing
- SSO/SAML integration
- Advanced analytics with ML-based anomaly detection
- Stripe billing integration (full implementation)
- Mobile app (React Native)
- GraphQL API support
- Multi-region deployment support

---

## Version History

- **1.1.0** - Security hardening, production readiness, and infrastructure
- **1.0.0** - Initial public release

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to this project.

## Reporting Issues

Please report security vulnerabilities to yethikrishnarcvn7a@gmail.com.
For bugs and feature requests, use [GitHub Issues](https://github.com/yethikrishna/feen/issues).
