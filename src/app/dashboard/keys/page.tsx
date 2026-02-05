import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Key, Trash2, Edit, Share2, Copy } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/utils";

const providerColors: Record<string, string> = {
  OPENAI: "bg-green-500",
  ANTHROPIC: "bg-orange-500",
  GOOGLE: "bg-blue-500",
  AZURE_OPENAI: "bg-cyan-500",
  COHERE: "bg-purple-500",
  MISTRAL: "bg-yellow-500",
  GROQ: "bg-pink-500",
  TOGETHER: "bg-indigo-500",
  REPLICATE: "bg-red-500",
  HUGGINGFACE: "bg-amber-500",
  CUSTOM: "bg-gray-500",
};

async function getApiKeys(userId: string) {
  return db.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          sharedKeys: true,
          usageLogs: true,
        },
      },
    },
  });
}

export default async function ApiKeysPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const apiKeys = await getApiKeys(session.user.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-1">
            Manage your API keys from various providers
          </p>
        </div>
        <Link href="/dashboard/keys/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add API Key
          </Button>
        </Link>
      </div>

      {/* API Keys List */}
      {apiKeys.length > 0 ? (
        <div className="grid gap-4">
          {apiKeys.map((key) => (
            <Card key={key.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${providerColors[key.provider]} flex items-center justify-center`}>
                    <Key className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{key.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {key.keyPrefix}
                      </code>
                      <span>•</span>
                      <span>{key.provider}</span>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={key.isActive ? "default" : "secondary"}>
                    {key.isActive ? "Active" : "Inactive"}
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
                        Copy Key ID
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="mr-2 h-4 w-4" />
                        Create Shared Access
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
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
                    <span className="font-medium text-foreground">{key._count.sharedKeys}</span> shared tokens
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{key._count.usageLogs.toLocaleString()}</span> API calls
                  </div>
                  <div>
                    Rate limit: <span className="font-medium text-foreground">{key.rateLimit}/min</span>
                  </div>
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
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Key className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No API Keys Yet</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Add your first API key to start managing and sharing access securely.
            </p>
            <Link href="/dashboard/keys/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Key
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
