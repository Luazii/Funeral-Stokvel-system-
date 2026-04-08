"use client";

import { useEffect, useState } from "react";
import { PendingApprovalState } from "@/components/portal/access-states";
import { Card } from "@/components/ui/card";

export default function OnboardingPage() {
  const [message, setMessage] = useState("Registering your membership...");

  useEffect(() => {
    const register = async () => {
      try {
        const response = await fetch("/api/users/register", { method: "POST" });
        const data = (await response.json()) as {
          user?: { status?: string; role?: string; termsAcceptedAt?: string | null };
        };
        if (data.user?.role === "admin") {
          setMessage("Admin profile ready. Redirecting to admin dashboard...");
          setTimeout(() => {
            window.location.href = "/admin";
          }, 900);
          return;
        }
        if (data.user?.status === "approved" && data.user?.termsAcceptedAt) {
          setMessage("Membership approved. Redirecting to dashboard...");
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 900);
          return;
        }
        setMessage("Your membership is pending admin approval.");
      } catch {
        setMessage("Unable to complete onboarding. Please try again.");
      }
    };

    register();
  }, []);

  if (message.includes("pending")) {
    return <PendingApprovalState />;
  }

  return (
    <main className="section-shell mt-10 grid place-items-center">
      <Card className="max-w-xl rounded-[36px] p-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Onboarding</p>
        <h2 className="mt-3 font-display text-4xl text-zinc-950">{message}</h2>
      </Card>
    </main>
  );
}
