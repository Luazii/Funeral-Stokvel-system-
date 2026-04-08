import { NextResponse } from "next/server";
import { callMutation, callQuery, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function POST() {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    return NextResponse.json(
      { ok: false, message: "You must be signed in." },
      { status: 401 },
    );
  }

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json(
      { ok: false, message: "Convex is not configured yet." },
      { status: 503 },
    );
  }

  const userId = await callMutation<unknown, string>(client, "users:ensure", {
    clerkId: profile.userId,
    name: profile.name,
    email: profile.email,
  });

  const allUsers = await callQuery<
    unknown,
    Array<{ role: string }>
  >(client, "users:list", {});
  const hasAdmin = allUsers.some((user) => user.role === "admin");

  const shouldBeAdmin =
    (!hasAdmin || (profile.email && ADMIN_EMAILS.includes(profile.email.toLowerCase())));

  if (shouldBeAdmin) {
    await callMutation(client, "users:setRole", { userId, role: "admin" });
    await callMutation(client, "users:approve", { userId });
  }

  const user = await callQuery<
    unknown,
    { status: string; role: string; termsAcceptedAt?: string | null } | null
  >(client, "users:getByClerkId", { clerkId: profile.userId });

  return NextResponse.json({ ok: true, user });
}

export const config = {
  runtime: 'edge',
};
