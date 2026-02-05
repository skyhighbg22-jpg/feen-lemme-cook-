import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decrypt, hash } from "@/lib/crypto";
import { checkRateLimit } from "@/lib/redis";

const PROVIDER_ENDPOINTS: Record<string, string> = {
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

async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const startTime = Date.now();
  const { path } = await params;

  try {
    // Extract the access token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const accessToken = authHeader.slice(7);

    // Validate it's a Feen token
    if (!accessToken.startsWith("feen_")) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 401 }
      );
    }

    // Find the shared key
    const tokenHash = hash(accessToken);
    const sharedKey = await db.sharedKey.findFirst({
      where: {
        tokenHash,
        isActive: true,
      },
      include: {
        apiKey: true,
      },
    });

    if (!sharedKey) {
      return NextResponse.json(
        { error: "Invalid or expired access token" },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (sharedKey.expiresAt && sharedKey.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Access token has expired" },
        { status: 401 }
      );
    }

    // Check max usage
    if (sharedKey.maxUsage && sharedKey.usageCount >= sharedKey.maxUsage) {
      return NextResponse.json(
        { error: "Access token usage limit exceeded" },
        { status: 429 }
      );
    }

    // Check IP allowlist
    const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    if (sharedKey.allowedIPs.length > 0 && !sharedKey.allowedIPs.includes(clientIP)) {
      return NextResponse.json(
        { error: "IP address not allowed" },
        { status: 403 }
      );
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(
      `shared:${sharedKey.id}:minute`,
      sharedKey.rateLimit,
      60
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: rateLimitResult.resetAt - Math.floor(Date.now() / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": sharedKey.rateLimit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
          },
        }
      );
    }

    // Get the provider endpoint
    const provider = sharedKey.apiKey.provider;
    const baseUrl = PROVIDER_ENDPOINTS[provider];

    if (!baseUrl) {
      return NextResponse.json(
        { error: "Unsupported provider" },
        { status: 400 }
      );
    }

    // Decrypt the actual API key
    const actualApiKey = decrypt(sharedKey.apiKey.encryptedKey);

    // Build the proxy URL
    const proxyPath = path.join("/");
    const proxyUrl = `${baseUrl}/${proxyPath}`;

    // Clone and modify headers
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${actualApiKey}`);
    headers.set("Content-Type", request.headers.get("content-type") || "application/json");

    // Add Anthropic-specific headers
    if (provider === "ANTHROPIC") {
      headers.set("x-api-key", actualApiKey);
      headers.set("anthropic-version", "2023-06-01");
    }

    // Forward Bytez-specific headers (Provider-Key for closed-source models)
    if (provider === "BYTEZ") {
      const providerKey = request.headers.get("provider-key");
      if (providerKey) {
        headers.set("Provider-Key", providerKey);
      }
    }

    // Forward the request
    const proxyResponse = await fetch(proxyUrl, {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD"
        ? await request.text()
        : undefined,
    });

    const latencyMs = Date.now() - startTime;

    // Parse response for token counting (if applicable)
    let requestTokens = null;
    let responseTokens = null;
    let totalTokens = null;

    if (proxyResponse.ok) {
      try {
        const responseClone = proxyResponse.clone();
        const responseData = await responseClone.json();

        if (responseData.usage) {
          requestTokens = responseData.usage.prompt_tokens || responseData.usage.input_tokens;
          responseTokens = responseData.usage.completion_tokens || responseData.usage.output_tokens;
          totalTokens = responseData.usage.total_tokens ||
            (requestTokens && responseTokens ? requestTokens + responseTokens : null);
        }
      } catch {
        // Ignore JSON parse errors for non-JSON responses
      }
    }

    // Log usage asynchronously
    db.usageLog.create({
      data: {
        apiKeyId: sharedKey.apiKeyId,
        sharedKeyId: sharedKey.id,
        userId: sharedKey.ownerId,
        provider,
        endpoint: proxyPath,
        method: request.method,
        statusCode: proxyResponse.status,
        requestTokens,
        responseTokens,
        totalTokens,
        latencyMs,
        ipAddress: clientIP,
        userAgent: request.headers.get("user-agent"),
      },
    }).catch(console.error);

    // Update usage count
    db.sharedKey.update({
      where: { id: sharedKey.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    }).catch(console.error);

    // Update API key last used
    db.apiKey.update({
      where: { id: sharedKey.apiKeyId },
      data: { lastUsedAt: new Date() },
    }).catch(console.error);

    // Forward the response
    const responseHeaders = new Headers(proxyResponse.headers);
    responseHeaders.set("X-Feen-Latency", latencyMs.toString());
    responseHeaders.set("X-RateLimit-Limit", sharedKey.rateLimit.toString());
    responseHeaders.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());

    return new NextResponse(proxyResponse.body, {
      status: proxyResponse.status,
      statusText: proxyResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Internal proxy error" },
      { status: 500 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
