import { NextResponse } from "next/server";
import { callMutation, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    meetingId?: string;
    minutesDocumentUrl?: string;
  };

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json({ ok: false, message: "Convex is not configured." }, { status: 503 });
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    return NextResponse.json({ ok: false, message: "You must be signed in." }, { status: 401 });
  }

  if (!body.meetingId || !body.minutesDocumentUrl) {
    return NextResponse.json(
      { ok: false, message: "Meeting ID and minutes URL are required." },
      { status: 400 },
    );
  }

  await callMutation(client, "meetings:updateMinutes", {
    meetingId: body.meetingId,
    minutesDocumentUrl: body.minutesDocumentUrl,
  });

  return NextResponse.json({ ok: true, message: "Meeting minutes uploaded successfully." });
}
