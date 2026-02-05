# Security

This document details the security measures implemented in Feen.

## Encryption

### API Key Encryption

All API keys are encrypted before storage using:

- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **IV**: Randomly generated 16 bytes per encryption
- **Authentication**: GCM tag for integrity verification

```typescript
// Encryption process
const encrypted = encrypt(apiKey);
// Returns: base64(iv + authTag + ciphertext)
```

### Data at Rest

- API keys: AES-256-GCM encrypted
- Passwords: bcrypt with cost factor 12
- Sessions: JWT with HS256 signature

### Data in Transit

- All connections require TLS 1.2+
- HTTPS enforced in production
- Secure cookies with HttpOnly, Secure, SameSite flags

## Authentication

### Password Requirements

- Minimum 8 characters
- Hashed using bcrypt (cost factor 12)
- No maximum length limit

### Session Management

- JWT-based sessions
- 30-day maximum session lifetime
- Secure, HttpOnly cookies
- CSRF protection via SameSite

### OAuth Providers

Supported providers:
- GitHub
- Google

All OAuth flows use PKCE for enhanced security.

## Authorization

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| Owner | Full access, delete team |
| Admin | Manage keys, invite members |
| Member | Create/use keys |
| Viewer | View only |

### Resource Ownership

- Users can only access their own resources
- Team resources require team membership
- Shared tokens have independent access control

## Rate Limiting

### Implementation

Multiple layers of rate limiting:

1. **Global**: 1000 requests/minute per IP
2. **API Endpoints**: 60 requests/minute per user
3. **Shared Tokens**: Configurable per token
4. **Authentication**: 5 attempts/minute per IP

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1705312800
```

## Input Validation

### Request Validation

All inputs are validated using Zod schemas:

```typescript
const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  // ...
});
```

### SQL Injection Prevention

- Prisma ORM with parameterized queries
- No raw SQL queries
- Input sanitization

### XSS Prevention

- React's automatic escaping
- Content-Security-Policy headers
- HTTPOnly cookies

## Audit Logging

### Logged Events

- User registration
- Authentication attempts
- API key operations (create, update, delete, reveal)
- Shared token operations
- Team membership changes

### Log Contents

```json
{
  "id": "...",
  "userId": "...",
  "action": "API_KEY_REVEALED",
  "resource": "apiKey",
  "resourceId": "...",
  "ipAddress": "...",
  "userAgent": "...",
  "createdAt": "..."
}
```

### Log Retention

Default: 90 days (configurable)

## Network Security

### Headers

Security headers applied to all responses:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

### CORS

- Configurable allowed origins
- Credentials only with explicit allow-list
- Preflight caching

## Secrets Management

### Environment Variables

Required secrets:
- `NEXTAUTH_SECRET`: Session encryption (min 32 chars)
- `ENCRYPTION_KEY`: API key encryption (exactly 32 chars)
- `DATABASE_URL`: Database credentials

### Best Practices

1. Never commit secrets to version control
2. Use secret management services in production
3. Rotate secrets regularly
4. Use different secrets per environment

## Vulnerability Response

### Reporting

Report vulnerabilities to: yethikrishnarcvn7a@gmail.com

### Response Timeline

- Critical: 24-72 hours
- High: 1-2 weeks
- Medium: 2-4 weeks
- Low: Next release

### Disclosure Policy

- 90-day disclosure window
- Coordinated disclosure preferred
- Credit given to reporters

## Compliance Considerations

### Data Privacy

- Minimal data collection
- User data exportable
- Account deletion supported
- No third-party tracking

### GDPR Readiness

- Consent management
- Data portability
- Right to erasure
- Processing records

## Security Checklist

### Deployment

- [ ] Use HTTPS only
- [ ] Set secure NEXTAUTH_SECRET
- [ ] Set secure ENCRYPTION_KEY
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up monitoring
- [ ] Regular backups
- [ ] Keep dependencies updated

### Operations

- [ ] Review audit logs regularly
- [ ] Monitor for anomalies
- [ ] Rotate secrets periodically
- [ ] Test backup restoration
- [ ] Security testing (pentest)

## Dependencies

### Security Auditing

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix
```

### Key Dependencies

| Package | Purpose | Security Notes |
|---------|---------|----------------|
| next-auth | Authentication | Well-maintained, regular updates |
| prisma | Database ORM | Parameterized queries |
| bcryptjs | Password hashing | Industry standard |
| crypto (Node) | Encryption | Native module |

## Incident Response

### Steps

1. **Identify**: Detect the incident
2. **Contain**: Limit the damage
3. **Eradicate**: Remove the threat
4. **Recover**: Restore normal operations
5. **Learn**: Post-incident review

### Contact

For security incidents:
- Email: yethikrishnarcvn7a@gmail.com
- Subject: [SECURITY INCIDENT] Description
