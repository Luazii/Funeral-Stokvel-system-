import { NextRequest, NextResponse } from "next/server";
import { hasPaystackCredentials, verifyPaystackTransaction } from "@/lib/paystack";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json(
      { ok: false, message: "Reference parameter is required" },
      { status: 400 }
    );
  }

  if (!hasPaystackCredentials()) {
    return NextResponse.json(
      {
        ok: false,
        message: "Paystack credentials are not configured",
      },
      { status: 503 }
    );
  }

  try {
    const verification = await verifyPaystackTransaction(reference);

    return NextResponse.json({
      ok: true,
      data: verification.data,
    });
  } catch (error: unknown) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to verify payment",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}