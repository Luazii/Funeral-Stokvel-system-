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

  const user = await callQuery<unknown, { _id: string; status: string } | null>(
    client,
    "users:getByClerkId",
    { clerkId: profile.userId },
  );

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Member profile not found." },
      { status: 404 },
    );
  }

  if (user.status !== "approved" && user.status !== "active") {
    return NextResponse.json(
      { ok: false, message: "Admin approval is required before accepting terms." },
      { status: 403 },
    );
  }

  await callMutation(client, "users:setTermsAccepted", {
    userId: user._id,
    acceptedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, message: "Terms accepted." });
}
