import { NextResponse } from "next/server";
import { callMutation, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    memberName?: string;
    meetingTitle?: string;
    date?: string;
    status?: "attended" | "missed";
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

  if (!body.meetingTitle || !body.date || !body.status) {
    return NextResponse.json(
      { ok: false, message: "Attendance details are required." },
      { status: 400 },
    );
  }

  const userId = await callMutation<unknown, string>(client, "users:ensure", {
    clerkId: profile.userId,
    name: profile.name,
    email: profile.email,
  });

  await callMutation(client, "attendance:log", {
    memberName: profile.name,
    meetingTitle: body.meetingTitle,
    date: body.date,
    status: body.status,
  });

  if (body.status === "attended") {
    await callMutation(client, "users:addPoints", { userId, points: 5 });
  }

  return NextResponse.json({
    ok: true,
    message: "Attendance logged.",
    payload: body,
    pointsAdded: body.status === "attended" ? 5 : 0,
  });
}
