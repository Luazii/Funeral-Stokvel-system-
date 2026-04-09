import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { hasPaystackCredentials, initializePaystackTransaction } from "@/lib/paystack";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const body = (await request.json()) as {
    amount?: number;
    email?: string;
    month?: string;
    reference?: string;
  };

  if (!hasPaystackCredentials()) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Paystack credentials are not configured yet. Add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY and PAYSTACK_SECRET_KEY.",
        payload: body,
      },
      { status: 503 },
    );
  }

  if (!body.amount || !body.email) {
    return NextResponse.json(
      {
        ok: false,
        message: "Amount and email are required",
        payload: body,
      },
      { status: 400 },
    );
  }

  try {
    const monthSlug = body.month
      ? body.month.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      : `payment-${Date.now()}`;
    const reference = body.reference || `monthly-contribution-${monthSlug}-${Date.now()}`;

    // Initialize transaction with Paystack using our Fetch helper
    const transaction = await initializePaystackTransaction({
      amount: Math.round(body.amount * 100), // Paystack expects amount in kobo/cents
      email: body.email,
      reference,
      currency: "ZAR",
      callback_url: `${origin}/dashboard`,
      metadata: {
        month: body.month,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Payment initialized successfully",
      data: {
        authorization_url: transaction.data.authorization_url,
        access_code: transaction.data.access_code,
        reference: transaction.data.reference,
      },
    });
  } catch (error: any) {
    console.error("Paystack initialization error:", error);
    
    // Extract the most useful error message
    const errorMessage = error.message || (error.response?.data?.message) || "Failed to initialize payment";
    
    return NextResponse.json(
      {
        ok: false,
        message: errorMessage,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
