import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <AuthShell
        title="Sign up setup pending"
        description="Add the Clerk publishable key to enable the live sign-up experience."
      />
    );
  }

  return (
    <AuthShell
      title="Join Thathumusa"
      description="New members still require admin approval before full access is granted."
    >
      <SignUp afterSignUpUrl="/onboarding" />
    </AuthShell>
  );
}
