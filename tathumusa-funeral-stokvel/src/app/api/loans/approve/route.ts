import { NextResponse } from "next/server";
import { callMutation, getConvexClient } from "@/lib/convex-server";

export async function POST(request: Request) {
  const body = (await request.json()) as { loanId?: string };

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json({ ok: false, message: "Convex is not configured." }, { status: 503 });
  }

  if (!body.loanId) {
    return NextResponse.json({ ok: false, message: "Loan ID is required." }, { status: 400 });
  }

  await callMutation(client, "loans:setStatus", { loanId: body.loanId, status: "approved" });

  return NextResponse.json({ ok: true, message: "Loan approved." });
}
