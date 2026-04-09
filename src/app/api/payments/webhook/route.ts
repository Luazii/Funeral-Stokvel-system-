import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { hasPaystackWebhookSecret, paystackConfig } from "@/lib/paystack";
import crypto from "crypto";
import { callMutation, callQuery, getConvexClient } from "@/lib/convex-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    if (!hasPaystackWebhookSecret()) {
      return NextResponse.json(
        {
          ok: false,
          message: "Paystack webhook secret is not configured. Set PAYSTACK_WEBHOOK_SECRET.",
        },
        { status: 503 }
      );
    }

    if (!signature) {
      return NextResponse.json(
        { ok: false, message: "No signature provided" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha512", paystackConfig.webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { ok: false, message: "Invalid signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    // Handle different event types
    switch (event.event) {
      case "charge.success":
        // Payment was successful
        const { reference, amount, customer, metadata } = event.data;

        const client = getConvexClient();
        if (client) {
          const user = await callQuery<unknown, { _id: string } | null>(client, "users:getByEmail", {
            email: customer.email,
          });
          if (user && typeof amount === "number") {
            await callMutation(client, "contributions:recordPayment", {
              memberId: user._id,
              amount: amount / 100,
              date:
                event.data.paid_at ??
                event.data.transaction_date ??
                new Date().toISOString(),
              month: typeof metadata?.month === "string" ? metadata.month : undefined,
              paymentReference: reference,
            });
          }
        }

        console.log("Payment successful:", {
          reference,
          amount: amount / 100,
          email: customer.email,
          month: metadata?.month,
        });

        break;

      case "charge.failed":
        // Payment failed
        console.log("Payment failed:", event.data);
        break;

      default:
        console.log("Unhandled event type:", event.event);
    }

    return NextResponse.json({ ok: true, message: "Webhook processed" });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { ok: false, message: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
