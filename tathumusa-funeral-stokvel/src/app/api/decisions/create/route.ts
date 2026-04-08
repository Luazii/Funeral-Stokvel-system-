import { NextResponse } from "next/server";
import { callMutation, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    externalId?: string;
    title?: string;
    description?: string;
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
      { ok: false, message: "Convex is not configured yet.", payload: body },
      { status: 503 },
    );
  }

  await callMutation(client, "decisions:create", {
    externalId: body.externalId ?? `decision-${Date.now()}`,
    title: body.title ?? "Request for Payment",
    description: body.description ?? "Member voting required.",
  });

  return NextResponse.json({ ok: true, message: "Decision created and broadcast.", payload: body });
}
