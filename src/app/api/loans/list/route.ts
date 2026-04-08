import { NextResponse } from "next/server";
import { callQuery, getConvexClient } from "@/lib/convex-server";

export async function GET() {
  const client = getConvexClient();
  if (!client) {
    return NextResponse.json({ ok: false, message: "Convex is not configured." }, { status: 503 });
  }

  const loans = await callQuery<
    Record<string, never>,
    Array<{ _id: string; memberId: string; amount: number; reason: string; status: string; interestRate: number }>
  >(client, "loans:listAll", {});

  return NextResponse.json({ ok: true, items: loans ?? [] });
}
