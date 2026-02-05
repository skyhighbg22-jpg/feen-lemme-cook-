import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: ComponentHealth;
    redis: ComponentHealth;
    memory: ComponentHealth;
  };
}

interface ComponentHealth {
  status: "healthy" | "unhealthy";
  latency?: number;
  message?: string;
}

const startTime = Date.now();

// GET /api/health - Basic health check
export async function GET() {
  const health = await getHealthStatus();

  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}

async function getHealthStatus(): Promise<HealthStatus> {
  const checks = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkMemory(),
  ]);

  const [database, redisCheck, memory] = checks;

  // Determine overall status
  const allHealthy = checks.every((c) => c.status === "healthy");
  const anyUnhealthy = checks.some((c) => c.status === "unhealthy");

  let status: "healthy" | "degraded" | "unhealthy" = "healthy";
  if (anyUnhealthy) {
    status = "unhealthy";
  } else if (!allHealthy) {
    status = "degraded";
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: {
      database,
      redis: redisCheck,
      memory,
    },
  };
}

async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return {
      status: "healthy",
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Database connection failed",
    };
  }
}

async function checkRedis(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    await redis.ping();
    return {
      status: "healthy",
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Redis connection failed",
    };
  }
}

function checkMemory(): ComponentHealth {
  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const percentUsed = Math.round((usage.heapUsed / usage.heapTotal) * 100);

  // Consider unhealthy if memory usage > 90%
  const status = percentUsed > 90 ? "unhealthy" : "healthy";

  return {
    status,
    message: `${heapUsedMB}MB / ${heapTotalMB}MB (${percentUsed}%)`,
  };
}
