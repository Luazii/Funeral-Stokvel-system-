import { NextRequest, NextResponse } from "next/server";
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
          if (user) {
            // Log the contribution
            await callMutation(client, "contributions:create", {
              memberId: user._id,
              amount: amount / 100,
              date: new Date().toISOString(),
              month: metadata?.month,
              status: "paid",
              paymentReference: reference,
            });

            // Check if already contributed this month and add points if not
            const contributions = await callQuery<unknown, Array<{ date: string }>>(client, "contributions:listByMember", {
              memberId: user._id,
            });
            const currentMonth = new Date().toISOString().slice(0, 7);
            const hasContributedThisMonth = contributions.some(contrib => contrib.date.startsWith(currentMonth));
            if (!hasContributedThisMonth) {
              await callMutation(client, "users:addPoints", { userId: user._id, points: 3 });
            }
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

export const config = {
  runtime: 'edge',
};