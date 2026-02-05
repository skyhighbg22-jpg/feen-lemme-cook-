import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Clock, DollarSign } from "lucide-react";

async function getAnalytics(userId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalRequests, totalTokens, avgLatency, requestsByDay, topKeys] = await Promise.all([
    db.usageLog.count({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    db.usageLog.aggregate({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: {
        totalTokens: true,
      },
    }),
    db.usageLog.aggregate({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _avg: {
        latencyMs: true,
      },
    }),
    db.$queryRaw`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as requests,
        SUM(total_tokens) as tokens
      FROM usage_logs
      WHERE user_id = ${userId}
        AND created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    ` as Promise<Array<{ date: Date; requests: bigint; tokens: bigint | null }>>,
    db.usageLog.groupBy({
      by: ["apiKeyId"],
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
      orderBy: {
        _count: {
          apiKeyId: "desc",
        },
      },
      take: 5,
    }),
  ]);

  return {
    totalRequests,
    totalTokens: totalTokens._sum.totalTokens || 0,
    avgLatency: Math.round(avgLatency._avg.latencyMs || 0),
    requestsByDay,
    topKeys,
  };
}

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const analytics = await getAnalytics(session.user.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your API usage and performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalRequests.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(analytics.totalTokens).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgLatency}ms</div>
            <p className="text-xs text-muted-foreground">Proxy response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((Number(analytics.totalTokens) / 1000) * 0.002).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Approximate</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Over Time</CardTitle>
          <CardDescription>Daily API requests and token usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                Chart visualization would appear here
              </p>
              <p className="text-sm text-muted-foreground">
                (Requires Recharts integration)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top API Keys</CardTitle>
            <CardDescription>Most used keys in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topKeys.length > 0 ? (
              <div className="space-y-4">
                {analytics.topKeys.map((item, index) => (
                  <div key={item.apiKeyId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">#{index + 1}</span>
                      <span className="font-medium">
                        {item.apiKeyId?.slice(0, 8)}...
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item._count} requests
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No usage data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage by Provider</CardTitle>
            <CardDescription>Request distribution by provider</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center bg-muted/50 rounded-lg">
              <p className="text-muted-foreground text-sm">
                Provider breakdown would appear here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
