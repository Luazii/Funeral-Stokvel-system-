import { NextResponse } from "next/server";
import { callMutation, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function POST(request: Request) {
  const body = (await request.json()) as { externalId?: string; vote?: "yes" | "no" };

  const profile = await getCurrentUserProfile();
  if (!profile) {
    return NextResponse.json(
      { ok: false, message: "You must be signed in." },
      { status: 401 },
    );
  }

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json(
      { ok: false, message: "Convex is not configured yet.", payload: body },
      { status: 503 },
    );
  }

  if (!body.externalId || !body.vote) {
    return NextResponse.json(
      { ok: false, message: "Decision id and vote are required." },
      { status: 400 },
    );
  }

  await callMutation(client, "decisions:vote", {
    externalId: body.externalId,
    vote: body.vote,
  });

  return NextResponse.json({ ok: true, message: "Vote recorded.", payload: body });
}
