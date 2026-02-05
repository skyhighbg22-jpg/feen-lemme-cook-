import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Share2, Trash2, Edit, Copy, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime, formatNumber } from "@/lib/utils";

async function getSharedKeys(userId: string) {
  return db.sharedKey.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      apiKey: {
        select: {
          id: true,
          name: true,
          provider: true,
        },
      },
      _count: {
        select: {
          usageLogs: true,
        },
      },
    },
  });
}

export default async function SharedKeysPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const sharedKeys = await getSharedKeys(session.user.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shared Access</h1>
          <p className="text-muted-foreground mt-1">
            Manage shared access tokens for your API keys
          </p>
        </div>
        <Link href="/dashboard/shared/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Shared Access
          </Button>
        </Link>
      </div>

      {/* Shared Keys List */}
      {sharedKeys.length > 0 ? (
        <div className="grid gap-4">
          {sharedKeys.map((key) => {
            const isExpired = key.expiresAt && key.expiresAt < new Date();
            const isLimitReached = key.maxUsage && key.usageCount >= key.maxUsage;
            const status = !key.isActive
              ? "inactive"
              : isExpired
              ? "expired"
              : isLimitReached
              ? "limit_reached"
              : "active";

            return (
              <Card key={key.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Share2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {key.name || "Unnamed Token"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span>For {key.apiKey.name}</span>
                        <span>•</span>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {key.accessToken.slice(0, 12)}...
                        </code>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        status === "active"
                          ? "default"
                          : status === "expired"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {status === "active"
                        ? "Active"
                        : status === "expired"
                        ? "Expired"
                        : status === "limit_reached"
                        ? "Limit Reached"
                        : "Inactive"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Token
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          {key.isActive ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Disable
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Enable
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">
                        {formatNumber(key.usageCount)}
                        {key.maxUsage ? ` / ${formatNumber(key.maxUsage)}` : ""}
                      </span>{" "}
                      requests
                    </div>
                    <div>
                      Rate: <span className="font-medium text-foreground">{key.rateLimit}/min</span>
                    </div>
                    <div>
                      Daily: <span className="font-medium text-foreground">{formatNumber(key.dailyLimit)}</span>
                    </div>
                    {key.expiresAt && (
                      <div>
                        Expires: {formatRelativeTime(key.expiresAt)}
                      </div>
                    )}
                    <div>
                      {key.lastUsedAt ? (
                        <>Last used: {formatRelativeTime(key.lastUsedAt)}</>
                      ) : (
                        "Never used"
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Share2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Shared Tokens Yet</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Create shared access tokens to securely share your API keys with
              custom limits and restrictions.
            </p>
            <Link href="/dashboard/shared/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Token
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
