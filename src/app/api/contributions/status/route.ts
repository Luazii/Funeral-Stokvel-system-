import { NextResponse } from "next/server";
import { callMutation, callQuery, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

/**
 * Returns whether the signed-in member's contributions are up to date.
 * "Up to date" = has at least one paid contribution in the last 60 days
 * AND has not missed contributions for 2+ consecutive months.
 */
export async function GET() {
  const client = getConvexClient();
  if (!client) {
    // If Convex not configured, assume up to date (graceful degradation)
    return NextResponse.json({ ok: true, upToDate: true, reason: null, paidMonths: [] });
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    return NextResponse.json({ ok: false, message: "You must be signed in." }, { status: 401 });
  }

  const memberId = await callMutation<unknown, string>(client, "users:ensure", {
    clerkId: profile.userId,
    name: profile.name,
    email: profile.email,
  });

  const contributions = await callQuery<
    { memberId: string },
    Array<{ amount: number; date: string; month?: string; status: string }>
  >(client, "contributions:listByMember", { memberId });

  const paidContributions = contributions.filter((c) => c.status === "paid");

  // Build list of months paid (YYYY-MM format)
  const paidMonths = paidContributions.map((c) => {
    if (c.month) return c.month.slice(0, 7);
    return c.date.slice(0, 7);
  });

  const uniquePaidMonths = [...new Set(paidMonths)];

  // Check last 2 months
  const now = new Date();
  const lastMonths: string[] = [];
  for (let i = 1; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    lastMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const missedRecent = lastMonths.filter((m) => !uniquePaidMonths.includes(m));
  const upToDate = missedRecent.length === 0 || paidContributions.length === 0;
  // Allow if no contributions yet (new member) — admin handles that

  const reason =
    missedRecent.length > 0 && paidContributions.length > 0
      ? `Contribution not paid for: ${missedRecent.join(", ")}. Please pay your monthly contribution before applying.`
      : null;

  return NextResponse.json({
    ok: true,
    upToDate: upToDate || paidContributions.length === 0,
    reason,
    paidMonths: uniquePaidMonths,
    missedMonths: missedRecent,
  });
}
