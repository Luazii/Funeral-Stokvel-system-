import { AdminDashboard } from "@/components/portal/admin-dashboard";
import { AdminAccessDenied } from "@/components/portal/access-states";
import { callMutation, callQuery, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export default async function AdminPage() {
  const profile = await getCurrentUserProfile();
  const client = getConvexClient();

  if (!profile || !client) {
    return <AdminDashboard />;
  }

  let user = await callQuery<unknown, { role: string } | null>(
    client,
    "users:getByClerkId",
    { clerkId: profile.userId },
  );

  if (!user) {
    await callMutation(client, "users:ensure", {
      clerkId: profile.userId,
      name: profile.name,
      email: profile.email,
    });
    user = await callQuery<unknown, { role: string } | null>(
      client,
      "users:getByClerkId",
      { clerkId: profile.userId },
    );
  }

  if (!user || user.role !== "admin") {
    return <AdminAccessDenied />;
  }

  return <AdminDashboard />;
}
