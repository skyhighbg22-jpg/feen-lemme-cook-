# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously at Feen. If you discover a security vulnerability, please follow these steps:

### Do NOT

- Open a public GitHub issue
- Discuss the vulnerability publicly
- Exploit the vulnerability

### Do

1. **Email us directly** at: yethikrishnarcvn7a@gmail.com
2. **Include the following information**:
   - Type of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Resolution Timeline**: Depends on severity
  - Critical: 24-72 hours
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Next release cycle

## Security Measures

### Data Encryption

- All API keys are encrypted using **AES-256-GCM** before storage
- Encryption keys are never stored in the database
- TLS 1.3 for all data in transit

### Authentication

- Secure session management with NextAuth.js
- bcrypt password hashing with cost factor 12
- Optional 2FA support
- OAuth 2.0 for third-party authentication

### Access Control

- Role-based access control (RBAC) for teams
- IP whitelisting for shared tokens
- Automatic token expiration
- Rate limiting at multiple levels

### Audit Logging

- All sensitive operations are logged
- Logs include: user, action, timestamp, IP address
- Logs are retained for 90 days (configurable)

### Infrastructure

- Regular security updates
- Network isolation with Docker
- No default credentials
- Secrets management best practices

## Best Practices for Users

1. **Use strong encryption keys**: Generate a secure 32-character `ENCRYPTION_KEY`
2. **Rotate keys regularly**: Update your API keys periodically
3. **Use IP restrictions**: Limit shared tokens to known IPs
4. **Set expiration dates**: Always set expiration for shared tokens
5. **Monitor usage**: Regularly review usage logs and analytics
6. **Keep dependencies updated**: Run `npm audit` regularly

## Security Checklist for Deployment

- [ ] Set a strong `NEXTAUTH_SECRET` (min 32 characters)
- [ ] Set a secure `ENCRYPTION_KEY` (exactly 32 characters)
- [ ] Use HTTPS in production
- [ ] Configure proper CORS settings
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerting
- [ ] Regular backup of database
- [ ] Review and rotate secrets periodically

## Third-Party Dependencies

We regularly audit our dependencies for known vulnerabilities using:
- `npm audit`
- GitHub Dependabot
- Snyk (optional)

## Contact

For security-related inquiries:
- Email: yethikrishnarcvn7a@gmail.com
- Subject Line: [SECURITY] Your Subject

For general support:
- GitHub Issues: https://github.com/yethikrishna/feen/issues
- GitHub Discussions: https://github.com/yethikrishna/feen/discussions
