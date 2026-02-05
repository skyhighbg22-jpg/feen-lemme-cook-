import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt, hash, generateKeyPrefix } from "@/lib/crypto";
import { z } from "zod";

const createKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  provider: z.enum([
    "OPENAI",
    "ANTHROPIC",
    "GOOGLE",
    "AZURE_OPENAI",
    "COHERE",
    "MISTRAL",
    "GROQ",
    "TOGETHER",
    "REPLICATE",
    "HUGGINGFACE",
    "BYTEZ",
    "CUSTOM",
  ]),
  apiKey: z.string().min(1, "API key is required"),
  rateLimit: z.number().int().min(1).max(100000).default(1000),
  dailyLimit: z.number().int().min(1).max(10000000).default(10000),
  teamId: z.string().optional(),
});

// GET - List all API keys for the current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKeys = await db.apiKey.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        provider: true,
        keyPrefix: true,
        isActive: true,
        rateLimit: true,
        dailyLimit: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sharedKeys: true,
            usageLogs: true,
          },
        },
      },
    });

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

// POST - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createKeySchema.parse(body);

    // Encrypt the API key
    const encryptedKey = encrypt(validatedData.apiKey);
    const keyHash = hash(validatedData.apiKey);
    const keyPrefix = generateKeyPrefix(validatedData.apiKey);

    // Create the API key record
    const apiKey = await db.apiKey.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        provider: validatedData.provider,
        encryptedKey,
        keyHash,
        keyPrefix,
        userId: session.user.id,
        teamId: validatedData.teamId,
        rateLimit: validatedData.rateLimit,
        dailyLimit: validatedData.dailyLimit,
      },
      select: {
        id: true,
        name: true,
        description: true,
        provider: true,
        keyPrefix: true,
        isActive: true,
        rateLimit: true,
        dailyLimit: true,
        createdAt: true,
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "API_KEY_CREATED",
        resource: "apiKey",
        resourceId: apiKey.id,
        details: {
          name: apiKey.name,
          provider: apiKey.provider,
        },
      },
    });

    return NextResponse.json(apiKey, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error creating API key:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}
