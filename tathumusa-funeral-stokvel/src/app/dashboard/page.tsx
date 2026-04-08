import { MemberDashboard } from "@/components/portal/member-dashboard";
import { PendingApprovalState } from "@/components/portal/access-states";
import { TermsAcceptanceGate } from "@/components/portal/terms-acceptance";
import { callMutation, callQuery, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export default async function DashboardPage() {
  const profile = await getCurrentUserProfile();
  const client = getConvexClient();

  if (!profile || !client) {
    return <MemberDashboard />;
  }

  let user = await callQuery<
    unknown,
    { status: string; termsAcceptedAt?: string | null } | null
  >(client, "users:getByClerkId", { clerkId: profile.userId });

  if (!user) {
    await callMutation(client, "users:ensure", {
      clerkId: profile.userId,
      name: profile.name,
      email: profile.email,
    });
    user = await callQuery<
      unknown,
      { status: string; termsAcceptedAt?: string | null } | null
    >(client, "users:getByClerkId", { clerkId: profile.userId });
  }

  if (!user || user.status === "pending") {
    return <PendingApprovalState />;
  }

  if (!user.termsAcceptedAt) {
    return <TermsAcceptanceGate />;
  }

  return <MemberDashboard />;
}
