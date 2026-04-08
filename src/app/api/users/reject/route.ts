import { NextResponse } from "next/server";
import { callMutation, callQuery, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function POST(request: Request) {
  const body = (await request.json()) as { userId?: string };
  if (!body.userId) {
    return NextResponse.json(
      { ok: false, message: "User id is required." },
      { status: 400 },
    );
  }

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
      { ok: false, message: "Convex is not configured yet." },
      { status: 503 },
    );
  }

  const actor = await callQuery<unknown, { role: string } | null>(
    client,
    "users:getByClerkId",
    { clerkId: profile.userId },
  );

  if (!actor || actor.role !== "admin") {
    return NextResponse.json(
      { ok: false, message: "Admin access required." },
      { status: 403 },
    );
  }

  await callMutation(client, "users:reject", { userId: body.userId });

  return NextResponse.json({ ok: true, message: "Member rejected." });
}
