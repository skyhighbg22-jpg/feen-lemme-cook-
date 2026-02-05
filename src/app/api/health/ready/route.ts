import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

// GET /api/health/ready - Kubernetes readiness probe
export async function GET() {
  try {
    // Check database
    await db.$queryRaw`SELECT 1`;

    // Check redis
    await redis.ping();

    return NextResponse.json({ ready: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ready: false,
        error: error instanceof Error ? error.message : "Service not ready",
      },
      { status: 503 }
    );
  }
}
