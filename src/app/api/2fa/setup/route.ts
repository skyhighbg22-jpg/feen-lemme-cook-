import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  generateTwoFactorSecret,
  enableTwoFactor,
  storeBackupCodes,
  isTwoFactorEnabled,
} from "@/lib/security";
import { z } from "zod";

// GET - Generate 2FA setup info
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if already enabled
    const enabled = await isTwoFactorEnabled(session.user.id);
    if (enabled) {
      return NextResponse.json(
        { error: "2FA is already enabled" },
        { status: 400 }
      );
    }

    // Generate new secret
    const { secret, qrCodeUrl, backupCodes } = generateTwoFactorSecret(
      session.user.email,
      "Feen"
    );

    return NextResponse.json({
      secret,
      qrCodeUrl,
      backupCodes,
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json(
      { error: "Failed to setup 2FA" },
      { status: 500 }
    );
  }
}

// POST - Enable 2FA
const enableSchema = z.object({
  secret: z.string().min(1),
  code: z.string().length(6),
  backupCodes: z.array(z.string()).length(10),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { secret, code, backupCodes } = enableSchema.parse(body);

    // Enable 2FA
    const result = await enableTwoFactor(session.user.id, secret, code);

    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Store backup codes
    await storeBackupCodes(session.user.id, backupCodes);

    return NextResponse.json({
      message: "2FA enabled successfully",
      enabled: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("2FA enable error:", error);
    return NextResponse.json(
      { error: "Failed to enable 2FA" },
      { status: 500 }
    );
  }
}
