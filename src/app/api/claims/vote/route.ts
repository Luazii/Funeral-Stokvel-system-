import { NextResponse } from "next/server";
import { callMutation, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function POST(request: Request) {
  const body = (await request.json()) as { claimId?: string; vote?: "for" | "against" };

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json({ ok: false, message: "Convex is not configured." }, { status: 503 });
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    return NextResponse.json({ ok: false, message: "You must be signed in." }, { status: 401 });
  }

  if (!body.claimId || !body.vote) {
    return NextResponse.json({ ok: false, message: "Claim ID and vote are required." }, { status: 400 });
  }

  await callMutation(client, "claims:vote", { claimId: body.claimId, vote: body.vote });

  return NextResponse.json({ ok: true, message: `Your vote (${body.vote}) has been recorded.` });
}
