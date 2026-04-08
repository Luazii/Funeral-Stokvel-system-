import { NextResponse } from "next/server";
import { callMutation, callQuery, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function GET(request: Request) {
  const client = getConvexClient();
  if (!client) {
    return NextResponse.json(
      { ok: false, message: "Convex is not configured yet." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const mine = searchParams.get("mine") === "true";

  if (mine) {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return NextResponse.json(
        { ok: false, message: "You must be signed in." },
        { status: 401 },
      );
    }

    await callMutation(client, "users:ensure", {
      clerkId: profile.userId,
      name: profile.name,
      email: profile.email,
    });

    const user = await callQuery<unknown, { _id: string; name: string } | null>(
      client,
      "users:getByClerkId",
      { clerkId: profile.userId },
    );

    if (!user) {
      return NextResponse.json({ ok: true, items: [] });
    }

    const contributions = await callQuery<
      unknown,
      Array<{
        _id: string;
        memberId: string;
        amount: number;
        date: string;
        month?: string;
        status: string;
        paymentReference?: string;
      }>
    >(client, "contributions:listByMember", { memberId: user._id });

    const items = contributions.map((contribution) => ({
      _id: contribution._id,
      memberName: user.name,
      amount: contribution.amount,
      date: contribution.date,
      month: contribution.month ?? "",
      status: contribution.status,
      paymentReference: contribution.paymentReference ?? null,
    }));

    return NextResponse.json({ ok: true, items });
  }

  const contributions = await callQuery<
    unknown,
    Array<{
      _id: string;
      memberId: string;
      amount: number;
      date: string;
      month?: string;
      status: string;
      paymentReference?: string;
    }>
  >(client, "contributions:listAll", {});

  // Get member names
  const memberIds = [...new Set(contributions.map(c => c.memberId))];
  const members = await Promise.all(
    memberIds.map(async (memberId) => {
      try {
        const member = await callQuery<unknown, { name: string } | null>(
          client,
          "users:get",
          { userId: memberId }
        );
        return { id: memberId, name: member?.name ?? "Unknown Member" };
      } catch {
        return { id: memberId, name: "Unknown Member" };
      }
    })
  );

  const memberMap = new Map(members.map(m => [m.id, m.name]));

  const items = contributions.map((contribution) => ({
    _id: contribution._id,
    memberName: memberMap.get(contribution.memberId) ?? "Unknown Member",
    amount: contribution.amount,
    date: contribution.date,
    month: contribution.month ?? "",
    status: contribution.status,
    paymentReference: contribution.paymentReference ?? null,
  }));

  return NextResponse.json({ ok: true, items });
}