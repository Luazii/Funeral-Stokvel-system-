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

  if (!memberId) {
    return NextResponse.json({ ok: true, items: [] });
  }

  const items = await callQuery<
    unknown,
    Array<{
      name: string;
      surname?: string;
      relationship: string;
      idNumber: string;
      age?: number;
      gender?: string;
      idDocumentUrl?: string;
      photoUrl?: string;
    }>
  >(
    client,
    "beneficiaries:listByMember",
    { memberId },
  );

  return NextResponse.json({ ok: true, items });
}

export const config = {
  runtime: 'edge',
};
