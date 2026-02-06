"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Key,
  Share2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Rocket,
  Shield,
  Zap,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface OnboardingProps {
  userName?: string;
  onComplete?: () => void;
}

const providers = [
  { value: "OPENAI", label: "OpenAI" },
  { value: "ANTHROPIC", label: "Anthropic" },
  { value: "GOOGLE", label: "Google AI" },
  { value: "MISTRAL", label: "Mistral AI" },
  { value: "GROQ", label: "Groq" },
];

export function OnboardingFlow({ userName, onComplete }: OnboardingProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Form data
  const [apiKeyData, setApiKeyData] = useState({
    name: "",
    provider: "",
    apiKey: "",
  });
  const [sharedTokenCreated, setSharedTokenCreated] = useState(false);
  const [createdApiKeyId, setCreatedApiKeyId] = useState<string | null>(null);

  const steps = [
    {
      id: "welcome",
      title: "Welcome to Feen",
      description: "Let's get you set up in just a few steps",
      icon: Rocket,
    },
    {
      id: "add-key",
      title: "Add Your First API Key",
      description: "Securely store your AI provider API key",
      icon: Key,
    },
    {
      id: "create-token",
      title: "Create a Shared Token",
      description: "Generate a secure access token",
      icon: Share2,
    },
    {
      id: "complete",
      title: "You're All Set!",
      description: "Start using Feen to manage your API keys",
      icon: CheckCircle2,
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleAddApiKey = async () => {
    if (!apiKeyData.name || !apiKeyData.provider || !apiKeyData.apiKey) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: apiKeyData.name,
          provider: apiKeyData.provider,
          apiKey: apiKeyData.apiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to add API key");
        return;
      }

      setCreatedApiKeyId(data.id);
      setCompletedSteps([...completedSteps, 1]);
      toast.success("API key added successfully!");
      setCurrentStep(2);
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateToken = async () => {
    if (!createdApiKeyId) {
      toast.error("Please add an API key first");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/shared", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKeyId: createdApiKeyId,
          name: "My First Token",
          rateLimit: 100,
          dailyLimit: 1000,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to create token");
        return;
      }

      setSharedTokenCreated(true);
      setCompletedSteps([...completedSteps, 2]);
      toast.success("Token created successfully!");
      setCurrentStep(3);
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipToEnd = () => {
    setCurrentStep(3);
  };

  const handleComplete = () => {
    // Mark onboarding as complete
    localStorage.setItem("feen_onboarding_complete", "true");
    onComplete?.();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 text-sm ${
                  index <= currentStep
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {completedSteps.includes(index) ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {(() => {
                const StepIcon = steps[currentStep].icon;
                return <StepIcon className="h-6 w-6 text-primary" />;
              })()}
            </div>
            <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>

          <CardContent>
            {/* Welcome Step */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <p className="text-center text-muted-foreground">
                  Hi{userName ? ` ${userName}` : ""}! Feen helps you securely manage and share your AI API keys.
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-medium">Secure</p>
                    <p className="text-xs text-muted-foreground">
                      AES-256 encryption
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-medium">Fast</p>
                    <p className="text-xs text-muted-foreground">
                      Low-latency proxy
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-medium">Collaborative</p>
                    <p className="text-xs text-muted-foreground">
                      Team features
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button onClick={() => setCurrentStep(1)} size="lg">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Add API Key Step */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    placeholder="e.g., Production OpenAI"
                    value={apiKeyData.name}
                    onChange={(e) =>
                      setApiKeyData({ ...apiKeyData, name: e.target.value })
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select
                    value={apiKeyData.provider}
                    onValueChange={(value) =>
                      setApiKeyData({ ...apiKeyData, provider: value })
                    }
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

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={apiKeyData.apiKey}
                    onChange={(e) =>
                      setApiKeyData({ ...apiKeyData, apiKey: e.target.value })
                    }
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your key will be encrypted immediately
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(0)}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={handleSkipToEnd}
                      disabled={isLoading}
                    >
                      Skip for now
                    </Button>
                    <Button onClick={handleAddApiKey} disabled={isLoading}>
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add Key <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Create Token Step */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-4">
                    Shared tokens allow you to give limited access to your API
                    keys with custom rate limits and restrictions.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Custom rate limits (100 req/min)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Daily usage limits (1,000 req/day)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Revocable at any time
                    </li>
                  </ul>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={handleSkipToEnd}
                      disabled={isLoading}
                    >
                      Skip for now
                    </Button>
                    <Button onClick={handleCreateToken} disabled={isLoading}>
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Token <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Complete Step */}
            {currentStep === 3 && (
              <div className="space-y-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>

                <div>
                  <p className="text-muted-foreground mb-4">
                    {completedSteps.length >= 2
                      ? "Great job! You've completed the setup."
                      : "You can always add keys and create tokens from the dashboard."}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-left">
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-1">Documentation</h4>
                    <p className="text-sm text-muted-foreground">
                      Learn more about Feen&apos;s features
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-1">SDK Examples</h4>
                    <p className="text-sm text-muted-foreground">
                      Code snippets for your language
                    </p>
                  </div>
                </div>

                <Button onClick={handleComplete} size="lg" className="w-full">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Hook to check onboarding status
export function useOnboarding() {
  const [isComplete, setIsComplete] = useState(true);

  useEffect(() => {
    const complete = localStorage.getItem("feen_onboarding_complete");
    setIsComplete(complete === "true");
  }, []);

  return { isComplete, setComplete: () => setIsComplete(true) };
}
