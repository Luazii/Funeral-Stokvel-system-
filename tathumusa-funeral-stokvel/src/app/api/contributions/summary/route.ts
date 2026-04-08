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

  const memberId =
    (await callMutation<unknown, string>(client, "users:ensure", {
      clerkId: profile.userId,
      name: profile.name,
      email: profile.email,
    })) ??
    (await callQuery<unknown, { _id: string } | null>(client, "users:getByClerkId", {
      clerkId: profile.userId,
    }))?._id;

  const all = await callQuery<unknown, Array<{ amount: number; memberId: string }>>(
    client,
    "contributions:listAll",
    {},
  );

  const totalPaid = all
    .filter((entry) => entry.memberId === memberId)
    .reduce((sum, entry) => sum + entry.amount, 0);

  return NextResponse.json({ ok: true, totalPaid });
}
