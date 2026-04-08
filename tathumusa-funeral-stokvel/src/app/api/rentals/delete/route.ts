import { NextResponse } from "next/server";
import { callMutation, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function POST(request: Request) {
  const body = (await request.json()) as { rentalId?: string };
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

  if (!body.rentalId) {
    return NextResponse.json(
      { ok: false, message: "Rental id is required." },
      { status: 400 },
    );
  }

  await callMutation(client, "rentals:remove", { rentalId: body.rentalId });
  return NextResponse.json({ ok: true, message: "Rental request removed." });
}
