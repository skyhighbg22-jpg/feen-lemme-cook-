import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt, encrypt, hash, generateKeyPrefix } from "@/lib/crypto";
import { z } from "zod";

const updateKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  apiKey: z.string().min(1).optional(),
  rateLimit: z.number().int().min(1).max(100000).optional(),
  dailyLimit: z.number().int().min(1).max(10000000).optional(),
  isActive: z.boolean().optional(),
});

// GET - Get a specific API key
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const apiKey = await db.apiKey.findFirst({
      where: {
        id,
        userId: session.user.id,
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
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            sharedKeys: true,
            usageLogs: true,
          },
        },
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json(apiKey);
  } catch (error) {
    console.error("Error fetching API key:", error);
    return NextResponse.json(
      { error: "Failed to fetch API key" },
      { status: 500 }
    );
  }
}

// PATCH - Update an API key
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateKeySchema.parse(body);

    // Check if the key belongs to the user
    const existingKey = await db.apiKey.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.rateLimit !== undefined) updateData.rateLimit = validatedData.rateLimit;
    if (validatedData.dailyLimit !== undefined) updateData.dailyLimit = validatedData.dailyLimit;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

    // If updating the API key itself
    if (validatedData.apiKey) {
      updateData.encryptedKey = encrypt(validatedData.apiKey);
      updateData.keyHash = hash(validatedData.apiKey);
      updateData.keyPrefix = generateKeyPrefix(validatedData.apiKey);
    }

    const apiKey = await db.apiKey.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        provider: true,
        keyPrefix: true,
        isActive: true,
        rateLimit: true,
        dailyLimit: true,
        updatedAt: true,
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "API_KEY_UPDATED",
        resource: "apiKey",
        resourceId: apiKey.id,
        details: { updatedFields: Object.keys(validatedData) },
      },
    });

    return NextResponse.json(apiKey);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating API key:", error);
    return NextResponse.json(
      { error: "Failed to update API key" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if the key belongs to the user
    const existingKey = await db.apiKey.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Delete the API key (cascades to shared keys)
    await db.apiKey.delete({
      where: { id },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "API_KEY_DELETED",
        resource: "apiKey",
        resourceId: id,
        details: {
          name: existingKey.name,
          provider: existingKey.provider,
        },
      },
    });

    return NextResponse.json({ message: "API key deleted successfully" });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}

// POST - Reveal the decrypted API key (with audit log)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const apiKey = await db.apiKey.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        encryptedKey: true,
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Decrypt the key
    const decryptedKey = decrypt(apiKey.encryptedKey);

    // Log the reveal action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "API_KEY_REVEALED",
        resource: "apiKey",
        resourceId: id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json({ key: decryptedKey });
  } catch (error) {
    console.error("Error revealing API key:", error);
    return NextResponse.json(
      { error: "Failed to reveal API key" },
      { status: 500 }
    );
  }
}
