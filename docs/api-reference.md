# API Reference

Complete API documentation for Feen.

## Authentication

All API endpoints require authentication via session cookie or API token.

### Session Authentication

Used by the web dashboard. Sessions are managed by NextAuth.js.

### Token Authentication

For programmatic access:

```bash
Authorization: Bearer feen_your_token_here
```

## Base URL

```
https://your-feen-instance.com/api
```

---

## API Keys

### List API Keys

```http
GET /api/keys
```

**Response:**

```json
[
  {
    "id": "clxx...",
    "name": "Production OpenAI",
    "description": "Main production key",
    "provider": "OPENAI",
    "keyPrefix": "sk-...abc",
    "isActive": true,
    "rateLimit": 1000,
    "dailyLimit": 10000,
    "lastUsedAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "_count": {
      "sharedKeys": 5,
      "usageLogs": 1523
    }
  }
]
```

### Create API Key

```http
POST /api/keys
Content-Type: application/json

{
  "name": "Production OpenAI",
  "description": "Main production key",
  "provider": "OPENAI",
  "apiKey": "sk-...",
  "rateLimit": 1000,
  "dailyLimit": 10000
}
```

**Providers:**
- `OPENAI`
- `ANTHROPIC`
- `GOOGLE`
- `AZURE_OPENAI`
- `COHERE`
- `MISTRAL`
- `GROQ`
- `TOGETHER`
- `REPLICATE`
- `HUGGINGFACE`
- `CUSTOM`

**Response:** `201 Created`

```json
{
  "id": "clxx...",
  "name": "Production OpenAI",
  "provider": "OPENAI",
  "keyPrefix": "sk-...abc",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Get API Key

```http
GET /api/keys/{id}
```

### Update API Key

```http
PATCH /api/keys/{id}
Content-Type: application/json

{
  "name": "Updated Name",
  "rateLimit": 2000,
  "isActive": false
}
```

### Delete API Key

```http
DELETE /api/keys/{id}
```

### Reveal API Key

Reveals the decrypted API key (logged in audit).

```http
POST /api/keys/{id}
```

**Response:**

```json
{
  "key": "sk-actual-api-key-here..."
}
```

---

## Shared Access Tokens

### List Shared Tokens

```http
GET /api/shared
```

**Response:**

```json
[
  {
    "id": "clxx...",
    "name": "Team Access",
    "accessToken": "feen_abc123...",
    "rateLimit": 100,
    "dailyLimit": 1000,
    "usageCount": 523,
    "maxUsage": null,
    "isActive": true,
    "expiresAt": "2024-12-31T23:59:59Z",
    "apiKey": {
      "id": "clxx...",
      "name": "Production OpenAI",
      "provider": "OPENAI"
    }
  }
]
```

### Create Shared Token

```http
POST /api/shared
Content-Type: application/json

{
  "apiKeyId": "clxx...",
  "name": "Team Access",
  "description": "For the development team",
  "rateLimit": 100,
  "dailyLimit": 1000,
  "maxUsage": 10000,
  "expiresAt": "2024-12-31T23:59:59Z",
  "allowedIPs": ["192.168.1.0/24"],
  "allowedModels": ["gpt-4", "gpt-3.5-turbo"],
  "permissions": {
    "chat": true,
    "completions": true,
    "embeddings": true,
    "images": false,
    "audio": false
  }
}
```

**Response:** `201 Created`

```json
{
  "id": "clxx...",
  "accessToken": "feen_full_token_shown_only_once...",
  "name": "Team Access",
  "rateLimit": 100,
  "dailyLimit": 1000
}
```

> **Important:** The full `accessToken` is only returned on creation. Store it securely!

### Update Shared Token

```http
PATCH /api/shared/{id}
Content-Type: application/json

{
  "name": "Updated Name",
  "rateLimit": 200,
  "isActive": false
}
```

### Delete Shared Token

```http
DELETE /api/shared/{id}
```

---

## Proxy API

The proxy API forwards requests to AI providers using shared tokens.

### Base Proxy URL

```
https://your-feen-instance.com/api/proxy
```

### Making Requests

Use your Feen token instead of the provider's API key:

```bash
curl https://feen.example.com/api/proxy/v1/chat/completions \
  -H "Authorization: Bearer feen_your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Supported Endpoints

All provider-specific endpoints are supported. The path after `/api/proxy/` is forwarded to the provider:

| Provider | Proxy Path | Provider URL |
|----------|------------|--------------|
| OpenAI | `/api/proxy/v1/chat/completions` | `api.openai.com/v1/chat/completions` |
| Anthropic | `/api/proxy/v1/messages` | `api.anthropic.com/v1/messages` |
| Google | `/api/proxy/v1/models/...` | `generativelanguage.googleapis.com/...` |

### Response Headers

The proxy adds these headers to responses:

```
X-Feen-Latency: 142         # Proxy latency in ms
X-RateLimit-Limit: 100      # Your rate limit
X-RateLimit-Remaining: 87   # Remaining requests
X-RateLimit-Reset: 1705312800  # Reset timestamp
```

### Error Responses

**Rate Limit Exceeded:**

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 45
}
```

**Invalid Token:**

```json
{
  "error": "Invalid or expired access token"
}
```

**IP Not Allowed:**

```json
{
  "error": "IP address not allowed"
}
```

---

## Analytics

### Get Usage Statistics

```http
GET /api/analytics/usage?period=30d
```

**Query Parameters:**
- `period`: `24h`, `7d`, `30d`, `90d`
- `keyId`: Filter by specific API key
- `provider`: Filter by provider

**Response:**

```json
{
  "totalRequests": 15234,
  "totalTokens": 1523400,
  "totalCost": 45.67,
  "byDay": [
    {
      "date": "2024-01-15",
      "requests": 523,
      "tokens": 52300,
      "cost": 1.57
    }
  ],
  "byProvider": {
    "OPENAI": { "requests": 10000, "tokens": 1000000 },
    "ANTHROPIC": { "requests": 5234, "tokens": 523400 }
  }
}
```

---

## Teams

### List Teams

```http
GET /api/teams
```

### Create Team

```http
POST /api/teams
Content-Type: application/json

{
  "name": "Engineering Team",
  "slug": "engineering",
  "description": "Main engineering team"
}
```

### Invite Member

```http
POST /api/teams/{teamId}/members
Content-Type: application/json

{
  "email": "user@example.com",
  "role": "MEMBER"
}
```

**Roles:** `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`

---

## Audit Logs

### List Audit Logs

```http
GET /api/audit?limit=50&offset=0
```

**Query Parameters:**
- `limit`: Number of logs (max 100)
- `offset`: Pagination offset
- `action`: Filter by action type
- `from`: Start date
- `to`: End date

**Response:**

```json
[
  {
    "id": "clxx...",
    "action": "API_KEY_CREATED",
    "resource": "apiKey",
    "resourceId": "clxx...",
    "details": { "name": "Production OpenAI" },
    "ipAddress": "192.168.1.1",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

**Action Types:**
- `USER_REGISTERED`
- `API_KEY_CREATED`
- `API_KEY_UPDATED`
- `API_KEY_DELETED`
- `API_KEY_REVEALED`
- `SHARED_KEY_CREATED`
- `SHARED_KEY_DELETED`

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Server Error |

---

## SDKs

### JavaScript/TypeScript

```typescript
import { FeenClient } from '@feen/sdk';

const feen = new FeenClient({
  baseUrl: 'https://feen.example.com',
  token: 'feen_your_token',
});

// Use like OpenAI client
const response = await feen.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

### Python

```python
from feen import FeenClient

client = FeenClient(
    base_url="https://feen.example.com",
    token="feen_your_token"
)

response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
)
```
