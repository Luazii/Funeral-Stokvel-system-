import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="section-shell flex min-h-screen items-center py-12">
      <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[40px] bg-zinc-950 p-8 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
              <Image src="/logo.png" alt="Thathumusa logo" width={36} height={36} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
                Community care
              </p>
              <h1 className="mt-2 font-display text-4xl">{title}</h1>
            </div>
          </div>
          <p className="mt-6 max-w-xl text-sm leading-8 text-zinc-300">
            {description}
          </p>
          <div className="mt-8 space-y-3 text-sm text-zinc-300">
            <p>Members log R380 monthly contributions and track arrears.</p>
            <p>Claims are supported by beneficiary documents and member voting.</p>
            <p>Admin approval stays in place before any new member is activated.</p>
          </div>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-full bg-white/10 px-4 py-3 text-sm hover:bg-white/15"
          >
            Back to home
          </Link>
        </Card>

        <Card className="flex min-h-[540px] items-center justify-center rounded-[40px] p-6">
          {children ?? (
            <div className="max-w-md text-center text-sm leading-7 text-zinc-600">
              The authentication view will appear here once Clerk is fully connected.
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
