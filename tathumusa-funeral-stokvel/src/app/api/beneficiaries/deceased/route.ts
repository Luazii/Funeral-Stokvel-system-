import { NextResponse } from "next/server";
import { callQuery, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function GET() {
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

  const items = await callQuery<
    unknown,
    Array<{
      _id: string;
      name: string;
      surname?: string;
      idNumber: string;
      relationship: string;
      status: "deceased";
    }>
  >(client, "beneficiaries:listDeceased", {});

  return NextResponse.json({ ok: true, items });
}
