import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateAccessToken, hash } from "@/lib/crypto";
import { z } from "zod";

const createSharedKeySchema = z.object({
  apiKeyId: z.string().min(1, "API key is required"),
  name: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  rateLimit: z.number().int().min(1).max(100000).default(100),
  dailyLimit: z.number().int().min(1).max(1000000).default(1000),
  maxUsage: z.number().int().min(1).optional(),
  expiresAt: z.string().datetime().optional(),
  allowedIPs: z.array(z.string()).default([]),
  allowedModels: z.array(z.string()).default([]),
  permissions: z.object({
    chat: z.boolean().default(true),
    completions: z.boolean().default(true),
    embeddings: z.boolean().default(true),
    images: z.boolean().default(false),
    audio: z.boolean().default(false),
  }).default({}),
});

// GET - List all shared keys for the current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sharedKeys = await db.sharedKey.findMany({
      where: { ownerId: session.user.id },
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

    // Don't expose the full access token
    const sanitizedKeys = sharedKeys.map((key) => ({
      ...key,
      accessToken: `${key.accessToken.slice(0, 12)}...`,
    }));

    return NextResponse.json(sanitizedKeys);
  } catch (error) {
    console.error("Error fetching shared keys:", error);
    return NextResponse.json(
      { error: "Failed to fetch shared keys" },
      { status: 500 }
    );
  }
}

// POST - Create a new shared key
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSharedKeySchema.parse(body);

    // Verify the API key belongs to the user
    const apiKey = await db.apiKey.findFirst({
      where: {
        id: validatedData.apiKeyId,
        userId: session.user.id,
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    // Generate access token
    const accessToken = generateAccessToken("feen");
    const tokenHash = hash(accessToken);

    // Create the shared key
    const sharedKey = await db.sharedKey.create({
      data: {
        apiKeyId: validatedData.apiKeyId,
        ownerId: session.user.id,
        accessToken,
        tokenHash,
        name: validatedData.name,
        description: validatedData.description,
        permissions: validatedData.permissions,
        rateLimit: validatedData.rateLimit,
        dailyLimit: validatedData.dailyLimit,
        maxUsage: validatedData.maxUsage,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
        allowedIPs: validatedData.allowedIPs,
        allowedModels: validatedData.allowedModels,
      },
      include: {
        apiKey: {
          select: {
            name: true,
            provider: true,
          },
        },
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SHARED_KEY_CREATED",
        resource: "sharedKey",
        resourceId: sharedKey.id,
        details: {
          apiKeyId: validatedData.apiKeyId,
          name: validatedData.name,
        },
      },
    });

    return NextResponse.json(
      {
        ...sharedKey,
        accessToken, // Return full token only on creation
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error creating shared key:", error);
    return NextResponse.json(
      { error: "Failed to create shared key" },
      { status: 500 }
    );
  }
}
