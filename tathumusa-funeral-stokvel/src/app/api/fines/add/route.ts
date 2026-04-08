import { NextResponse } from "next/server";
import { callMutation, callQuery, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    memberNumber?: string;
    amount?: number;
    reason?: string;
  };

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json({ ok: false, message: "Convex is not configured." }, { status: 503 });
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    return NextResponse.json({ ok: false, message: "You must be signed in." }, { status: 401 });
  }

  if (!body.memberNumber || !body.amount || !body.reason) {
    return NextResponse.json(
      { ok: false, message: "Member number, amount, and reason are required." },
      { status: 400 },
    );
  }

  const targetUser = await callQuery<{ memberNumber: string }, { _id: string; name: string } | null>(
    client,
    "users:getByMemberNumber",
    { memberNumber: body.memberNumber },
  );

  if (!targetUser) {
    return NextResponse.json({ ok: false, message: "Member not found." }, { status: 404 });
  }

  await callMutation(client, "fines:create", {
    memberId: targetUser._id,
    memberName: targetUser.name,
    amount: body.amount,
    reason: body.reason,
    date: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, message: `Fine of R${body.amount} added to ${targetUser.name}.` });
}
