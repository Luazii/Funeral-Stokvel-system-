import { NextResponse } from "next/server";
import { callQuery, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function GET() {
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

  const user = await callQuery<
    unknown,
    { status: string; role: string; termsAcceptedAt?: string | null } | null
  >(client, "users:getByClerkId", { clerkId: profile.userId });

  return NextResponse.json({ ok: true, user });
}

export const config = {
  runtime: 'edge',
};
