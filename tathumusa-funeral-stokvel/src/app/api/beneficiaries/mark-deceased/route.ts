import { NextResponse } from "next/server";
import { callMutation, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function POST(request: Request) {
  const body = (await request.json()) as { idNumber?: string };
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

  if (!body.idNumber) {
    return NextResponse.json(
      { ok: false, message: "ID number is required." },
      { status: 400 },
    );
  }

  await callMutation(client, "beneficiaries:markDeceased", {
    idNumber: body.idNumber,
  });

  return NextResponse.json({ ok: true, message: "Beneficiary marked deceased.", payload: body });
}
