import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <AuthShell
        title="Sign in setup pending"
        description="Add the Clerk publishable key to enable the live sign-in experience."
      />
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to manage contributions, meetings, claims, and charity support."
    >
      <SignIn afterSignInUrl="/dashboard" />
    </AuthShell>
  );
}
