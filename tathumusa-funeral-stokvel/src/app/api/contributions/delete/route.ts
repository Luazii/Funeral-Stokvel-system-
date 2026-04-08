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
    const { contributionId } = (await request.json()) as { contributionId: string };
    await callMutation(client, "contributions:remove", { contributionId });
    return NextResponse.json({ ok: true, message: "Contribution removed." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Failed to remove contribution." },
      { status: 500 },
    );
  }
}