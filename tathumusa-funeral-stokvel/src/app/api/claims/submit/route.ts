import { NextResponse } from "next/server";
import { callMutation, callQuery, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    beneficiaryIdNumber?: string;
    idCopyUrl?: string;
    deathCertificateUrl?: string;
    notes?: string;
  };

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json({ ok: false, message: "Convex is not configured." }, { status: 503 });
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    return NextResponse.json({ ok: false, message: "You must be signed in." }, { status: 401 });
  }

  if (!body.beneficiaryIdNumber) {
    return NextResponse.json({ ok: false, message: "Beneficiary ID number is required." }, { status: 400 });
  }

  const memberId = await callMutation<unknown, string>(client, "users:ensure", {
    clerkId: profile.userId,
    name: profile.name,
    email: profile.email,
  });

  // Validate contributions are up to date
  const contributions = await callQuery<
    { memberId: string },
    Array<{ amount: number; date: string; month?: string; status: string }>
  >(client, "contributions:listByMember", { memberId });

  if (contributions.length > 0) {
    const paidMonths = contributions
      .filter((c) => c.status === "paid")
      .map((c) => (c.month ?? c.date).slice(0, 7));
    const now = new Date();
    const prevMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0") || "12"}`;
    const twoMonthsAgo = (() => { const d = new Date(now.getFullYear(), now.getMonth() - 2, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; })();
    const missedRecent = [prevMonth, twoMonthsAgo].filter((m) => !paidMonths.includes(m));
    if (missedRecent.length >= 2) {
      return NextResponse.json(
        { ok: false, message: `Contributions not up to date for: ${missedRecent.join(", ")}. Pay your contributions before submitting a claim.` },
        { status: 422 },
      );
    }
  }

  const beneficiary = await callQuery<
    { idNumber: string },
    { _id: string; name: string } | null
  >(client, "beneficiaries:getByIdNumber", { idNumber: body.beneficiaryIdNumber });

  if (!beneficiary) {
    return NextResponse.json(
      { ok: false, message: "Beneficiary not found. Please check the ID number." },
      { status: 404 },
    );
  }

  await callMutation(client, "claims:create", {
    memberId,
    beneficiaryId: beneficiary._id,
    idCopyUrl: body.idCopyUrl,
    deathCertificateUrl: body.deathCertificateUrl,
  });

  await callMutation(client, "beneficiaries:markDeceased", { idNumber: body.beneficiaryIdNumber });

  return NextResponse.json({
    ok: true,
    message: `Claim submitted for ${beneficiary.name}. Committee will now vote before payment is authorised.`,
  });
}
