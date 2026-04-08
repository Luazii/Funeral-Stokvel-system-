import { NextResponse } from "next/server";
import { callMutation, getConvexClient } from "@/lib/convex-server";

export async function POST(request: Request) {
  const body = (await request.json()) as { claimId?: string };

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json({ ok: false, message: "Convex is not configured." }, { status: 503 });
  }

  if (!body.claimId) {
    return NextResponse.json({ ok: false, message: "Claim ID is required." }, { status: 400 });
  }

  await callMutation(client, "claims:setStatus", { claimId: body.claimId, status: "rejected" });

  return NextResponse.json({ ok: true, message: "Claim rejected." });
}
