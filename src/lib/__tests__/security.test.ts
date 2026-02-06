import { describe, it, expect } from 'vitest';
import { TokenScope, hasRequiredScope } from '../security/token-scopes';
import { generateSignature } from '../security/request-signing';

describe('Token Scopes', () => {
  describe('hasRequiredScope', () => {
    it('should return allowed true for ALL scope', () => {
      const tokenScopes = [TokenScope.ALL];
      const result = hasRequiredScope(tokenScopes, '/v1/chat/completions', 'POST');
      expect(result.allowed).toBe(true);
    });

    it('should return allowed true for matching scope', () => {
      const tokenScopes = [TokenScope.CHAT_WRITE];
      const result = hasRequiredScope(tokenScopes, '/v1/chat/completions', 'POST');
      expect(result.allowed).toBe(true);
    });

    it('should return allowed false for missing scope', () => {
      const tokenScopes = [TokenScope.CHAT_READ];
      const result = hasRequiredScope(tokenScopes, '/v1/chat/completions', 'POST');
      expect(result.allowed).toBe(false);
    });

    it('should return requiredScopes in result', () => {
      const tokenScopes = [TokenScope.CHAT_READ];
      const result = hasRequiredScope(tokenScopes, '/v1/chat/completions', 'POST');
      expect(result.requiredScopes).toBeDefined();
      expect(Array.isArray(result.requiredScopes)).toBe(true);
    });
  });
});

describe('Request Signing', () => {
  const secret = 'test-secret-key-12345';

  describe('generateSignature', () => {
    it('should generate a signature string', () => {
      const payload = {
        timestamp: Date.now(),
        method: 'POST',
        path: '/api/proxy/chat',
        bodyHash: 'abc123',
        tokenId: 'token-123',
        nonce: 'nonce-456',
      };

      const signature = generateSignature(payload, secret);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);
    });

    it('should generate consistent signatures for same input', () => {
      const payload = {
        timestamp: 1234567890,
        method: 'POST',
        path: '/api/proxy/chat',
        bodyHash: 'abc123',
        tokenId: 'token-123',
        nonce: 'nonce-456',
      };

      const signature1 = generateSignature(payload, secret);
      const signature2 = generateSignature(payload, secret);
      expect(signature1).toBe(signature2);
    });

    it('should generate different signatures for different inputs', () => {
      const payload1 = {
        timestamp: 1234567890,
        method: 'POST',
        path: '/api/proxy/chat',
        bodyHash: 'abc123',
        tokenId: 'token-123',
        nonce: 'nonce-456',
      };

      const payload2 = {
        ...payload1,
        path: '/api/proxy/embeddings',
      };

      const signature1 = generateSignature(payload1, secret);
      const signature2 = generateSignature(payload2, secret);
      expect(signature1).not.toBe(signature2);
    });
  });
});
