"use client";

import { useState } from "react";
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
import { ArrowLeft, Loader2, Shield, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const providers = [
  { value: "OPENAI", label: "OpenAI", placeholder: "sk-..." },
  { value: "ANTHROPIC", label: "Anthropic", placeholder: "sk-ant-..." },
  { value: "GOOGLE", label: "Google AI", placeholder: "AIza..." },
  { value: "AZURE_OPENAI", label: "Azure OpenAI", placeholder: "Your Azure key" },
  { value: "COHERE", label: "Cohere", placeholder: "Your Cohere key" },
  { value: "MISTRAL", label: "Mistral AI", placeholder: "Your Mistral key" },
  { value: "GROQ", label: "Groq", placeholder: "gsk_..." },
  { value: "TOGETHER", label: "Together AI", placeholder: "Your Together key" },
  { value: "REPLICATE", label: "Replicate", placeholder: "r8_..." },
  { value: "HUGGINGFACE", label: "Hugging Face", placeholder: "hf_..." },
  { value: "CUSTOM", label: "Custom Provider", placeholder: "Your API key" },
];

export default function NewApiKeyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    provider: "",
    apiKey: "",
    rateLimit: "1000",
    dailyLimit: "10000",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          provider: formData.provider,
          apiKey: formData.apiKey,
          rateLimit: parseInt(formData.rateLimit),
          dailyLimit: parseInt(formData.dailyLimit),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to add API key");
        return;
      }

      toast.success("API key added successfully!");
      router.push("/dashboard/keys");
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProvider = providers.find((p) => p.value === formData.provider);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/keys">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to API Keys
        </Button>
      </Link>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Add New API Key</CardTitle>
          <CardDescription>
            Securely store your API key. It will be encrypted before storage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Security Notice */}
            <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-primary">Your key is secure</p>
                <p className="text-muted-foreground">
                  API keys are encrypted using AES-256 encryption before storage.
                  We never store or transmit your keys in plain text.
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Key Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Production OpenAI Key"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            {/* Provider */}
            <div className="space-y-2">
              <Label htmlFor="provider">Provider *</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => setFormData({ ...formData, provider: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key *</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder={selectedProvider?.placeholder || "Enter your API key"}
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Your key will be encrypted immediately after submission.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add notes about this API key..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isLoading}
                rows={3}
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
                  max="100000"
                  value={formData.rateLimit}
                  onChange={(e) => setFormData({ ...formData, rateLimit: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyLimit">Daily Limit</Label>
                <Input
                  id="dailyLimit"
                  type="number"
                  min="1"
                  max="10000000"
                  value={formData.dailyLimit}
                  onChange={(e) => setFormData({ ...formData, dailyLimit: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-600 dark:text-yellow-400">
                  Important
                </p>
                <p className="text-muted-foreground">
                  Make sure your API key has the appropriate permissions. We recommend
                  using keys with limited scope for security.
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Link href="/dashboard/keys">
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add API Key
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
