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

  const contributions = await callQuery<
    unknown,
    Array<{ amount: number; date: string; month?: string; status: string }>
  >(
    client,
    "contributions:listAll",
    {},
  );

  const paidContributions = contributions.filter((entry) => entry.status === "paid");
  const totalContributions = paidContributions.reduce((sum, entry) => sum + entry.amount, 0);
  const monthlyTotalsMap = paidContributions.reduce<Record<string, number>>((acc, entry) => {
    const key =
      typeof entry.month === "string" && entry.month.length >= 7
        ? entry.month.slice(0, 7)
        : entry.date.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(key)) {
      return acc;
    }
    acc[key] = (acc[key] ?? 0) + entry.amount;
    return acc;
  }, {});

  const monthlyTotals = Object.entries(monthlyTotalsMap)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const averageMonthly = monthlyTotals.length
    ? Math.round(totalContributions / monthlyTotals.length)
    : 0;

  return NextResponse.json({
    ok: true,
    totalContributions,
    totalMoneyInClub: totalContributions,
    monthlyTotals,
    averageMonthly,
  });
}
