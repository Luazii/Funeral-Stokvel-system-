import { NextResponse } from "next/server";
import { callMutation, getConvexClient } from "@/lib/convex-server";

export async function POST(request: Request) {
  const client = getConvexClient();
  if (!client) {
    return NextResponse.json(
      { ok: false, message: "Convex is not configured yet." },
      { status: 503 },
    );
  }

  try {
    const { externalId } = (await request.json()) as { externalId: string };
    await callMutation(client, "decisions:remove", { externalId });
    return NextResponse.json({ ok: true, message: "Decision removed." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Failed to remove decision." },
      { status: 500 },
    );
  }
}