import { NextResponse } from "next/server";
import { callMutation, callQuery, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    memberNumber?: string;
    points?: number;
  };

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

  const actor = await callQuery<unknown, { role: string } | null>(
    client,
    "users:getByClerkId",
    { clerkId: profile.userId },
  );

  if (!actor || actor.role !== "admin") {
    return NextResponse.json(
      { ok: false, message: "Admin access required." },
      { status: 403 },
    );
  }

  if (!body.memberNumber || typeof body.points !== "number") {
    return NextResponse.json(
      { ok: false, message: "Member number and points are required." },
      { status: 400 },
    );
  }

  const target = await callQuery<unknown, { _id: string } | null>(
    client,
    "users:getByMemberNumber",
    { memberNumber: body.memberNumber },
  );

  if (!target) {
    return NextResponse.json(
      { ok: false, message: "Member not found." },
      { status: 404 },
    );
  }

  await callMutation(client, "users:addPoints", {
    userId: target._id,
    points: body.points,
  });

  return NextResponse.json({ ok: true, message: "Points awarded." });
}
