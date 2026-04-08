"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  CreditCard,
  FileCheck2,
  Truck,
} from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { keyMetrics, termsSummary } from "@/lib/mock-data";

const featureCards = [
  {
    icon: CreditCard,
    title: "Monthly contributions",
    description:
      "You are required to make a payment of R380 every month without fail. If you miss a payment, you will be alerted to make your payment. Should you miss your payments for three consecutive days, a fine will be applied to your next payment.",
  },
  {
    icon: FileCheck2,
    title: "Funeral claims",
    description:
      "Should you lose your loved ones, voting from the admin and other members will decide whether you receive your claim or not.",
  },
  {
    icon: CalendarDays,
    title: "Meeting management",
    description:
      "You will receive meeting invites from the admin. Should you not accept an invite, you will need to provide a reason. Remember, there are benefits to attending all meetings.",
  },
  {
    icon: Truck,
    title: "Funeral support services",
    description:
      "In this club, we are more than association members, but a big united family. We will support you during the hard times.",
  },
  {
    icon: Banknote,
    title: "Loans and fines",
    description:
      "Review loan applications, apply the 7% interest rule, and monitor fines for repeated missed contributions.",
  },
];

export function HomePage() {
  const { user } = useUser();
  const userName = user?.firstName ?? user?.username ?? "Member";

  return (
    <SiteShell currentPath="/" eyebrow="Funeral stokvel digital home">
      <main className="section-shell mt-8 space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="grid gap-6"
        >
          <Card className="relative overflow-hidden rounded-[40px] px-7 py-8 lg:px-10 lg:py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(120,120,120,0.16),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.95),rgba(228,228,224,0.88))]" />
            <div className="relative z-10 ornate-border memorial-shell p-6 sm:p-9 lg:p-10">
              <Pill>Preparing for the future</Pill>
              <p className="mt-6 text-xs uppercase tracking-[0.35em] text-zinc-700">
                Welcome, {userName}
              </p>
              <h2 className="mt-4 max-w-4xl font-display text-5xl leading-[1.03] text-balance text-zinc-950 sm:text-6xl lg:text-7xl">
                Thathumusa Funeral Stokvel
              </h2>
              <p className="mt-6 max-w-4xl text-base leading-8 text-zinc-800 sm:text-lg lg:text-[1.12rem] lg:leading-9">
                Thathumusa is more than a stokvel - it is a circle of strength, built by women who carry the weight of their families with dignity and love. Here, every contribution is an act of care, every meeting is a promise of solidarity, and every payout is a safeguard for the future. Thathumusa honors the resilience of women who prepare for life's hardest moments, ensuring that no family stands alone when facing loss. This is a platform of empowerment, compassion, and legacy - where women lead with courage and prepare with wisdom.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/dashboard">
                  <Button>
                    Open member dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button variant="secondary">View admin workspace</Button>
                </Link>
              </div>
              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                {keyMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-[26px] border border-white/80 bg-white/75 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.28em] text-zinc-600">
                      {metric.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-zinc-950">
                      {metric.value}
                    </p>
                    <p className="mt-2 text-sm text-zinc-700">{metric.caption}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-[36px]">
            <Pill>Please carefully read Thathumusa's terms and conditions, then accept them.</Pill>
            <h3 className="mt-4 font-display text-4xl text-zinc-950">
              Core workflows from member join to claim resolution.
            </h3>
            <p className="mt-4 text-base leading-8 text-zinc-800">
              This starter implementation is structured around your rules: admin
              approval before joining, a maximum of 15 beneficiaries, contribution
              enforcement, fraud removal, and staged claim handling.
            </p>
            <div className="mt-8 space-y-4">
              {termsSummary.map((term) => (
                <div
                  key={term}
                  className="rounded-[24px] border border-zinc-200/90 bg-white/75 px-4 py-4 text-sm leading-7 text-zinc-800"
                >
                  {term}
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            {featureCards.map((feature) => (
              <Card key={feature.title} className="rounded-[32px] p-5">
                <feature.icon className="h-9 w-9 text-zinc-500" />
                <h3 className="mt-5 text-xl font-semibold text-zinc-950">
                  {feature.title}
                </h3>
                {feature.description ? (
                  <p className="mt-3 text-sm leading-7 text-zinc-800">
                    {feature.description}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6">
          <Card className="rounded-[36px]">
            <Pill>Get started</Pill>
            <h3 className="mt-4 font-display text-4xl text-zinc-950">
              Invite members and start onboarding.
            </h3>
            <p className="mt-4 text-base leading-8 text-zinc-800">
              New members register first, then wait for admin approval before gaining full access.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/terms">
                <Button variant="secondary">Review terms flow</Button>
              </Link>
              <Link href="/guide">
                <Button>Open user guide</Button>
              </Link>
            </div>
          </Card>
        </section>
      </main>
    </SiteShell>
  );
}
