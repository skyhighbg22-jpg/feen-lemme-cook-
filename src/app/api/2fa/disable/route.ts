import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { disableTwoFactor } from "@/lib/security";
import { z } from "zod";

const disableSchema = z.object({
  code: z.string().min(6).max(10),
});

// POST - Disable 2FA
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code } = disableSchema.parse(body);

    const result = await disableTwoFactor(session.user.id, code);

    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: "2FA disabled successfully",
      enabled: false,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("2FA disable error:", error);
    return NextResponse.json(
      { error: "Failed to disable 2FA" },
      { status: 500 }
    );
  }
}
