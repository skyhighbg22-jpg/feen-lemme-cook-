import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  // If key is 32 bytes, use directly; otherwise derive from it
  if (key.length === 32) {
    return Buffer.from(key);
  }

  // Derive a key from the provided key
  return crypto.pbkdf2Sync(key, "feen-salt", ITERATIONS, KEY_LENGTH, "sha256");
}

/**
 * Encrypts a string using AES-256-GCM
 * Returns: iv:tag:encryptedData (base64 encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const tag = cipher.getAuthTag();

  // Combine iv, tag, and encrypted data
  const combined = Buffer.concat([
    iv,
    tag,
    Buffer.from(encrypted, "base64"),
  ]);

  return combined.toString("base64");
}

/**
 * Decrypts a string encrypted with encrypt()
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedData, "base64");

  // Extract iv, tag, and encrypted data
  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}

/**
 * Creates a SHA-256 hash of a string
 */
export function hash(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Creates a HMAC-SHA256 hash of a string
 */
export function hmac(data: string, secret?: string): string {
  const key = secret || process.env.ENCRYPTION_KEY || "default-secret";
  return crypto.createHmac("sha256", key).update(data).digest("hex");
}

/**
 * Generates a secure random token
 */
export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString("base64url");
}

/**
 * Generates a secure API access token with prefix
 */
export function generateAccessToken(prefix = "feen"): string {
  const token = crypto.randomBytes(24).toString("base64url");
  return `${prefix}_${token}`;
}

/**
 * Generates a key prefix for display (e.g., "sk-...abc")
 */
export function generateKeyPrefix(key: string, visibleChars = 4): string {
  if (key.length <= visibleChars * 2) {
    return "****";
  }
  const start = key.slice(0, visibleChars);
  const end = key.slice(-visibleChars);
  return `${start}...${end}`;
}

/**
 * Compares two strings in constant time to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Generates a secure password hash using bcrypt-like approach with crypto
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha512");
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

/**
 * Verifies a password against a hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const hash = Buffer.from(hashHex, "hex");
  const inputHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha512");

  return crypto.timingSafeEqual(hash, inputHash);
}
