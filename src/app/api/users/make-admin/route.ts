import { NextResponse } from "next/server";
import { callMutation, callQuery, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function POST() {
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

  const userId = await callMutation<unknown, string>(client, "users:ensure", {
    clerkId: profile.userId,
    name: profile.name,
    email: profile.email,
  });

  await callMutation(client, "users:setRole", { userId, role: "admin" });
  await callMutation(client, "users:approve", { userId });

  return NextResponse.json({ ok: true, message: "Admin access granted." });
}
