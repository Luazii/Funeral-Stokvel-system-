import { NextResponse } from "next/server";
import { callMutation, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    amount?: number;
    reason?: string;
    repaymentPlan?: string;
  };

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json({ ok: false, message: "Convex is not configured." }, { status: 503 });
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    return NextResponse.json({ ok: false, message: "You must be signed in." }, { status: 401 });
  }

  if (!body.amount || !body.reason) {
    return NextResponse.json({ ok: false, message: "Amount and reason are required." }, { status: 400 });
  }

  if (body.amount < 500) {
    return NextResponse.json({ ok: false, message: "Minimum loan amount is R500." }, { status: 400 });
  }

  const memberId = await callMutation<unknown, string>(client, "users:ensure", {
    clerkId: profile.userId,
    name: profile.name,
    email: profile.email,
  });

  // Validate member has a membership card (memberNumber)
  const member = await callQuery<{ clerkId: string }, { memberNumber?: string; status: string } | null>(
    client,
    "users:getByClerkId",
    { clerkId: profile.userId },
  );

  if (!member?.memberNumber) {
    return NextResponse.json(
      { ok: false, message: "You do not have a membership card yet. Contact admin to complete registration." },
      { status: 422 },
    );
  }

  if (member.status === "pending") {
    return NextResponse.json(
      { ok: false, message: "Your membership is still pending approval. Loans are only available to approved members." },
      { status: 422 },
    );
  }

  // Validate contributions are up to date
  const contributions = await callQuery<
    { memberId: string },
    Array<{ status: string; date: string; month?: string }>
  >(client, "contributions:listByMember", { memberId });

  if (contributions.length > 0) {
    const paidMonths = contributions
      .filter((c) => c.status === "paid")
      .map((c) => (c.month ?? c.date).slice(0, 7));
    const now = new Date();
    const last2: string[] = [];
    for (let i = 1; i <= 2; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last2.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const missed = last2.filter((m) => !paidMonths.includes(m));
    if (missed.length >= 2) {
      return NextResponse.json(
        { ok: false, message: `Contribution not paid for ${missed.join(" and ")}. Bring contributions up to date before applying for a loan.` },
        { status: 422 },
      );
    }
  }

  await callMutation(client, "loans:create", {
    memberId,
    amount: body.amount,
    reason: body.reason,
    interestRate: 7,
  });

  return NextResponse.json({
    ok: true,
    message: `Loan request for R${body.amount} submitted. Admin will review with 7% interest applied.`,
  });
}
