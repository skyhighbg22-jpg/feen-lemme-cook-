/**
 * Two-Factor Authentication System
 * 2FA for sensitive actions
 */

import crypto from "crypto";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

// TOTP (Time-based One-Time Password) implementation
const TOTP_STEP = 30; // 30 seconds
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1; // Allow 1 step before/after

export interface TwoFactorSecret {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  valid: boolean;
  error?: string;
}

/**
 * Generate a new 2FA secret
 */
export function generateTwoFactorSecret(
  userEmail: string,
  appName = "Feen"
): TwoFactorSecret {
  // Generate 20-byte secret (160 bits)
  const secretBuffer = crypto.randomBytes(20);
  const secret = base32Encode(secretBuffer);

  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );

  // Generate QR code URL (otpauth format)
  const qrCodeUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(
    userEmail
  )}?secret=${secret}&issuer=${encodeURIComponent(appName)}&digits=${TOTP_DIGITS}`;

  return {
    secret,
    qrCodeUrl,
    backupCodes,
  };
}

/**
 * Verify a TOTP code
 */
export function verifyTOTP(secret: string, code: string): boolean {
  const now = Math.floor(Date.now() / 1000);

  // Check current time step and adjacent windows
  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    const timeStep = Math.floor(now / TOTP_STEP) + i;
    const expectedCode = generateTOTP(secret, timeStep);

    if (crypto.timingSafeEqual(Buffer.from(code), Buffer.from(expectedCode))) {
      return true;
    }
  }

  return false;
}

/**
 * Generate TOTP code for a time step
 */
function generateTOTP(secret: string, timeStep: number): string {
  const secretBuffer = base32Decode(secret);

  // Convert time step to 8-byte buffer (big endian)
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep));

  // Generate HMAC-SHA1
  const hmac = crypto.createHmac("sha1", secretBuffer);
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  // Generate code
  const otp = binary % Math.pow(10, TOTP_DIGITS);
  return otp.toString().padStart(TOTP_DIGITS, "0");
}

/**
 * Base32 encoding (RFC 4648)
 */
function base32Encode(buffer: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  let bits = 0;
  let value = 0;

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }

  return result;
}

/**
 * Base32 decoding
 */
function base32Decode(encoded: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleanedInput = encoded.toUpperCase().replace(/[^A-Z2-7]/g, "");

  let bits = 0;
  let value = 0;
  const result: number[] = [];

  for (const char of cleanedInput) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      result.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(result);
}

/**
 * Verify a backup code
 */
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) return false;

  // In a real implementation, backup codes would be stored hashed
  // This is a simplified version
  const codeKey = `2fa:backup:${userId}`;
  const codes = await redis.smembers(codeKey);

  const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const codeHash = crypto.createHash("sha256").update(normalizedCode).digest("hex");

  if (codes.includes(codeHash)) {
    // Remove used backup code
    await redis.srem(codeKey, codeHash);
    return true;
  }

  return false;
}

/**
 * Store backup codes for a user
 */
export async function storeBackupCodes(
  userId: string,
  codes: string[]
): Promise<void> {
  const codeKey = `2fa:backup:${userId}`;

  // Hash each code before storing
  const hashedCodes = codes.map((code) =>
    crypto.createHash("sha256").update(code).digest("hex")
  );

  // Store in Redis with no expiration (backup codes don't expire)
  await redis.del(codeKey);
  await redis.sadd(codeKey, ...hashedCodes);
}

/**
 * Check if user has 2FA enabled
 */
export async function isTwoFactorEnabled(userId: string): Promise<boolean> {
  const secretKey = `2fa:secret:${userId}`;
  const secret = await redis.get(secretKey);
  return secret !== null;
}

/**
 * Enable 2FA for a user
 */
export async function enableTwoFactor(
  userId: string,
  secret: string,
  code: string
): Promise<TwoFactorVerification> {
  // Verify the code first
  if (!verifyTOTP(secret, code)) {
    return { valid: false, error: "Invalid verification code" };
  }

  // Store secret
  const secretKey = `2fa:secret:${userId}`;
  await redis.set(secretKey, secret);

  // Log the action
  await db.auditLog.create({
    data: {
      userId,
      action: "2FA_ENABLED",
      resource: "user",
      resourceId: userId,
    },
  });

  return { valid: true };
}

/**
 * Disable 2FA for a user
 */
export async function disableTwoFactor(
  userId: string,
  code: string
): Promise<TwoFactorVerification> {
  const secretKey = `2fa:secret:${userId}`;
  const secret = await redis.get(secretKey);

  if (!secret) {
    return { valid: false, error: "2FA is not enabled" };
  }

  // Verify the code
  if (!verifyTOTP(secret, code)) {
    return { valid: false, error: "Invalid verification code" };
  }

  // Remove secret and backup codes
  await redis.del(secretKey);
  await redis.del(`2fa:backup:${userId}`);

  // Log the action
  await db.auditLog.create({
    data: {
      userId,
      action: "2FA_DISABLED",
      resource: "user",
      resourceId: userId,
    },
  });

  return { valid: true };
}

/**
 * Require 2FA verification for sensitive action
 */
export async function requireTwoFactorVerification(
  userId: string,
  code: string,
  action: string
): Promise<TwoFactorVerification> {
  // Check if 2FA is enabled
  const enabled = await isTwoFactorEnabled(userId);
  if (!enabled) {
    // 2FA not enabled, action allowed without verification
    return { valid: true };
  }

  const secretKey = `2fa:secret:${userId}`;
  const secret = await redis.get(secretKey);

  if (!secret) {
    return { valid: false, error: "2FA secret not found" };
  }

  // Try TOTP first
  if (verifyTOTP(secret, code)) {
    // Log successful verification
    await db.auditLog.create({
      data: {
        userId,
        action: "2FA_VERIFIED",
        resource: "user",
        resourceId: userId,
        details: { sensitiveAction: action },
      },
    });
    return { valid: true };
  }

  // Try backup code
  if (await verifyBackupCode(userId, code)) {
    await db.auditLog.create({
      data: {
        userId,
        action: "2FA_VERIFIED_BACKUP",
        resource: "user",
        resourceId: userId,
        details: { sensitiveAction: action },
      },
    });
    return { valid: true };
  }

  return { valid: false, error: "Invalid verification code" };
}

/**
 * Generate a temporary 2FA bypass token (for recovery)
 */
export async function generateBypassToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenKey = `2fa:bypass:${token}`;

  // Store with 15 minute expiration
  await redis.setex(tokenKey, 900, userId);

  return token;
}

/**
 * Verify and consume a bypass token
 */
export async function verifyBypassToken(token: string): Promise<string | null> {
  const tokenKey = `2fa:bypass:${token}`;
  const userId = await redis.get(tokenKey);

  if (userId) {
    await redis.del(tokenKey);
    return userId;
  }

  return null;
}

// Sensitive actions that require 2FA
export const SENSITIVE_ACTIONS = [
  "reveal_api_key",
  "create_shared_token",
  "delete_api_key",
  "delete_shared_token",
  "change_password",
  "disable_2fa",
  "delete_account",
  "invite_team_member",
  "remove_team_member",
  "transfer_ownership",
] as const;

export type SensitiveAction = (typeof SENSITIVE_ACTIONS)[number];
