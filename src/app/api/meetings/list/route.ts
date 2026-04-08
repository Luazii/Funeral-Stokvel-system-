import { NextResponse } from "next/server";
import { callMutation, callQuery, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function GET() {
  const client = getConvexClient();
  if (!client) {
    return NextResponse.json(
      { ok: false, message: "Convex is not configured yet." },
      { status: 503 },
    );
  }

  const profile = await getCurrentUserProfile();
  let memberId: string | undefined;
  if (profile) {
    memberId =
      (await callMutation<unknown, string>(client, "users:ensure", {
        clerkId: profile.userId,
        name: profile.name,
        email: profile.email,
      })) ??
      (await callQuery<unknown, { _id: string } | null>(client, "users:getByClerkId", {
        clerkId: profile.userId,
      }))?._id;
  }

  const items = await callQuery<
    unknown,
    Array<{
      _id: string;
      title: string;
      date: string;
      acceptedCount: number;
      declinedCount: number;
      memberStatus?: "accept" | "decline";
      memberReason?: string;
    }>
  >(
    client,
    "meetings:listWithRsvpSummary",
    { memberId },
  );

  return NextResponse.json({ ok: true, items });
}
