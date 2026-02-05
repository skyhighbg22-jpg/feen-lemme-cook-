"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  provider: string;
  keyPrefix: string;
}

export default function NewSharedAccessPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    apiKeyId: "",
    name: "",
    description: "",
    rateLimit: "100",
    dailyLimit: "1000",
    maxUsage: "",
    expiresAt: "",
    allowedIPs: "",
    allowedModels: "",
  });

  useEffect(() => {
    fetch("/api/keys")
      .then((res) => res.json())
      .then((data) => setApiKeys(data))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/shared", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKeyId: formData.apiKeyId,
          name: formData.name || undefined,
          description: formData.description || undefined,
          rateLimit: parseInt(formData.rateLimit),
          dailyLimit: parseInt(formData.dailyLimit),
          maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : undefined,
          expiresAt: formData.expiresAt || undefined,
          allowedIPs: formData.allowedIPs
            ? formData.allowedIPs.split(",").map((ip) => ip.trim())
            : [],
          allowedModels: formData.allowedModels
            ? formData.allowedModels.split(",").map((m) => m.trim())
            : [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to create shared access");
        return;
      }

      setCreatedToken(data.accessToken);
      toast.success("Shared access created successfully!");
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToken = () => {
    if (createdToken) {
      navigator.clipboard.writeText(createdToken);
      setCopied(true);
      toast.success("Token copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (createdToken) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-green-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <CardTitle>Shared Access Created!</CardTitle>
            </div>
            <CardDescription>
              Copy your access token below. This is the only time it will be shown.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between gap-4">
                <code className="text-sm break-all">{createdToken}</code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToken}
                  className="shrink-0"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-2 p-4 bg-yellow-500/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-600 dark:text-yellow-400">
                  Important: Save this token now
                </p>
                <p className="text-muted-foreground">
                  For security reasons, we cannot show this token again. Store it
                  in a secure location.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <h4 className="font-medium mb-2">Usage Example:</h4>
              <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                {`curl https://your-feen-instance.com/api/proxy/v1/chat/completions \\
  -H "Authorization: Bearer ${createdToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "Hello!"}]}'`}
              </pre>
            </div>

            <div className="flex gap-4 pt-4">
              <Link href="/dashboard/shared" className="flex-1">
                <Button variant="outline" className="w-full">
                  View All Tokens
                </Button>
              </Link>
              <Button
                onClick={() => {
                  setCreatedToken(null);
                  setFormData({
                    apiKeyId: "",
                    name: "",
                    description: "",
                    rateLimit: "100",
                    dailyLimit: "1000",
                    maxUsage: "",
                    expiresAt: "",
                    allowedIPs: "",
                    allowedModels: "",
                  });
                }}
                className="flex-1"
              >
                Create Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/dashboard/shared">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Shared Access
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create Shared Access</CardTitle>
          <CardDescription>
            Generate a secure access token with custom limits and restrictions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* API Key Selection */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key *</Label>
              <Select
                value={formData.apiKeyId}
                onValueChange={(value) =>
                  setFormData({ ...formData, apiKeyId: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an API key to share" />
                </SelectTrigger>
                <SelectContent>
                  {apiKeys.map((key) => (
                    <SelectItem key={key.id} value={key.id}>
                      {key.name} ({key.provider})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Token Name (Optional)</Label>
              <Input
                id="name"
                placeholder="e.g., Team Development Access"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="What will this token be used for?"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={isLoading}
                rows={2}
              />
            </div>

            {/* Rate Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rateLimit">Rate Limit (per minute)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  min="1"
                  max="10000"
                  value={formData.rateLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, rateLimit: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyLimit">Daily Limit</Label>
                <Input
                  id="dailyLimit"
                  type="number"
                  min="1"
                  max="1000000"
                  value={formData.dailyLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, dailyLimit: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Max Usage and Expiration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUsage">Max Total Usage (Optional)</Label>
                <Input
                  id="maxUsage"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={formData.maxUsage}
                  onChange={(e) =>
                    setFormData({ ...formData, maxUsage: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* IP Restrictions */}
            <div className="space-y-2">
              <Label htmlFor="allowedIPs">Allowed IPs (Optional)</Label>
              <Input
                id="allowedIPs"
                placeholder="e.g., 192.168.1.1, 10.0.0.0/24"
                value={formData.allowedIPs}
                onChange={(e) =>
                  setFormData({ ...formData, allowedIPs: e.target.value })
                }
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list. Leave empty to allow all IPs.
              </p>
            </div>

            {/* Model Restrictions */}
            <div className="space-y-2">
              <Label htmlFor="allowedModels">Allowed Models (Optional)</Label>
              <Input
                id="allowedModels"
                placeholder="e.g., gpt-4, gpt-3.5-turbo"
                value={formData.allowedModels}
                onChange={(e) =>
                  setFormData({ ...formData, allowedModels: e.target.value })
                }
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list. Leave empty to allow all models.
              </p>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Link href="/dashboard/shared">
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading || !formData.apiKeyId}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Shared Access
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
