import { NextResponse } from "next/server";
import { callMutation, callQuery, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    memberName?: string;
    amount?: number;
    date?: string;
    month?: string;
  };

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json(
      { ok: false, message: "Convex is not configured yet.", payload: body },
      { status: 503 },
    );
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    return NextResponse.json(
      { ok: false, message: "You must be signed in." },
      { status: 401 },
    );
  }

  if (!body.amount || !body.date) {
    return NextResponse.json(
      { ok: false, message: "Contribution details are required." },
      { status: 400 },
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

  await callMutation(client, "contributions:create", {
    memberId: memberId ?? (profile.userId as unknown as string),
    amount: body.amount,
    date: body.date,
    month: body.month,
    status: "paid",
  });

  let pointsAdded = 0;
  if (memberId) {
    // Check if member has already contributed this month
    const contributions = await callQuery<unknown, Array<{ date: string }>>(client, "contributions:listByMember", {
      memberId,
    });
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const hasContributedThisMonth = contributions.some(contrib => contrib.date.startsWith(currentMonth));
    if (!hasContributedThisMonth) {
      await callMutation(client, "users:addPoints", { userId: memberId, points: 3 });
      pointsAdded = 3;
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Contribution logged.",
    payload: body,
    pointsAdded,
  });
}
