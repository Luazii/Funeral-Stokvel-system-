import { NextResponse } from "next/server";
import { callQuery, getConvexClient } from "@/lib/convex-server";

export async function GET() {
  const client = getConvexClient();
  if (!client) {
    return NextResponse.json(
      { ok: false, message: "Convex is not configured yet." },
      { status: 503 },
    );
  }

  const items = await callQuery<unknown, Array<{ externalId: string; title: string; description: string; yesVotes: number; noVotes: number }>>(
    client,
    "decisions:list",
    {},
  );

  return NextResponse.json({ ok: true, items });
}
