"use client";

import { useState } from "react";
import { SiteShell } from "@/components/layout/site-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { terms } from "@/lib/mock-data";

export function TermsPage() {
  const [notice, setNotice] = useState<string | null>(null);

  const handleAccept = async () => {
    setNotice(null);
    try {
      const response = await fetch("/api/users/accept-terms", { method: "POST" });
      const data = (await response.json()) as { message?: string };
      setNotice(data.message ?? "Terms accepted.");
    } catch {
      setNotice("Unable to accept terms yet.");
    }
  };

  return (
    <SiteShell currentPath="/terms" eyebrow="Member agreement flow">
      <main className="section-shell mt-8 grid gap-6">
        <div className="mx-auto w-full max-w-5xl">
          <Card className="relative overflow-hidden rounded-[40px] px-7 py-8 lg:px-10 lg:py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(120,120,120,0.16),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.95),rgba(228,228,224,0.88))]" />
            <div className="relative z-10 ornate-border memorial-shell p-6 sm:p-9 lg:p-10">
              <h3 className="font-display text-3xl text-zinc-950 sm:text-4xl">Thathumusa terms and conditions</h3>
              <div className="mt-6 space-y-4">
                {terms.map((term, index) => (
                  <div key={term} className="rounded-[24px] border border-zinc-200/80 bg-white/80 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Rule {index + 1}</p>
                    <p className="mt-3 text-sm leading-8 text-zinc-600">{term}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 border-t border-zinc-200 pt-6 sm:pt-7">
                <Button onClick={handleAccept}>Accept terms</Button>
                {notice ? <p className="mt-4 text-sm text-zinc-600">{notice}</p> : null}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </SiteShell>
  );
}
