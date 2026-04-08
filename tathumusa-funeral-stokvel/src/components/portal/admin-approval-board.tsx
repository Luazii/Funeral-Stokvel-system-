"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PendingMember = {
  _id: string;
  name: string;
  email?: string;
  joinDate: string;
};

export function AdminApprovalBoard() {
  const [members, setMembers] = useState<PendingMember[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const loadPending = async () => {
      try {
        const response = await fetch("/api/users/pending");
        const data = (await response.json()) as { items?: PendingMember[] };
        setMembers(data.items ?? []);
      } catch {
        setMembers([]);
      }
    };

    loadPending();
  }, []);

  const updateMember = (id: string) => {
    setMembers((prev) => prev.filter((member) => member._id !== id));
  };

  const handleApprove = async (id: string) => {
    setNotice(null);
    try {
      await fetch("/api/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      updateMember(id);
    } catch {
      setNotice("Approval could not be saved. Please try again.");
    }
  };

  const handleReject = async (id: string) => {
    setNotice(null);
    try {
      await fetch("/api/users/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      updateMember(id);
    } catch {
      setNotice("Rejection could not be saved. Please try again.");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card className="rounded-[32px]">
        <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Member applications</p>
        <div className="mt-5 space-y-4">
          {members.length ? (
            members.map((member) => (
              <div key={member._id} className="rounded-[24px] border border-zinc-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-950">{member.name}</p>
                    <p className="text-xs text-zinc-500">{member.email ?? "No email provided"}</p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-[0.65rem] uppercase tracking-[0.24em] text-zinc-500">
                    pending
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-600">
                  Joined {new Date(member.joinDate).toLocaleDateString()}
                </p>
                <div className="mt-4 flex gap-3">
                  <Button onClick={() => handleApprove(member._id)} className="flex-1">
                    Approve
                  </Button>
                  <Button variant="secondary" onClick={() => handleReject(member._id)} className="flex-1">
                    Reject
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-zinc-200 bg-white p-4">
              <p className="font-semibold text-zinc-950">No applications yet</p>
              <p className="mt-2 text-sm leading-7 text-zinc-600">
                New member applications will show here once they sign up.
              </p>
            </div>
          )}
          {notice ? <p className="text-sm text-zinc-600">{notice}</p> : null}
        </div>
      </Card>

      <Card className="rounded-[32px]">
        <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Loan requests</p>
        <div className="mt-5 rounded-[24px] border border-zinc-200 bg-white p-4">
          <p className="font-semibold text-zinc-950">No requests yet</p>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            Loan requests will appear here once members begin submitting them.
          </p>
        </div>
      </Card>

      <Card className="rounded-[32px]">
        <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Funeral claims</p>
        <div className="mt-5 rounded-[24px] border border-zinc-200 bg-white p-4">
          <p className="font-semibold text-zinc-950">No claims yet</p>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            Funeral claims will appear here once documentation is submitted.
          </p>
        </div>
      </Card>
    </div>
  );
}
