import { NextResponse } from "next/server";
import { callQuery, getConvexClient } from "@/lib/convex-server";

export async function GET() {
  const client = getConvexClient();
  if (!client) {
    return NextResponse.json({ ok: false, message: "Convex is not configured." }, { status: 503 });
  }

  const fines = await callQuery<
    Record<string, never>,
    Array<{ _id: string; memberName: string; amount: number; reason: string; date: string; status: string }>
  >(client, "fines:listAll", {});

  return NextResponse.json({ ok: true, items: fines ?? [] });
}
