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

  const items = await callQuery<
    unknown,
    Array<{ _id: string; name: string; email?: string; joinDate: string; status: string }>
  >(client, "users:list", {});

  const pending = items.filter((item) => item.status === "pending");

  return NextResponse.json({ ok: true, items: pending });
}
