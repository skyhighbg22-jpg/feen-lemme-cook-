import { ApiProvider } from "@prisma/client";
import { redis } from "./redis";

export const PROVIDER_ENDPOINTS: Record<string, string> = {
  OPENAI: "https://api.openai.com",
  ANTHROPIC: "https://api.anthropic.com",
  GOOGLE: "https://generativelanguage.googleapis.com",
  COHERE: "https://api.cohere.ai",
  MISTRAL: "https://api.mistral.ai",
  GROQ: "https://api.groq.com/openai",
  TOGETHER: "https://api.together.xyz",
  REPLICATE: "https://api.replicate.com",
  HUGGINGFACE: "https://api-inference.huggingface.co",
  BYTEZ: "https://api.bytez.ai/v2",
};

export const MODEL_PROVIDER_MAP: Record<string, ApiProvider[]> = {
  "gpt-3.5-turbo": [ApiProvider.OPENAI, ApiProvider.AZURE_OPENAI, ApiProvider.TOGETHER],
  "gpt-4": [ApiProvider.OPENAI, ApiProvider.AZURE_OPENAI],
  "gpt-4-turbo": [ApiProvider.OPENAI, ApiProvider.AZURE_OPENAI],
  "gpt-4o": [ApiProvider.OPENAI, ApiProvider.AZURE_OPENAI],
  "claude-3-opus-20240229": [ApiProvider.ANTHROPIC],
  "claude-3-sonnet-20240229": [ApiProvider.ANTHROPIC],
  "claude-3-haiku-20240307": [ApiProvider.ANTHROPIC],
  "mistral-large-latest": [ApiProvider.MISTRAL, ApiProvider.AZURE_OPENAI],
  "llama-3-70b-instruct": [ApiProvider.TOGETHER, ApiProvider.GROQ, ApiProvider.MISTRAL],
  "llama-3-8b-instruct": [ApiProvider.TOGETHER, ApiProvider.GROQ, ApiProvider.MISTRAL],
};

export async function getFastestProvider(model: string, availableProviders: ApiProvider[]): Promise<ApiProvider | null> {
  const preferredProviders = MODEL_PROVIDER_MAP[model] || [];
  
  // Intersection of available providers (that we have keys for) and preferred providers for this model
  const candidates = availableProviders.filter(p => preferredProviders.includes(p));
  
  if (candidates.length === 0) {
    return availableProviders.length > 0 ? availableProviders[0] : null;
  }
  
  if (candidates.length === 1) return candidates[0];

  const scores = await Promise.all(
    candidates.map(async (p) => {
      const latency = await redis.get(`latency:${p}`);
      return { provider: p, latency: latency ? parseInt(latency) : Infinity };
    })
  );

  const sorted = scores.sort((a, b) => a.latency - b.latency);
  return sorted[0].provider;
}

export async function recordLatency(provider: ApiProvider, latencyMs: number) {
  await redis.set(`latency:${provider}`, latencyMs.toString(), "EX", 60);
}

export async function probeProvider(provider: ApiProvider, apiKey: string) {
  const baseUrl = PROVIDER_ENDPOINTS[provider];
  if (!baseUrl) return;

  const startTime = Date.now();
  try {
    let url = `${baseUrl}/v1/chat/completions`;
    let headers: Record<string, string> = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    if (provider === ApiProvider.ANTHROPIC) {
      url = `${baseUrl}/v1/messages`;
      headers = {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: provider === ApiProvider.ANTHROPIC ? "claude-3-haiku-20240307" : "gpt-3.5-turbo",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
      }),
    });

    if (response.ok) {
      const latencyMs = Date.now() - startTime;
      await recordLatency(provider, latencyMs);
    }
  } catch (error) {
    console.error(`Error probing provider ${provider}:`, error);
  }
}
