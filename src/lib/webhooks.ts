/**
 * Webhook Notification System
 * Send notifications for usage alerts, expiration warnings, etc.
 */

import crypto from "crypto";
import { db } from "./db";
import { redis } from "./redis";

export enum WebhookEvent {
  // Usage events
  USAGE_THRESHOLD_80 = "usage.threshold.80",
  USAGE_THRESHOLD_90 = "usage.threshold.90",
  USAGE_THRESHOLD_100 = "usage.threshold.100",
  DAILY_LIMIT_REACHED = "usage.daily_limit_reached",
  RATE_LIMIT_TRIGGERED = "usage.rate_limit_triggered",

  // Token events
  TOKEN_EXPIRING_SOON = "token.expiring_soon",
  TOKEN_EXPIRED = "token.expired",
  TOKEN_ROTATED = "token.rotated",
  TOKEN_CREATED = "token.created",
  TOKEN_DELETED = "token.deleted",

  // Security events
  SUSPICIOUS_ACTIVITY = "security.suspicious_activity",
  TWO_FACTOR_ENABLED = "security.2fa_enabled",
  TWO_FACTOR_DISABLED = "security.2fa_disabled",
  LOGIN_FROM_NEW_DEVICE = "security.new_device_login",

  // Key events
  API_KEY_CREATED = "key.created",
  API_KEY_DELETED = "key.deleted",
  API_KEY_REVEALED = "key.revealed",

  // Team events
  TEAM_MEMBER_INVITED = "team.member_invited",
  TEAM_MEMBER_REMOVED = "team.member_removed",
  TEAM_ROLE_CHANGED = "team.role_changed",

  // Billing events
  SUBSCRIPTION_CREATED = "billing.subscription_created",
  SUBSCRIPTION_CANCELLED = "billing.subscription_cancelled",
  PAYMENT_FAILED = "billing.payment_failed",
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
  userId?: string;
  teamId?: string;
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  userId: string;
  teamId?: string;
  createdAt: Date;
}

/**
 * Generate webhook signature
 */
export function generateWebhookSignature(
  payload: string,
  secret: string,
  timestamp: number
): string {
  const signatureBase = `${timestamp}.${payload}`;
  return crypto.createHmac("sha256", secret).update(signatureBase).digest("hex");
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: number,
  tolerance = 300 // 5 minutes
): boolean {
  const now = Math.floor(Date.now() / 1000);

  // Check timestamp tolerance
  if (Math.abs(now - timestamp) > tolerance) {
    return false;
  }

  const expectedSignature = generateWebhookSignature(payload, secret, timestamp);

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Queue a webhook notification
 */
export async function queueWebhook(
  userId: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
  teamId?: string
): Promise<void> {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
    userId,
    teamId,
  };

  // Add to webhook queue
  await redis.lpush("webhooks:queue", JSON.stringify(payload));
}

/**
 * Send a webhook
 */
export async function sendWebhook(
  config: WebhookConfig,
  payload: WebhookPayload
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const signature = generateWebhookSignature(payloadString, config.secret, timestamp);

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Feen-Webhook-Signature": signature,
        "X-Feen-Webhook-Timestamp": timestamp.toString(),
        "X-Feen-Webhook-Event": payload.event,
        "User-Agent": "Feen-Webhook/1.0",
      },
      body: payloadString,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    // Log webhook delivery
    await logWebhookDelivery(config.id, payload.event, response.status, null);

    return {
      success: response.ok,
      statusCode: response.status,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Log failed delivery
    await logWebhookDelivery(config.id, payload.event, 0, errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Log webhook delivery attempt
 */
async function logWebhookDelivery(
  webhookId: string,
  event: WebhookEvent,
  statusCode: number,
  error: string | null
): Promise<void> {
  await db.auditLog.create({
    data: {
      action: error ? "WEBHOOK_FAILED" : "WEBHOOK_SENT",
      resource: "webhook",
      resourceId: webhookId,
      details: {
        event,
        statusCode,
        error,
      },
    },
  });
}

/**
 * Process webhook queue
 */
export async function processWebhookQueue(): Promise<void> {
  const payload = await redis.rpop("webhooks:queue");
  if (!payload) return;

  const webhookPayload: WebhookPayload = JSON.parse(payload);

  // Get webhook configs for this user/event
  // Note: In a real implementation, webhook configs would be stored in the database
  // For now, we'll use a simple in-memory approach
  const configs = await getWebhookConfigs(
    webhookPayload.userId,
    webhookPayload.event
  );

  // Send to all matching webhooks
  await Promise.all(configs.map((config) => sendWebhook(config, webhookPayload)));
}

/**
 * Get webhook configs (placeholder)
 */
async function getWebhookConfigs(
  userId: string | undefined,
  event: WebhookEvent
): Promise<WebhookConfig[]> {
  if (!userId) return [];

  // In production, this would query the database
  const configKey = `webhooks:config:${userId}`;
  const configData = await redis.get(configKey);

  if (!configData) return [];

  const configs: WebhookConfig[] = JSON.parse(configData);
  return configs.filter((c) => c.active && c.events.includes(event));
}

/**
 * Register a webhook
 */
export async function registerWebhook(
  userId: string,
  url: string,
  events: WebhookEvent[],
  teamId?: string
): Promise<WebhookConfig> {
  const config: WebhookConfig = {
    id: crypto.randomUUID(),
    url,
    events,
    secret: crypto.randomBytes(32).toString("hex"),
    active: true,
    userId,
    teamId,
    createdAt: new Date(),
  };

  // Store webhook config
  const configKey = `webhooks:config:${userId}`;
  const existing = await redis.get(configKey);
  const configs: WebhookConfig[] = existing ? JSON.parse(existing) : [];
  configs.push(config);
  await redis.set(configKey, JSON.stringify(configs));

  // Log webhook creation
  await db.auditLog.create({
    data: {
      userId,
      action: "WEBHOOK_CREATED",
      resource: "webhook",
      resourceId: config.id,
      details: { url, events },
    },
  });

  return config;
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(
  userId: string,
  webhookId: string
): Promise<boolean> {
  const configKey = `webhooks:config:${userId}`;
  const existing = await redis.get(configKey);

  if (!existing) return false;

  const configs: WebhookConfig[] = JSON.parse(existing);
  const newConfigs = configs.filter((c) => c.id !== webhookId);

  if (configs.length === newConfigs.length) return false;

  await redis.set(configKey, JSON.stringify(newConfigs));

  // Log webhook deletion
  await db.auditLog.create({
    data: {
      userId,
      action: "WEBHOOK_DELETED",
      resource: "webhook",
      resourceId: webhookId,
    },
  });

  return true;
}

// Usage alert helpers
export async function checkUsageThresholds(
  userId: string,
  currentUsage: number,
  limit: number
): Promise<void> {
  const percentage = (currentUsage / limit) * 100;

  if (percentage >= 100) {
    await queueWebhook(userId, WebhookEvent.USAGE_THRESHOLD_100, {
      usage: currentUsage,
      limit,
      percentage: 100,
    });
  } else if (percentage >= 90) {
    await queueWebhook(userId, WebhookEvent.USAGE_THRESHOLD_90, {
      usage: currentUsage,
      limit,
      percentage: 90,
    });
  } else if (percentage >= 80) {
    await queueWebhook(userId, WebhookEvent.USAGE_THRESHOLD_80, {
      usage: currentUsage,
      limit,
      percentage: 80,
    });
  }
}

// Token expiration notification
export async function notifyTokenExpiring(
  userId: string,
  tokenId: string,
  tokenName: string,
  expiresAt: Date
): Promise<void> {
  const daysUntilExpiry = Math.ceil(
    (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  await queueWebhook(userId, WebhookEvent.TOKEN_EXPIRING_SOON, {
    tokenId,
    tokenName,
    expiresAt: expiresAt.toISOString(),
    daysUntilExpiry,
  });
}
