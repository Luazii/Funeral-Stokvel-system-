"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ConvexProvider } from "convex/react";
import { convex } from "@/lib/convex-client";
import { AuthBootstrap } from "@/components/auth/auth-bootstrap";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const content = convex ? (
    <ConvexProvider client={convex}>{children}</ConvexProvider>
  ) : (
    children
  );

  if (!publishableKey) {
    return <>{content}</>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <AuthBootstrap />
      {content}
    </ClerkProvider>
  );
}
