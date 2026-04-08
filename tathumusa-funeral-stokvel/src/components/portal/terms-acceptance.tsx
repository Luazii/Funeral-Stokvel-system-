"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TermsRequiredState } from "@/components/portal/access-states";

export function TermsAcceptanceGate() {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);

  const handleAccept = async () => {
    setNotice(null);
    try {
      const response = await fetch("/api/users/accept-terms", { method: "POST" });
      const data = (await response.json()) as { message?: string };
      if (response.ok) {
        router.refresh();
      } else {
        setNotice(data.message ?? "Unable to accept terms yet.");
      }
    } catch {
      setNotice("Unable to accept terms yet.");
    }
  };

  const handleMakeAdmin = async () => {
    setNotice(null);
    try {
      const response = await fetch("/api/users/make-admin", { method: "POST" });
      let data: { message?: string } | null = null;
      try {
        data = (await response.json()) as { message?: string };
      } catch {
        data = null;
      }
      if (response.ok) {
        setNotice("Admin access granted. Redirecting...");
        setTimeout(() => {
          window.location.href = "/admin";
        }, 800);
      } else {
        setNotice(data?.message ?? `Unable to promote account (status ${response.status}).`);
      }
    } catch {
      setNotice("Unable to promote account.");
    }
  };

  return (
    <>
      <TermsRequiredState onAccept={handleAccept} onMakeAdmin={handleMakeAdmin} />
      {notice ? (
        <p className="section-shell mt-4 text-center text-sm text-zinc-600">{notice}</p>
      ) : null}
    </>
  );
}
