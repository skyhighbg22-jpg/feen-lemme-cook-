/**
 * Background Worker for Feen
 *
 * Handles asynchronous tasks like:
 * - Usage aggregation
 * - Email notifications
 * - Cleanup jobs
 * - Billing updates
 */

import { Worker, Queue, Job } from "bullmq";
import { db } from "@/lib/db";
import Redis from "ioredis";
import { ApiProvider } from "@prisma/client";
import { probeProvider } from "@/lib/routing";
import { decrypt } from "@/lib/crypto";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

// Queue definitions
const usageQueue = new Queue("usage", { connection });
const notificationQueue = new Queue("notifications", { connection });
const cleanupQueue = new Queue("cleanup", { connection });
const latencyQueue = new Queue("latency", { connection });

// Usage aggregation worker
const usageWorker = new Worker(
  "usage",
  async (job: Job) => {
    const { type, data } = job.data;

    switch (type) {
      case "aggregate_daily":
        await aggregateDailyUsage(data.date);
        break;
      case "update_key_usage":
        await updateKeyUsageStats(data.keyId);
        break;
      default:
        console.log(`Unknown usage job type: ${type}`);
    }
  },
  { connection }
);

// Notification worker
const notificationWorker = new Worker(
  "notifications",
  async (job: Job) => {
    const { type, data } = job.data;

    switch (type) {
      case "rate_limit_warning":
        await sendRateLimitWarning(data.userId, data.keyId);
        break;
      case "usage_alert":
        await sendUsageAlert(data.userId, data.usage, data.limit);
        break;
      default:
        console.log(`Unknown notification type: ${type}`);
    }
  },
  { connection }
);

// Cleanup worker
const cleanupWorker = new Worker(
  "cleanup",
  async (job: Job) => {
    const { type } = job.data;

    switch (type) {
      case "expired_tokens":
        await cleanupExpiredTokens();
        break;
      case "old_logs":
        await cleanupOldLogs();
        break;
      default:
        console.log(`Unknown cleanup job type: ${type}`);
    }
  },
  { connection }
);

// Latency worker
const latencyWorker = new Worker(
  "latency",
  async (job: Job) => {
    const { type } = job.data;

    if (type === "probe_all") {
      await probeAllProviders();
    }
  },
  { connection }
);

// Job implementations

async function probeAllProviders() {
  console.log("Probing all providers for latency...");
  const providers = Object.values(ApiProvider);

  for (const provider of providers) {
    if (provider === ApiProvider.CUSTOM) continue;

    // Find an active key to use for probing
    const apiKey = await db.apiKey.findFirst({
      where: { provider, isActive: true },
      orderBy: { lastUsedAt: "desc" },
    });

    if (apiKey) {
      const decryptedKey = decrypt(apiKey.encryptedKey);
      await probeProvider(provider, decryptedKey);
    }
  }
}

async function aggregateDailyUsage(date: string) {
  console.log(`Aggregating usage for ${date}`);
  // Implementation would aggregate usage logs into daily summaries
}

async function updateKeyUsageStats(keyId: string) {
  const count = await db.usageLog.count({
    where: { apiKeyId: keyId },
  });

  console.log(`Updated usage stats for key ${keyId}: ${count} total requests`);
}

async function sendRateLimitWarning(userId: string, keyId: string) {
  console.log(`Sending rate limit warning to user ${userId} for key ${keyId}`);
  // Implementation would send email notification
}

async function sendUsageAlert(userId: string, usage: number, limit: number) {
  console.log(
    `Sending usage alert to user ${userId}: ${usage}/${limit} (${Math.round(
      (usage / limit) * 100
    )}%)`
  );
  // Implementation would send email notification
}

async function cleanupExpiredTokens() {
  const result = await db.sharedKey.updateMany({
    where: {
      expiresAt: { lt: new Date() },
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  console.log(`Deactivated ${result.count} expired tokens`);
}

async function cleanupOldLogs() {
  const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS || "90");
  const cutoffDate = new Date(
    Date.now() - retentionDays * 24 * 60 * 60 * 1000
  );

  const result = await db.auditLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  console.log(`Deleted ${result.count} old audit logs`);
}

// Error handling
usageWorker.on("failed", (job, err) => {
  console.error(`Usage job ${job?.id} failed:`, err);
});

notificationWorker.on("failed", (job, err) => {
  console.error(`Notification job ${job?.id} failed:`, err);
});

cleanupWorker.on("failed", (job, err) => {
  console.error(`Cleanup job ${job?.id} failed:`, err);
});

// Scheduled jobs
async function scheduleRecurringJobs() {
  // Schedule daily cleanup at midnight
  await cleanupQueue.add(
    "daily-cleanup",
    { type: "expired_tokens" },
    {
      repeat: { pattern: "0 0 * * *" }, // Every day at midnight
    }
  );

  // Schedule log cleanup weekly
  await cleanupQueue.add(
    "weekly-log-cleanup",
    { type: "old_logs" },
    {
      repeat: { pattern: "0 0 * * 0" }, // Every Sunday at midnight
    }
  );

  // Schedule latency probing every 60 seconds
  await latencyQueue.add(
    "latency-probing",
    { type: "probe_all" },
    {
      repeat: { pattern: "* * * * *" }, // Every minute
    }
  );

  console.log("Scheduled recurring jobs");
}

// Start the worker
console.log("Starting Feen background worker...");
scheduleRecurringJobs().catch(console.error);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down workers...");
  await usageWorker.close();
  await notificationWorker.close();
  await cleanupWorker.close();
  await latencyWorker.close();
  process.exit(0);
});
