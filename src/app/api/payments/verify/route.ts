import { NextRequest, NextResponse } from "next/server";
import { hasPaystackCredentials, verifyPaystackTransaction } from "@/lib/paystack";
import { callMutation, callQuery, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

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
    const transaction = verification.data;
    const client = getConvexClient();
    let recorded = false;

    if (client && transaction?.status === "success") {
      let memberId: string | null = null;

      const profile = await getCurrentUserProfile();
      if (profile) {
        memberId =
          (await callMutation<unknown, string>(client, "users:ensure", {
            clerkId: profile.userId,
            name: profile.name,
            email: profile.email,
          })) ??
          (await callQuery<unknown, { _id: string } | null>(client, "users:getByClerkId", {
            clerkId: profile.userId,
          }))?._id ??
          null;
      }

      if (!memberId && transaction.customer?.email) {
        memberId =
          (
            await callQuery<unknown, { _id: string } | null>(client, "users:getByEmail", {
              email: transaction.customer.email,
            })
          )?._id ?? null;
      }

      if (memberId && typeof transaction.amount === "number") {
        await callMutation(client, "contributions:recordPayment", {
          memberId,
          amount: transaction.amount / 100,
          date:
            transaction.paid_at ??
            transaction.transaction_date ??
            new Date().toISOString(),
          month:
            typeof transaction.metadata?.month === "string"
              ? transaction.metadata.month
              : undefined,
          paymentReference: reference,
        });
        recorded = true;
      }
    }

    return NextResponse.json({
      ok: true,
      data: transaction,
      recorded,
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
