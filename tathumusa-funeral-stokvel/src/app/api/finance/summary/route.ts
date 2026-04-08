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

  const contributions = await callQuery<unknown, Array<{ amount: number }>>(
    client,
    "contributions:listAll",
    {},
  );

  const totalContributions = contributions.reduce((sum, entry) => sum + entry.amount, 0);
  const monthlyTotalsMap = contributions.reduce<Record<string, number>>((acc, entry) => {
    const date = new Date(entry.date);
    if (Number.isNaN(date.getTime())) {
      return acc;
    }
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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
