/**
 * Token Rotation System
 * Auto-rotate tokens on suspicious activity
 */

import { db } from "@/lib/db";
import { generateAccessToken, hash } from "@/lib/crypto";
import { redis } from "@/lib/redis";

export interface SuspiciousActivityEvent {
  type: SuspiciousActivityType;
  tokenId: string;
  userId: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

export enum SuspiciousActivityType {
  // Rate limit violations
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  BURST_REQUESTS = "burst_requests",

  // Geographic anomalies
  GEOGRAPHIC_ANOMALY = "geographic_anomaly",
  MULTIPLE_LOCATIONS = "multiple_locations",

  // Authentication issues
  INVALID_SIGNATURE = "invalid_signature",
  EXPIRED_TIMESTAMP = "expired_timestamp",
  REPLAY_ATTACK = "replay_attack",

  // Usage anomalies
  UNUSUAL_USAGE_PATTERN = "unusual_usage_pattern",
  HIGH_ERROR_RATE = "high_error_rate",
  UNUSUAL_MODELS = "unusual_models",

  // Security events
  IP_BLACKLISTED = "ip_blacklisted",
  UNAUTHORIZED_SCOPE = "unauthorized_scope",
}

// Thresholds for automatic rotation
const ROTATION_THRESHOLDS: Record<SuspiciousActivityType, number> = {
  [SuspiciousActivityType.RATE_LIMIT_EXCEEDED]: 10, // 10 violations
  [SuspiciousActivityType.BURST_REQUESTS]: 5,
  [SuspiciousActivityType.GEOGRAPHIC_ANOMALY]: 3,
  [SuspiciousActivityType.MULTIPLE_LOCATIONS]: 5,
  [SuspiciousActivityType.INVALID_SIGNATURE]: 3,
  [SuspiciousActivityType.EXPIRED_TIMESTAMP]: 5,
  [SuspiciousActivityType.REPLAY_ATTACK]: 1, // Immediate rotation
  [SuspiciousActivityType.UNUSUAL_USAGE_PATTERN]: 5,
  [SuspiciousActivityType.HIGH_ERROR_RATE]: 10,
  [SuspiciousActivityType.UNUSUAL_MODELS]: 3,
  [SuspiciousActivityType.IP_BLACKLISTED]: 1, // Immediate rotation
  [SuspiciousActivityType.UNAUTHORIZED_SCOPE]: 3,
};

// Time window for counting violations (in seconds)
const VIOLATION_WINDOW = 3600; // 1 hour

/**
 * Record a suspicious activity event
 */
export async function recordSuspiciousActivity(
  event: Omit<SuspiciousActivityEvent, "timestamp">
): Promise<{ rotated: boolean; newToken?: string }> {
  const fullEvent: SuspiciousActivityEvent = {
    ...event,
    timestamp: new Date(),
  };

  // Store event in Redis
  const eventKey = `suspicious:${event.tokenId}:${event.type}`;
  await redis.lpush(eventKey, JSON.stringify(fullEvent));
  await redis.expire(eventKey, VIOLATION_WINDOW);

  // Count recent violations
  const violations = await redis.llen(eventKey);
  const threshold = ROTATION_THRESHOLDS[event.type];

  // Log to database
  await db.auditLog.create({
    data: {
      userId: event.userId,
      action: "SUSPICIOUS_ACTIVITY",
      resource: "sharedKey",
      resourceId: event.tokenId,
      details: {
        type: event.type,
        violations,
        threshold,
        ...event.details,
      },
    },
  });

  // Check if rotation is needed
  if (violations >= threshold) {
    const newToken = await rotateToken(event.tokenId, event.userId, event.type);
    return { rotated: true, newToken };
  }

  return { rotated: false };
}

/**
 * Rotate a token
 */
export async function rotateToken(
  tokenId: string,
  userId: string,
  reason: string
): Promise<string> {
  // Generate new token
  const newAccessToken = generateAccessToken("feen");
  const newTokenHash = hash(newAccessToken);

  // Get old token info
  const oldToken = await db.sharedKey.findUnique({
    where: { id: tokenId },
    select: { accessToken: true },
  });

  // Update token in database
  await db.sharedKey.update({
    where: { id: tokenId },
    data: {
      accessToken: newAccessToken,
      tokenHash: newTokenHash,
      updatedAt: new Date(),
    },
  });

  // Clear violation counts
  const keys = await redis.keys(`suspicious:${tokenId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }

  // Log rotation
  await db.auditLog.create({
    data: {
      userId,
      action: "TOKEN_ROTATED",
      resource: "sharedKey",
      resourceId: tokenId,
      details: {
        reason,
        oldTokenPrefix: oldToken?.accessToken.slice(0, 12) + "...",
        newTokenPrefix: newAccessToken.slice(0, 12) + "...",
      },
    },
  });

  // Queue notification to user
  await queueRotationNotification(userId, tokenId, reason);

  return newAccessToken;
}

/**
 * Manual token rotation request
 */
export async function requestTokenRotation(
  tokenId: string,
  userId: string
): Promise<string> {
  // Verify ownership
  const token = await db.sharedKey.findFirst({
    where: { id: tokenId, ownerId: userId },
  });

  if (!token) {
    throw new Error("Token not found or unauthorized");
  }

  return rotateToken(tokenId, userId, "manual_rotation");
}

/**
 * Schedule automatic rotation
 */
export async function scheduleRotation(
  tokenId: string,
  rotateAt: Date
): Promise<void> {
  const scheduleKey = `rotation:scheduled:${tokenId}`;
  await redis.set(scheduleKey, rotateAt.toISOString());
  await redis.expireat(scheduleKey, Math.floor(rotateAt.getTime() / 1000));
}

/**
 * Check if token needs scheduled rotation
 */
export async function checkScheduledRotation(tokenId: string): Promise<boolean> {
  const scheduleKey = `rotation:scheduled:${tokenId}`;
  const scheduledTime = await redis.get(scheduleKey);

  if (scheduledTime) {
    const rotateAt = new Date(scheduledTime);
    return new Date() >= rotateAt;
  }

  return false;
}

/**
 * Queue rotation notification
 */
async function queueRotationNotification(
  userId: string,
  tokenId: string,
  reason: string
): Promise<void> {
  // In a real implementation, this would add to a notification queue
  // For now, we'll just create a record
  const notificationData = {
    type: "token_rotated",
    userId,
    tokenId,
    reason,
    timestamp: new Date().toISOString(),
  };

  await redis.lpush("notifications:queue", JSON.stringify(notificationData));
}

/**
 * Detect burst requests (many requests in short time)
 */
export async function detectBurstRequests(
  tokenId: string,
  windowSeconds = 10,
  threshold = 50
): Promise<boolean> {
  const key = `burst:${tokenId}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  return count > threshold;
}

/**
 * Detect geographic anomaly (requests from different locations)
 */
export async function detectGeographicAnomaly(
  tokenId: string,
  currentLocation: string,
  windowHours = 1
): Promise<boolean> {
  const key = `geo:${tokenId}`;
  const locations = await redis.smembers(key);

  // Add current location
  await redis.sadd(key, currentLocation);
  await redis.expire(key, windowHours * 3600);

  // Check if there are multiple distinct locations
  if (locations.length > 0 && !locations.includes(currentLocation)) {
    // Different location detected within window
    return true;
  }

  return false;
}

/**
 * Get token security status
 */
export async function getTokenSecurityStatus(tokenId: string): Promise<{
  riskLevel: "low" | "medium" | "high" | "critical";
  violations: Record<string, number>;
  lastRotation?: Date;
  scheduledRotation?: Date;
}> {
  const violationTypes = Object.values(SuspiciousActivityType);
  const violations: Record<string, number> = {};
  let totalViolations = 0;

  for (const type of violationTypes) {
    const count = await redis.llen(`suspicious:${tokenId}:${type}`);
    if (count > 0) {
      violations[type] = count;
      totalViolations += count;
    }
  }

  // Get last rotation from audit log
  const lastRotationLog = await db.auditLog.findFirst({
    where: {
      resourceId: tokenId,
      action: "TOKEN_ROTATED",
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  // Get scheduled rotation
  const scheduledRotation = await redis.get(`rotation:scheduled:${tokenId}`);

  // Calculate risk level
  let riskLevel: "low" | "medium" | "high" | "critical" = "low";
  if (totalViolations >= 20) riskLevel = "critical";
  else if (totalViolations >= 10) riskLevel = "high";
  else if (totalViolations >= 5) riskLevel = "medium";

  return {
    riskLevel,
    violations,
    lastRotation: lastRotationLog?.createdAt,
    scheduledRotation: scheduledRotation ? new Date(scheduledRotation) : undefined,
  };
}
