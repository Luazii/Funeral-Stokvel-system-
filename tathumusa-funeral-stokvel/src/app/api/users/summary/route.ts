import { NextResponse } from "next/server";
import { callMutation, callQuery, getConvexClient } from "@/lib/convex-server";
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

  await callMutation(client, "users:ensure", {
    clerkId: profile.userId,
    name: profile.name,
    email: profile.email,
  });

  const user = await callQuery<
    unknown,
    { _id: string; name: string; role: string; points?: number; memberNumber?: string } | null
  >(client, "users:getByClerkId", { clerkId: profile.userId });

  return NextResponse.json({
    ok: true,
    user: user
      ? {
          name: user.name,
          role: user.role,
          points: user.points ?? 0,
          memberNumber: user.memberNumber ?? (user.role === "admin" ? "ADM-0001" : "MEM-0001"),
          email: profile.email,
        }
      : null,
  });
}
