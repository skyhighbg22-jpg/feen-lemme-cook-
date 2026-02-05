import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireTwoFactorVerification, isTwoFactorEnabled } from "@/lib/security";
import { z } from "zod";

const verifySchema = z.object({
  code: z.string().min(6).max(10),
  action: z.string().min(1),
});

// POST - Verify 2FA for sensitive action
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, action } = verifySchema.parse(body);

    const result = await requireTwoFactorVerification(
      session.user.id,
      code,
      action
    );

    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      verified: true,
      action,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("2FA verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify 2FA" },
      { status: 500 }
    );
  }
}

// GET - Check 2FA status
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const enabled = await isTwoFactorEnabled(session.user.id);

    return NextResponse.json({ enabled });
  } catch (error) {
    console.error("2FA status error:", error);
    return NextResponse.json(
      { error: "Failed to check 2FA status" },
      { status: 500 }
    );
  }
}
