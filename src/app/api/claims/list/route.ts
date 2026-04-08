import { NextResponse } from "next/server";
import { callQuery, getConvexClient } from "@/lib/convex-server";

export async function GET() {
  const client = getConvexClient();
  if (!client) {
    return NextResponse.json({ ok: false, message: "Convex is not configured." }, { status: 503 });
  }

  const claims = await callQuery<
    Record<string, never>,
    Array<{
      _id: string;
      memberId: string;
      beneficiaryId: string;
      status: string;
      votesFor: number;
      votesAgainst: number;
      documents: { idCopyUrl?: string; deathCertificateUrl?: string };
    }>
  >(client, "claims:listAll", {});

  return NextResponse.json({ ok: true, items: claims ?? [] });
}
