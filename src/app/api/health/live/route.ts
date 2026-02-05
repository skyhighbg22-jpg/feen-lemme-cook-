import { NextResponse } from "next/server";

// GET /api/health/live - Kubernetes liveness probe
export async function GET() {
  // Simple liveness check - just verify the process is running
  return NextResponse.json(
    {
      alive: true,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
