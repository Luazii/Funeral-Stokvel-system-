"use client";

import { useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { Bot, BookOpenText, CalendarDays, CheckCircle2, Users } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { userGuideSteps } from "@/lib/mock-data";

export function GuidePage() {
  const { user } = useUser();
  const joinedDate = useMemo(() => {
    if (!user?.createdAt) {
      return "Not available";
    }
    return user.createdAt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [user?.createdAt]);

  return (
    <SiteShell currentPath="/guide" eyebrow="Interactive onboarding guide">
      <main className="section-shell mt-8 grid gap-6">
        <section className="grid gap-6 lg:grid-cols-12">
          <Card className="relative overflow-hidden rounded-[40px] px-7 py-8 lg:col-span-7 lg:px-10 lg:py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(120,120,120,0.16),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.95),rgba(228,228,224,0.88))]" />
            <div className="relative z-10 ornate-border memorial-shell p-6 sm:p-9 lg:p-10">
              <Pill>First-time orientation</Pill>
              <h2 className="mt-4 font-display text-4xl text-zinc-950 sm:text-5xl lg:text-6xl">
                Helping every member feel confident from day one.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-700 sm:text-lg">
                This guid is to help new users who are not familiar with the system yet to know how to get thing right. Everything you need to know in order to get started is here.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <GuideStat icon={Users} label="Admin approved" />
              <GuideStat icon={CalendarDays} label={`Joined ${joinedDate}`} />
              <GuideStat icon={Bot} label="AI-assisted" />
              </div>
            </div>
          </Card>

          <Card className="rounded-[38px] !border-zinc-800 !bg-zinc-950 !text-white lg:col-span-5">
            <div className="flex items-center gap-3">
              <BookOpenText className="h-7 w-7 text-zinc-100" />
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-200">Guide outcomes</p>
                <h3 className="mt-2 font-display text-3xl text-zinc-50">What members should know before they start</h3>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <GuideOutcome text="How to stay compliant with the monthly R380 contribution." />
              <GuideOutcome text="How beneficiary limits and funeral claim documents work." />
              <GuideOutcome text="Where to request support, loans, transport, and charity items." />
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {userGuideSteps.map((step) => (
            <Card key={step.title} className="rounded-[32px]">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Step {step.step}</p>
              <h3 className="mt-3 text-2xl font-semibold text-zinc-950">{step.title}</h3>
              <p className="mt-4 text-sm leading-8 text-zinc-600">{step.description}</p>
            </Card>
          ))}
        </section>
      </main>
    </SiteShell>
  );
}

function GuideStat({
  icon: Icon,
  label,
}: {
  icon: typeof Users;
  label: string;
}) {
  return (
    <div className="rounded-[24px] border border-zinc-200/80 bg-white/80 p-4">
      <Icon className="h-5 w-5 text-zinc-500" />
      <p className="mt-4 font-semibold text-zinc-950">{label}</p>
    </div>
  );
}

function GuideOutcome({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-zinc-700 bg-zinc-900 p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-1 h-4 w-4 text-zinc-100" />
        <p className="text-sm leading-7 text-zinc-100">{text}</p>
      </div>
    </div>
  );
}
