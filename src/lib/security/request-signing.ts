/**
 * Request Signing System
 * HMAC signatures for tamper-proof requests
 */

import crypto from "crypto";

export interface SignedRequestHeaders {
  "X-Feen-Timestamp": string;
  "X-Feen-Signature": string;
  "X-Feen-Nonce": string;
}

export interface SignaturePayload {
  timestamp: number;
  nonce: string;
  method: string;
  path: string;
  body?: string;
  tokenId: string;
}

const SIGNATURE_VALIDITY_SECONDS = 300; // 5 minutes
const NONCE_CACHE = new Map<string, number>(); // Simple in-memory nonce cache

/**
 * Generate HMAC signature for a request
 */
export function generateSignature(
  payload: SignaturePayload,
  secret: string
): string {
  const signatureBase = [
    payload.timestamp.toString(),
    payload.nonce,
    payload.method.toUpperCase(),
    payload.path,
    payload.body || "",
    payload.tokenId,
  ].join("\n");

  return crypto
    .createHmac("sha256", secret)
    .update(signatureBase)
    .digest("hex");
}

/**
 * Generate signed request headers
 */
export function signRequest(
  method: string,
  path: string,
  body: string | undefined,
  tokenId: string,
  secret: string
): SignedRequestHeaders {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString("hex");

  const signature = generateSignature(
    {
      timestamp,
      nonce,
      method,
      path,
      body,
      tokenId,
    },
    secret
  );

  return {
    "X-Feen-Timestamp": timestamp.toString(),
    "X-Feen-Signature": signature,
    "X-Feen-Nonce": nonce,
  };
}

/**
 * Verify request signature
 */
export function verifySignature(
  headers: {
    timestamp: string;
    signature: string;
    nonce: string;
  },
  method: string,
  path: string,
  body: string | undefined,
  tokenId: string,
  secret: string
): {
  valid: boolean;
  error?: string;
} {
  const timestamp = parseInt(headers.timestamp, 10);
  const now = Math.floor(Date.now() / 1000);

  // Check timestamp validity
  if (isNaN(timestamp)) {
    return { valid: false, error: "Invalid timestamp" };
  }

  if (Math.abs(now - timestamp) > SIGNATURE_VALIDITY_SECONDS) {
    return {
      valid: false,
      error: `Signature expired. Request timestamp: ${timestamp}, Server time: ${now}`,
    };
  }

  // Check nonce (prevent replay attacks)
  const nonceKey = `${tokenId}:${headers.nonce}`;
  if (NONCE_CACHE.has(nonceKey)) {
    return { valid: false, error: "Nonce already used (replay attack detected)" };
  }

  // Store nonce with expiration
  NONCE_CACHE.set(nonceKey, timestamp);

  // Clean old nonces periodically
  cleanOldNonces();

  // Verify signature
  const expectedSignature = generateSignature(
    {
      timestamp,
      nonce: headers.nonce,
      method,
      path,
      body,
      tokenId,
    },
    secret
  );

  const signatureValid = crypto.timingSafeEqual(
    Buffer.from(headers.signature),
    Buffer.from(expectedSignature)
  );

  if (!signatureValid) {
    return { valid: false, error: "Invalid signature" };
  }

  return { valid: true };
}

/**
 * Clean old nonces from cache
 */
function cleanOldNonces(): void {
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - SIGNATURE_VALIDITY_SECONDS * 2;

  for (const [key, timestamp] of NONCE_CACHE.entries()) {
    if (timestamp < cutoff) {
      NONCE_CACHE.delete(key);
    }
  }
}

/**
 * Generate a signing secret for a token
 */
export function generateSigningSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a signing secret for storage
 */
export function hashSigningSecret(secret: string): string {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

/**
 * Extract signature headers from request
 */
export function extractSignatureHeaders(
  headers: Headers | Record<string, string>
): {
  timestamp: string;
  signature: string;
  nonce: string;
} | null {
  const getHeader = (name: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(name);
    }
    return headers[name] || headers[name.toLowerCase()] || null;
  };

  const timestamp = getHeader("X-Feen-Timestamp");
  const signature = getHeader("X-Feen-Signature");
  const nonce = getHeader("X-Feen-Nonce");

  if (!timestamp || !signature || !nonce) {
    return null;
  }

  return { timestamp, signature, nonce };
}

/**
 * Middleware helper to verify signed requests
 */
export async function verifySignedRequest(
  request: Request,
  tokenId: string,
  secret: string
): Promise<{ valid: boolean; error?: string }> {
  const signatureHeaders = extractSignatureHeaders(request.headers);

  if (!signatureHeaders) {
    return { valid: false, error: "Missing signature headers" };
  }

  const url = new URL(request.url);
  const body = request.method !== "GET" && request.method !== "HEAD"
    ? await request.clone().text()
    : undefined;

  return verifySignature(
    signatureHeaders,
    request.method,
    url.pathname,
    body,
    tokenId,
    secret
  );
}

// TypeScript SDK helper for clients
export const SigningSDK = {
  /**
   * Create a signed fetch wrapper
   */
  createSignedFetch(tokenId: string, secret: string) {
    return async (url: string, options: RequestInit = {}): Promise<Response> => {
      const urlObj = new URL(url);
      const body = options.body?.toString();

      const signatureHeaders = signRequest(
        options.method || "GET",
        urlObj.pathname,
        body,
        tokenId,
        secret
      );

      const headers = new Headers(options.headers);
      Object.entries(signatureHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      return fetch(url, {
        ...options,
        headers,
      });
    };
  },
};
