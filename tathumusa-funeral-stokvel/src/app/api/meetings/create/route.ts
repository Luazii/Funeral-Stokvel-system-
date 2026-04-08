import { NextResponse } from "next/server";
import { callMutation, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    title?: string;
    date?: string;
    time?: string;
    message?: string;
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

  if (!body.title || !body.date || !body.time) {
    return NextResponse.json(
      { ok: false, message: "Title, date, and time are required." },
      { status: 400 },
    );
  }

  const meetingId = await callMutation<unknown, string>(client, "meetings:create", {
    title: body.title,
    date: `${body.date} - ${body.time}`,
    minutesDocumentUrl: undefined,
  });

  return NextResponse.json({
    ok: true,
    message: "Meeting scheduled and notifications queued.",
    meetingId,
    payload: body,
  });
}
