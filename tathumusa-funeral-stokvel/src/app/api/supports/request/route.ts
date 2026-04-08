import { NextResponse } from "next/server";
import { callMutation, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    funeralOf?: string;
    supportType?: string;
    notes?: string;
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

  if (!body.funeralOf || !body.supportType) {
    return NextResponse.json(
      { ok: false, message: "Funeral name and support type are required." },
      { status: 400 },
    );
  }

  await callMutation(client, "supportRequests:create", {
    memberName: profile.name,
    funeralOf: body.funeralOf,
    supportType: body.supportType,
    notes: body.notes,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, message: "Group support request submitted." });
}
