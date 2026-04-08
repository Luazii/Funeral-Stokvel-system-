"use client";

import Link from "next/link";
import Image from "next/image";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Bell, Bot, LayoutDashboard, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Member" },
  { href: "/admin", label: "Admin" },
  { href: "/terms", label: "Terms" },
  { href: "/guide", label: "Guide" },
];

export function SiteShell({
  children,
  currentPath,
  eyebrow,
}: {
  children: React.ReactNode;
  currentPath: string;
  eyebrow?: string;
}) {
  const { isSignedIn } = useUser();

  return (
    <div className="relative overflow-hidden pb-12">
      <div className="section-shell pt-6">
        <header className="glass-panel sticky top-4 z-30 rounded-[28px] px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-zinc-900 text-white">
                <Image src="/logo.png" alt="Thathumusa logo" width={40} height={40} />
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-zinc-500">
                  {eyebrow ?? "Community care operations"}
                </p>
                <h1 className="font-display text-xl text-zinc-950">
                  Thathumusa Funeral Stokvel
                </h1>
              </div>
            </div>

            <nav className="flex flex-wrap gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm transition",
                    currentPath === link.href
                      ? "bg-zinc-950 text-white"
                      : "bg-white/70 text-zinc-700 hover:bg-white",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 text-xs text-zinc-500">
              {isSignedIn ? (
                <UserButton />
              ) : (
                <SignInButton mode="modal">
                  <button className="rounded-full bg-zinc-950 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white">
                    Sign in
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        </header>
      </div>

      {children}

      <footer className="section-shell mt-16">
        <div className="glass-panel flex flex-col gap-6 rounded-[30px] px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="mt-2 font-display text-2xl text-zinc-950">
              Designed for trust, speed, and member dignity.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <FooterPill icon={ShieldCheck} label="Admin approvals" />
            <FooterPill icon={LayoutDashboard} label="Custom dashboards" />
            <FooterPill icon={Bell} label="SMS updates" />
            <FooterPill icon={Bot} label="AI guidance" />
            <FooterPill icon={Bell} label="Meeting reminders" />
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterPill({
  icon: Icon,
  label,
}: {
  icon: typeof Bell;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-3 text-sm text-zinc-700">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-zinc-500" />
        <span>{label}</span>
      </div>
    </div>
  );
}
