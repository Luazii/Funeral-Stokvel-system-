"use client";

import { Gift } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

export function CharityPage() {
  return (
    <SiteShell currentPath="/charity" eyebrow="Community giving platform">
      <main className="section-shell mt-8 grid gap-6">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="rounded-[38px]">
            <Pill>Coming later</Pill>
            <h2 className="mt-4 font-display text-5xl text-zinc-950">
              The charity platform will return in a later phase.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-600">
              We will reconnect the donor and recipient experience once the core
              contribution, claims, and admin workflows are fully live.
            </p>
          </Card>

          <Card className="rounded-[38px] bg-zinc-950 text-white">
            <div className="flex items-center gap-3">
              <Gift className="h-7 w-7 text-zinc-300" />
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-400">Paused for now</p>
                <h3 className="mt-2 font-display text-3xl">Charity workflows pending</h3>
              </div>
            </div>
            <p className="mt-6 text-sm leading-7 text-zinc-300">
              When we return to this module, we will restore the inventory,
              free checkout, and SMS confirmations.
            </p>
          </Card>
        </section>
      </main>
    </SiteShell>
  );
}
