import { auth, clerkClient } from "@clerk/nextjs/server";

export async function getCurrentUserProfile() {
  const session = await auth();
  const userId = session.userId;
  if (!userId) {
    return null;
  }
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const name =
    user.fullName ??
    [user.firstName, user.lastName].filter(Boolean).join(" ") ??
    "Member";
  const email = user.emailAddresses[0]?.emailAddress;
  return { userId, name, email };
}
