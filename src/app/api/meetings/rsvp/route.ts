import { NextResponse } from "next/server";
import { callMutation, callQuery, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    meetingTitle?: string;
    status?: "accept" | "decline";
    reason?: string;
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

  if (!body.meetingTitle || !body.status) {
    return NextResponse.json(
      { ok: false, message: "Meeting title and status are required." },
      { status: 400 },
    );
  }

  const meetingRecord = await callQuery<unknown, { _id: string } | null>(
    client,
    "meetings:getByTitle",
    {
      title: body.meetingTitle,
    },
  );

  const meetingId =
    meetingRecord?._id ??
    (await callMutation<unknown, string>(client, "meetings:ensureByTitle", {
      title: body.meetingTitle,
      date: new Date().toISOString(),
    }));

  const memberId =
    (await callMutation<unknown, string>(client, "users:ensure", {
      clerkId: profile.userId,
      name: profile.name,
      email: profile.email,
    })) ??
    (await callQuery<unknown, { _id: string } | null>(client, "users:getByClerkId", {
      clerkId: profile.userId,
    }))?._id;

  await callMutation(client, "meetings:rsvp", {
    meetingId: meetingId ?? (body.meetingTitle as unknown as string),
    memberId: memberId ?? (profile.userId as unknown as string),
    status: body.status,
    reason: body.reason,
  });

  return NextResponse.json({ ok: true, message: "RSVP recorded.", payload: body });
}
