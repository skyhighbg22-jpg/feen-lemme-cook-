import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decrypt, hash } from "@/lib/crypto";
import { checkRateLimit } from "@/lib/redis";
import { PROVIDER_ENDPOINTS, getFastestProvider, recordLatency } from "@/lib/routing";
import { ApiProvider } from "@prisma/client";

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

    const requestText = await request.text();
    let bodyJSON: any = {};
    try {
      bodyJSON = JSON.parse(requestText);
    } catch (e) {}

    const requestedModel = bodyJSON.model;

    // Find all active API keys available to this user/team
    const availableApiKeys = await db.apiKey.findMany({
      where: {
        OR: [
          { userId: sharedKey.ownerId },
          { teamId: sharedKey.apiKey.teamId },
        ],
        isActive: true,
      },
    });

    // Determine the best provider based on latency
    const availableProviders = availableApiKeys.map((k) => k.provider);
    const bestProvider = requestedModel 
      ? await getFastestProvider(requestedModel, availableProviders)
      : sharedKey.apiKey.provider;

    // Sort API keys by preference (best provider first, then the one linked to sharedKey)
    const sortedApiKeys = [...availableApiKeys].sort((a, b) => {
      if (a.provider === bestProvider) return -1;
      if (b.provider === bestProvider) return 1;
      if (a.id === sharedKey.apiKeyId) return -1;
      if (b.id === sharedKey.apiKeyId) return 1;
      return 0;
    });

    let proxyResponse: Response | null = null;
    let selectedApiKey = sortedApiKeys[0];
    let finalProvider = selectedApiKey.provider;

    // Try providers in order (Fallback Logic)
    for (const apiKey of sortedApiKeys) {
      selectedApiKey = apiKey;
      finalProvider = apiKey.provider;
      const baseUrl = PROVIDER_ENDPOINTS[finalProvider];
      if (!baseUrl) continue;

      const actualApiKey = decrypt(apiKey.encryptedKey);
      const proxyPath = path.join("/");
      const proxyUrl = `${baseUrl}/${proxyPath}`;

      const headers = new Headers();
      headers.set("Authorization", `Bearer ${actualApiKey}`);
      headers.set("Content-Type", request.headers.get("content-type") || "application/json");

      if (finalProvider === ApiProvider.ANTHROPIC) {
        headers.set("x-api-key", actualApiKey);
        headers.set("anthropic-version", "2023-06-01");
      }

      if (finalProvider === ApiProvider.BYTEZ) {
        const providerKey = request.headers.get("provider-key");
        if (providerKey) {
          headers.set("Provider-Key", providerKey);
        }
      }

      try {
        proxyResponse = await fetch(proxyUrl, {
          method: request.method,
          headers,
          body: request.method !== "GET" && request.method !== "HEAD"
            ? requestText
            : undefined,
        });

        if (proxyResponse.ok) {
          break; // Success!
        } else {
          console.warn(`Provider ${finalProvider} failed with status ${proxyResponse.status}`);
        }
      } catch (error) {
        console.error(`Error with provider ${finalProvider}:`, error);
      }
    }

    if (!proxyResponse) {
      return NextResponse.json(
        { error: "All available providers failed" },
        { status: 502 }
      );
    }

    const latencyMs = Date.now() - startTime;

    // Record latency for the selected provider
    if (proxyResponse.ok) {
      await recordLatency(finalProvider, latencyMs);
    }

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
        apiKeyId: selectedApiKey.id,
        sharedKeyId: sharedKey.id,
        userId: sharedKey.ownerId,
        provider: finalProvider,
        model: requestedModel,
        endpoint: path.join("/"),
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
      where: { id: selectedApiKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(console.error);

    // Forward the response
    const responseHeaders = new Headers(proxyResponse.headers);
    responseHeaders.set("X-Feen-Latency", latencyMs.toString());
    responseHeaders.set("X-Feen-Provider", finalProvider);
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
