"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function PendingApprovalState() {
  return (
    <main className="section-shell mt-10 grid place-items-center">
      <Card className="max-w-xl rounded-[36px] p-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Awaiting approval
        </p>
        <h2 className="mt-3 font-display text-4xl text-zinc-950">
          Your membership is pending admin approval.
        </h2>
        <p className="mt-4 text-sm leading-7 text-zinc-600">
          You&apos;ll receive access as soon as the admin reviews your request.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/">
            <Button variant="secondary">Return home</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}

export function TermsRequiredState({
  onAccept,
  onMakeAdmin,
}: {
  onAccept: () => void;
  onMakeAdmin?: () => void;
}) {
  return (
    <main className="section-shell mt-10 grid place-items-center">
      <Card className="max-w-xl rounded-[36px] p-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Terms acceptance
        </p>
        <h2 className="mt-3 font-display text-4xl text-zinc-950">
          Please accept the membership terms to continue.
        </h2>
        <p className="mt-4 text-sm leading-7 text-zinc-600">
          Once accepted, you&apos;ll have full access to the member dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={onAccept}>Accept terms</Button>
          <Link href="/terms">
            <Button variant="secondary">Review terms</Button>
          </Link>
          {onMakeAdmin ? (
            <Button variant="secondary" onClick={onMakeAdmin}>
              Make me admin
            </Button>
          ) : null}
        </div>
      </Card>
    </main>
  );
}

export function AdminAccessDenied() {
  return (
    <main className="section-shell mt-10 grid place-items-center">
      <Card className="max-w-xl rounded-[36px] p-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Admin only
        </p>
        <h2 className="mt-3 font-display text-4xl text-zinc-950">
          You need admin access to view this page.
        </h2>
        <p className="mt-4 text-sm leading-7 text-zinc-600">
          If you believe this is an error, please contact the stokvel admin.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard">
            <Button variant="secondary">Go to member dashboard</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
