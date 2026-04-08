"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  BarChart3,
  CalendarPlus2,
  ClipboardCheck,
  HandCoins,
  Trash2,
  Users,
} from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { AdminApprovalBoard } from "@/components/portal/admin-approval-board";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
const initialMeetings: Array<{
  _id: string;
  title: string;
  date: string;
  time: string;
  message: string;
  acceptedCount: number;
  declinedCount: number;
}> = [];

export function AdminDashboard() {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [isScheduling, setIsScheduling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", date: "", time: "", message: "" });
  const [financeSummary, setFinanceSummary] = useState({
    totalMoneyInClub: 0,
    totalContributions: 0,
    averageMonthly: 0,
    monthlyTotals: [] as Array<{ month: string; total: number }>,
  });
  const [attendanceOverview, setAttendanceOverview] = useState({ attended: 0, total: 0 });
  const [decisionList, setDecisionList] = useState<
    Array<{ externalId: string; title: string; description: string; yesVotes: number; noVotes: number }>
  >([]);
  const [rentalRequests, setRentalRequests] = useState<
    Array<{ _id: string; memberName: string; type: string; item: string; date: string; status: string }>
  >([]);
  const [supportRequests, setSupportRequests] = useState<
    Array<{ _id: string; memberName: string; funeralOf: string; supportType: string; status: string }>
  >([]);
  const [contributionList, setContributionList] = useState<
    Array<{ _id: string; memberName: string; amount: number; date: string; status: string }>
  >([]);
  const [deceasedBeneficiaries, setDeceasedBeneficiaries] = useState<
    Array<{ _id: string; name: string; surname?: string; idNumber: string; relationship: string }>
  >([]);
  const [memberSummary, setMemberSummary] = useState({
    name: "Admin",
    memberNumber: "ADM-0001",
    points: 0,
  });
  const [pointsForm, setPointsForm] = useState({ memberNumber: "", points: "" });
  const [pointsNotice, setPointsNotice] = useState<string | null>(null);

  const [loanList, setLoanList] = useState<
    Array<{ _id: string; memberId: string; amount: number; reason: string; status: string; interestRate: number }>
  >([]);
  const [loanNotice, setLoanNotice] = useState<string | null>(null);

  const [claimList, setClaimList] = useState<
    Array<{ _id: string; memberId: string; beneficiaryId: string; status: string; votesFor: number; votesAgainst: number }>
  >([]);
  const [claimNotice, setClaimNotice] = useState<string | null>(null);

  const [finesList, setFinesList] = useState<
    Array<{ _id: string; memberName: string; amount: number; reason: string; date: string; status: string }>
  >([]);
  const [finesForm, setFinesForm] = useState({ memberNumber: "", amount: "", reason: "" });
  const [finesNotice, setFinesNotice] = useState<string | null>(null);

  const [decisionForm, setDecisionForm] = useState({ title: "", description: "" });
  const [decisionNotice, setDecisionNotice] = useState<string | null>(null);

  const [minutesForm, setMinutesForm] = useState({ meetingId: "", minutesUrl: "" });
  const [minutesNotice, setMinutesNotice] = useState<string | null>(null);

  const maxMonthlyTotal = useMemo(() => {
    return Math.max(1, ...financeSummary.monthlyTotals.map((item) => item.total));
  }, [financeSummary.monthlyTotals]);

  useEffect(() => {
    const loadMeetings = async () => {
      try {
        const response = await fetch("/api/meetings/list");
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as {
          items?: Array<{
            _id: string;
            title: string;
            date: string;
            acceptedCount?: number;
            declinedCount?: number;
          }>;
        };
        setMeetings(
          (data.items ?? []).map((meeting) => {
            const [datePart, timePart] = meeting.date.split(" - ");
            return {
              _id: meeting._id,
              title: meeting.title,
              date: datePart ?? meeting.date,
              time: timePart ?? "TBD",
              message: "Meeting invitation sent.",
              acceptedCount: meeting.acceptedCount ?? 0,
              declinedCount: meeting.declinedCount ?? 0,
            };
          }),
        );
      } catch {
        // no-op
      }
    };

    const loadData = async () => {
      try {
        const [
          financeRes,
          attendanceRes,
          decisionsRes,
          rentalsRes,
          supportsRes,
          summaryRes,
          deceasedRes,
          contributionsRes,
          loansRes,
          claimsRes,
          finesRes,
        ] = await Promise.all([
          fetch("/api/finance/summary"),
          fetch("/api/attendance/overview"),
          fetch("/api/decisions/list"),
          fetch("/api/rentals/list"),
          fetch("/api/supports/list"),
          fetch("/api/users/summary"),
          fetch("/api/beneficiaries/deceased"),
          fetch("/api/contributions/list"),
          fetch("/api/loans/list"),
          fetch("/api/claims/list"),
          fetch("/api/fines/list"),
        ]);

        if (financeRes.ok) {
          const data = (await financeRes.json()) as {
            totalMoneyInClub?: number;
            totalContributions?: number;
            averageMonthly?: number;
            monthlyTotals?: Array<{ month: string; total: number }>;
          };
          setFinanceSummary({
            totalMoneyInClub: data.totalMoneyInClub ?? 0,
            totalContributions: data.totalContributions ?? 0,
            averageMonthly: data.averageMonthly ?? 0,
            monthlyTotals: data.monthlyTotals ?? [],
          });
        }

        if (attendanceRes.ok) {
          const data = (await attendanceRes.json()) as { attended?: number; total?: number };
          setAttendanceOverview({
            attended: data.attended ?? 0,
            total: data.total ?? 0,
          });
        }

        if (decisionsRes.ok) {
          const data = (await decisionsRes.json()) as {
            items?: Array<{ externalId: string; title: string; description: string; yesVotes: number; noVotes: number }>;
          };
          setDecisionList(data.items ?? []);
        }

        if (rentalsRes.ok) {
          const data = (await rentalsRes.json()) as {
            items?: Array<{ _id: string; memberName: string; type: string; item: string; date: string; status: string }>;
          };
          setRentalRequests(data.items ?? []);
        }

        if (supportsRes.ok) {
          const data = (await supportsRes.json()) as {
            items?: Array<{ _id: string; memberName: string; funeralOf: string; supportType: string; status: string }>;
          };
          setSupportRequests(data.items ?? []);
        }

        if (contributionsRes.ok) {
          const data = (await contributionsRes.json()) as {
            items?: Array<{ _id: string; memberName: string; amount: number; date: string; status: string }>;
          };
          setContributionList(data.items ?? []);
        }

        if (deceasedRes.ok) {
          const data = (await deceasedRes.json()) as {
            items?: Array<{ _id: string; name: string; surname?: string; idNumber: string; relationship: string }>;
          };
          setDeceasedBeneficiaries(data.items ?? []);
        }

        if (loansRes.ok) {
          const data = (await loansRes.json()) as {
            items?: Array<{ _id: string; memberId: string; amount: number; reason: string; status: string; interestRate: number }>;
          };
          setLoanList(data.items ?? []);
        }

        if (claimsRes.ok) {
          const data = (await claimsRes.json()) as {
            items?: Array<{ _id: string; memberId: string; beneficiaryId: string; status: string; votesFor: number; votesAgainst: number }>;
          };
          setClaimList(data.items ?? []);
        }

        if (finesRes.ok) {
          const data = (await finesRes.json()) as {
            items?: Array<{ _id: string; memberName: string; amount: number; reason: string; date: string; status: string }>;
          };
          setFinesList(data.items ?? []);
        }

        if (summaryRes.ok) {
          const data = (await summaryRes.json()) as {
            user?: { name?: string; memberNumber?: string; points?: number };
          };
          if (data.user) {
            setMemberSummary({
              name: data.user.name ?? "Admin",
              memberNumber: data.user.memberNumber ?? "ADM-0001",
              points: data.user.points ?? 0,
            });
          }
        }
      } catch {
        // keep empty state until Convex responds
      }
    };

    loadMeetings();
    loadData();
  }, []);

  const handleSchedule = async () => {
    if (isScheduling) {
      return;
    }
    setIsScheduling(true);
    if (!form.title || !form.date || !form.time) {
      setNotice("Please provide a meeting title, date, and time.");
      setIsScheduling(false);
      return;
    }

    try {
      const response = await fetch("/api/meetings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          date: form.date,
          time: form.time,
          message: form.message,
        }),
      });
      const data = (await response.json()) as { message?: string };
      setNotice(data.message ?? "Meeting scheduled and notifications sent to all members.");
      const meetingsRes = await fetch("/api/meetings/list");
      if (meetingsRes.ok) {
        const meetingsData = (await meetingsRes.json()) as {
          items?: Array<{ _id: string; title: string; date: string; acceptedCount?: number; declinedCount?: number }>;
        };
        setMeetings(
          (meetingsData.items ?? []).map((meeting) => {
            const [datePart, timePart] = meeting.date.split(" - ");
            return {
              _id: meeting._id,
              title: meeting.title,
              date: datePart ?? meeting.date,
              time: timePart ?? "TBD",
              message: "Meeting invitation sent.",
              acceptedCount: meeting.acceptedCount ?? 0,
              declinedCount: meeting.declinedCount ?? 0,
            };
          }),
        );
      }
    } catch {
      setNotice("Meeting scheduled locally. Connect Convex to notify members.");
    } finally {
      setIsScheduling(false);
    }
    setForm({ title: "", date: "", time: "", message: "" });
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    setMeetings((prev) => prev.filter((meeting) => meeting._id !== meetingId));
    try {
      await fetch("/api/meetings/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      });
      setNotice("Meeting removed.");
    } catch {
      setNotice("Meeting removed locally. Connect Convex to persist.");
    }
  };

  const handleDeleteRental = async (rentalId: string) => {
    setRentalRequests((prev) => prev.filter((item) => item._id !== rentalId));
    try {
      await fetch("/api/rentals/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentalId }),
      });
      setNotice("Rental request removed.");
    } catch {
      setNotice("Rental request removed locally. Connect Convex to persist.");
    }
  };

  const handleDeleteSupport = async (supportRequestId: string) => {
    setSupportRequests((prev) => prev.filter((item) => item._id !== supportRequestId));
    try {
      await fetch("/api/supports/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supportRequestId }),
      });
      setNotice("Support request removed.");
    } catch {
      setNotice("Support request removed locally. Connect Convex to persist.");
    }
  };

  const handleLoanAction = async (loanId: string, action: "approve" | "reject") => {
    setLoanNotice(null);
    try {
      const response = await fetch(`/api/loans/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId }),
      });
      const data = (await response.json()) as { message?: string };
      setLoanNotice(data.message ?? `Loan ${action}d.`);
      setLoanList((prev) => prev.map((loan) => loan._id === loanId ? { ...loan, status: action === "approve" ? "approved" : "rejected" } : loan));
    } catch {
      setLoanNotice("Action failed. Please try again.");
    }
  };

  const handleClaimAction = async (claimId: string, action: "approve" | "reject") => {
    setClaimNotice(null);
    try {
      const response = await fetch(`/api/claims/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId }),
      });
      const data = (await response.json()) as { message?: string };
      setClaimNotice(data.message ?? `Claim ${action}d.`);
      setClaimList((prev) => prev.map((claim) => claim._id === claimId ? { ...claim, status: action === "approve" ? "approved" : "rejected" } : claim));
    } catch {
      setClaimNotice("Action failed. Please try again.");
    }
  };

  const handleAddFine = async () => {
    setFinesNotice(null);
    const amount = Number(finesForm.amount);
    if (!finesForm.memberNumber || !amount || !finesForm.reason) {
      setFinesNotice("Please enter member number, amount, and reason.");
      return;
    }
    try {
      const response = await fetch("/api/fines/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberNumber: finesForm.memberNumber, amount, reason: finesForm.reason }),
      });
      const data = (await response.json()) as { ok: boolean; message?: string };
      setFinesNotice(data.message ?? "Fine added.");
      if (data.ok) {
        setFinesForm({ memberNumber: "", amount: "", reason: "" });
        const finesRes = await fetch("/api/fines/list");
        if (finesRes.ok) {
          const finesData = (await finesRes.json()) as { items?: Array<{ _id: string; memberName: string; amount: number; reason: string; date: string; status: string }> };
          setFinesList(finesData.items ?? []);
        }
      }
    } catch {
      setFinesNotice("Network error. Please try again.");
    }
  };

  const handleCreateDecision = async () => {
    setDecisionNotice(null);
    if (!decisionForm.title || !decisionForm.description) {
      setDecisionNotice("Please enter a title and description.");
      return;
    }
    try {
      const externalId = `decision-${Date.now()}`;
      const response = await fetch("/api/decisions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalId, title: decisionForm.title, description: decisionForm.description }),
      });
      const data = (await response.json()) as { message?: string };
      setDecisionNotice(data.message ?? "Decision created and open for voting.");
      setDecisionList((prev) => [{ externalId, title: decisionForm.title, description: decisionForm.description, yesVotes: 0, noVotes: 0 }, ...prev]);
      setDecisionForm({ title: "", description: "" });
    } catch {
      setDecisionNotice("Network error. Please try again.");
    }
  };

  const handleUploadMinutes = async () => {
    setMinutesNotice(null);
    if (!minutesForm.meetingId || !minutesForm.minutesUrl) {
      setMinutesNotice("Please enter the meeting ID and the minutes document URL.");
      return;
    }
    try {
      const response = await fetch("/api/meetings/upload-minutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: minutesForm.meetingId, minutesDocumentUrl: minutesForm.minutesUrl }),
      });
      const data = (await response.json()) as { ok: boolean; message?: string };
      setMinutesNotice(data.message ?? "Minutes uploaded.");
      if (data.ok) setMinutesForm({ meetingId: "", minutesUrl: "" });
    } catch {
      setMinutesNotice("Network error. Please try again.");
    }
  };

  const handleAwardPoints = async () => {
    setPointsNotice(null);
    const pointsValue = Number(pointsForm.points);
    if (!pointsForm.memberNumber || Number.isNaN(pointsValue)) {
      setPointsNotice("Please enter a member number and points amount.");
      return;
    }

    try {
      const response = await fetch("/api/users/points/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberNumber: pointsForm.memberNumber, points: pointsValue }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        setPointsNotice(errorData.message || `Error: ${response.status}`);
        return;
      }

      const data = (await response.json()) as { message?: string; ok?: boolean };
      setPointsNotice(data.message ?? "Points awarded.");

      // Reload member summary to show updated points
      const summaryRes = await fetch("/api/users/summary");
      if (summaryRes.ok) {
        const summaryData = (await summaryRes.json()) as {
          user?: { name?: string; memberNumber?: string; points?: number };
        };
        if (summaryData.user) {
          setMemberSummary({
            name: summaryData.user.name ?? "Admin",
            memberNumber: summaryData.user.memberNumber ?? "ADM-0001",
            points: summaryData.user.points ?? 0,
          });
        }
      }
    } catch (error) {
      console.error("Award points error:", error);
      setPointsNotice("Network error. Please check your connection.");
    }

    setPointsForm({ memberNumber: "", points: "" });
  };

  return (
    <SiteShell currentPath="/admin" eyebrow="Administrative control room">
      <main className="section-shell mt-8 grid gap-6">
        <section className="grid gap-6">
          <Card className="relative overflow-hidden rounded-[40px] px-7 py-8 lg:px-10 lg:py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(120,120,120,0.16),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.95),rgba(228,228,224,0.88))]" />
            <div className="relative z-10 ornate-border memorial-shell p-6 sm:p-9 lg:p-10">
              <Pill>Admin dashboard</Pill>
             
              <div className="mt-8 rounded-3xl border border-zinc-200/80 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Live overview</p>
                <p className="mt-3 text-sm text-zinc-600">
                  Nothing to show here yet.
                </p>
              </div>
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="rounded-4xl">
            <Pill>Club finance</Pill>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Total money in club</p>
                <p className="mt-3 text-3xl font-semibold text-zinc-950">R{financeSummary.totalMoneyInClub}</p>
              </div>
              <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Total contributions</p>
                <p className="mt-3 text-3xl font-semibold text-zinc-950">R{financeSummary.totalContributions}</p>
              
              </div>
              <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Average monthly</p>
                <p className="mt-3 text-3xl font-semibold text-zinc-950">R{financeSummary.averageMonthly}</p>
                
              </div>
            </div>
            <div className="mt-6 rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Money flow analysis</p>
                  <p className="mt-2 text-lg font-semibold text-zinc-950">Monthly inflow from contributions</p>
                </div>
                <span className="text-xs uppercase tracking-[0.24em] text-zinc-500">R per month</span>
              </div>
              <div className="mt-4 grid gap-3">
                {financeSummary.monthlyTotals.length ? (
                  financeSummary.monthlyTotals.map((item) => (
                    <div key={item.month} className="flex items-center gap-3">
                      <span className="w-20 text-xs text-zinc-500">{item.month}</span>
                      <div className="h-3 flex-1 rounded-full bg-zinc-100">
                        <div
                          className="h-3 rounded-full bg-zinc-900"
                          style={{ width: `${(item.total / maxMonthlyTotal) * 100}%` }}
                        />
                      </div>
                      <span className="w-16 text-right text-xs text-zinc-600">R{item.total}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No contribution data yet.</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="rounded-4xl memorial-shell ornate-border">
            <Pill>Virtual membership card</Pill>
            <div className="mt-5 rounded-[26px] border border-[rgba(122,99,67,0.3)] bg-white/90 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Admin member</p>
              <p className="mt-3 text-2xl font-semibold text-zinc-950">{memberSummary.name}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.24em] text-zinc-500">Member number</p>
              <p className="mt-2 text-sm text-zinc-700">{memberSummary.memberNumber}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.24em] text-zinc-500">Points balance</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-950">{memberSummary.points}</p>
            </div>
            <div className="mt-6 grid gap-3">
              <Input
                placeholder="Member number to award"
                value={pointsForm.memberNumber}
                onChange={(event) => setPointsForm((prev) => ({ ...prev, memberNumber: event.target.value }))}
              />
              <Input
                placeholder="Points to add"
                value={pointsForm.points}
                onChange={(event) => setPointsForm((prev) => ({ ...prev, points: event.target.value }))}
              />
              <Button onClick={handleAwardPoints}>Award points</Button>
              {pointsNotice ? <p className="text-sm text-zinc-600">{pointsNotice}</p> : null}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-4xl">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-zinc-500" />
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">New members</p>
                <h3 className="mt-2 text-2xl font-semibold text-zinc-950">Pending applications</h3>
              </div>
            </div>
            <div className="mt-6 rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
              <p className="font-semibold text-zinc-950">No applications yet</p>
              <p className="mt-2 text-sm leading-7 text-zinc-600">
                New member applications will appear here after you have approved it.
              </p>
            </div>
          </Card>

          <Card className="rounded-4xl">
            <div className="flex items-center gap-3">
              <HandCoins className="h-6 w-6 text-zinc-500" />
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Loan requests</p>
                <h3 className="mt-2 text-2xl font-semibold text-zinc-950">7% interest workflow</h3>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {loanList.length ? (
                loanList.slice(0, 5).map((loan) => (
                  <div key={loan._id} className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                    <p className="font-semibold text-zinc-950">R{loan.amount} · {loan.interestRate}% interest</p>
                    <p className="mt-1 text-sm text-zinc-600">{loan.reason}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.24em] text-zinc-500">{loan.status}</p>
                    {loan.status === "pending" ? (
                      <div className="mt-3 flex gap-2">
                        <Button className="flex-1" onClick={() => handleLoanAction(loan._id, "approve")}>Approve</Button>
                        <Button variant="secondary" className="flex-1" onClick={() => handleLoanAction(loan._id, "reject")}>Reject</Button>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                  <p className="font-semibold text-zinc-950">No loan requests yet</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-600">Member loan applications will appear here with 7% interest applied.</p>
                </div>
              )}
              {loanNotice ? <p className="text-sm text-zinc-600">{loanNotice}</p> : null}
            </div>
          </Card>

          <Card className="rounded-4xl">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-6 w-6 text-zinc-500" />
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Claims</p>
                <h3 className="mt-2 text-2xl font-semibold text-zinc-950">Voting and document review</h3>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {claimList.length ? (
                claimList.slice(0, 5).map((claim) => (
                  <div key={claim._id} className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                    <p className="font-semibold text-zinc-950">Claim #{claim._id.slice(-6)}</p>
                    <p className="mt-1 text-sm text-zinc-600">Votes for: {claim.votesFor} · Against: {claim.votesAgainst}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.24em] text-zinc-500">{claim.status}</p>
                    {claim.status === "voting" || claim.status === "submitted" ? (
                      <div className="mt-3 flex gap-2">
                        <Button className="flex-1" onClick={() => handleClaimAction(claim._id, "approve")}>Approve</Button>
                        <Button variant="secondary" className="flex-1" onClick={() => handleClaimAction(claim._id, "reject")}>Reject</Button>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                  <p className="font-semibold text-zinc-950">No claims yet</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-600">Funeral claims appear here once members submit documentation.</p>
                </div>
              )}
              {claimNotice ? <p className="text-sm text-zinc-600">{claimNotice}</p> : null}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-4xl">
            <div className="flex items-center gap-2">
              <CalendarPlus2 className="h-5 w-5 text-zinc-500" />
              <p className="font-semibold text-zinc-950">Schedule a meeting</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-zinc-600">Create meetings and notify all members. Decline responses must include a reason.</p>
            <div className="mt-5 grid gap-3">
              <Input
                placeholder="Meeting title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="Date (e.g. 26 April 2026)"
                  value={form.date}
                  onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                />
                <Input
                  placeholder="Time (e.g. 14:00)"
                  value={form.time}
                  onChange={(event) => setForm((prev) => ({ ...prev, time: event.target.value }))}
                />
              </div>
              <Textarea
                placeholder="Optional agenda or reminder message"
                value={form.message}
                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
              />
              <Button onClick={handleSchedule} disabled={isScheduling}>
                {isScheduling ? "Scheduling..." : "Schedule and notify members"}
              </Button>
              {notice ? <p className="text-sm text-zinc-600">{notice}</p> : null}
            </div>
          </Card>

          <Card className="rounded-4xl">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Upcoming meetings</p>
            <div className="mt-4 space-y-4">
              {meetings.map((meeting) => (
                <div key={meeting._id} className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                  <p className="font-semibold text-zinc-950">{meeting.title}</p>
                  <p className="mt-1 text-sm text-zinc-500">{meeting.date} at {meeting.time}</p>
                  <p className="mt-3 text-sm leading-7 text-zinc-600">{meeting.message}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
                    Accepted {meeting.acceptedCount} · Declined {meeting.declinedCount}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">ID: {meeting._id}</p>
                  <Button
                    variant="secondary"
                    className="mt-3"
                    onClick={() => handleDeleteMeeting(meeting._id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-4xl">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-zinc-500" />
              <p className="font-semibold text-zinc-950">Live voting status</p>
            </div>
            <div className="mt-4 space-y-3">
              {decisionList.length ? (
                decisionList.map((decision) => (
                  <div key={decision.title} className="rounded-[22px] border border-zinc-200/80 bg-white/85 p-4">
                    <p className="font-semibold text-zinc-950">{decision.title}</p>
                    <p className="mt-2 text-sm text-zinc-600">{decision.description}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.24em] text-zinc-500">
                      Yes {decision.yesVotes} · No {decision.noVotes}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No open votes yet.</p>
              )}
            </div>
          </Card>

          <Card className="rounded-4xl">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-zinc-500" />
              <p className="font-semibold text-zinc-950">Attendance overview</p>
            </div>
            <div className="mt-5 rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Meetings logged</p>
              <p className="mt-3 text-3xl font-semibold text-zinc-950">
                {attendanceOverview.attended} / {attendanceOverview.total}
              </p>
              <p className="mt-2 text-sm text-zinc-500">Members attending on record</p>
            </div>
          </Card>

          <Card className="rounded-4xl">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-zinc-500" />
              <p className="font-semibold text-zinc-950">Rental and support queue</p>
            </div>
            <div className="mt-4 space-y-3">
              {rentalRequests.slice(0, 2).map((item) => (
                <div key={item._id} className="rounded-[22px] border border-zinc-200/80 bg-white/85 p-4">
                  <p className="font-semibold text-zinc-950">{item.memberName}</p>
                  <p className="mt-2 text-sm text-zinc-600">
                    {item.type} request for {item.item} on {item.date}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.24em] text-zinc-500">{item.status}</p>
                  <Button variant="secondary" className="mt-3" onClick={() => handleDeleteRental(item._id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              ))}
              {supportRequests.slice(0, 1).map((item) => (
                <div key={item._id} className="rounded-[22px] border border-zinc-200/80 bg-white/85 p-4">
                  <p className="font-semibold text-zinc-950">{item.memberName}</p>
                  <p className="mt-2 text-sm text-zinc-600">
                    Support request for {item.funeralOf}: {item.supportType}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.24em] text-zinc-500">{item.status}</p>
                  <Button
                    variant="secondary"
                    className="mt-3"
                    onClick={() => handleDeleteSupport(item._id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              ))}
              {!rentalRequests.length && !supportRequests.length ? (
                <p className="text-sm text-zinc-500">No rental or support requests yet.</p>
              ) : null}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-[30px]">
            <div className="flex items-center gap-2">
              <CalendarPlus2 className="h-5 w-5 text-zinc-500" />
              <p className="font-semibold text-zinc-950">Upload meeting minutes</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-zinc-600">Secretary uploads the minutes document URL for a specific meeting.</p>
            <div className="mt-4 grid gap-3">
              <Input
                placeholder="Meeting ID"
                value={minutesForm.meetingId}
                onChange={(event) => setMinutesForm((prev) => ({ ...prev, meetingId: event.target.value }))}
              />
              <Input
                placeholder="Minutes document URL"
                value={minutesForm.minutesUrl}
                onChange={(event) => setMinutesForm((prev) => ({ ...prev, minutesUrl: event.target.value }))}
              />
              <Button onClick={handleUploadMinutes}>Upload minutes</Button>
              {minutesNotice ? <p className="text-sm text-zinc-600">{minutesNotice}</p> : null}
            </div>
            <div className="mt-4 text-xs text-zinc-400">Meeting IDs are shown in the upcoming meetings list above.</div>
          </Card>

          <Card className="rounded-[30px]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-zinc-500" />
              <p className="font-semibold text-zinc-950">Fines and arrears</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-zinc-600">Add a fine to a member's balance. A 30% fine applies after three missed months.</p>
            <div className="mt-4 grid gap-3">
              <Input
                placeholder="Member number (e.g. MEM-0001)"
                value={finesForm.memberNumber}
                onChange={(event) => setFinesForm((prev) => ({ ...prev, memberNumber: event.target.value }))}
              />
              <Input
                placeholder="Fine amount (R)"
                value={finesForm.amount}
                onChange={(event) => setFinesForm((prev) => ({ ...prev, amount: event.target.value }))}
              />
              <Input
                placeholder="Reason"
                value={finesForm.reason}
                onChange={(event) => setFinesForm((prev) => ({ ...prev, reason: event.target.value }))}
              />
              <Button onClick={handleAddFine}>Add fine</Button>
              {finesNotice ? <p className="text-sm text-zinc-600">{finesNotice}</p> : null}
            </div>
            {finesList.length ? (
              <div className="mt-4 space-y-2">
                {finesList.slice(0, 5).map((fine) => (
                  <div key={fine._id} className="rounded-[20px] border border-zinc-200/80 bg-white/85 p-3">
                    <p className="font-semibold text-zinc-950">{fine.memberName} · R{fine.amount}</p>
                    <p className="text-sm text-zinc-600">{fine.reason}</p>
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{fine.status}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>

          <Card className="rounded-[30px]">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-zinc-500" />
              <p className="font-semibold text-zinc-950">Create decision vote</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-zinc-600">Open a new vote for committee members and admins to decide on.</p>
            <div className="mt-4 grid gap-3">
              <Input
                placeholder="Decision title"
                value={decisionForm.title}
                onChange={(event) => setDecisionForm((prev) => ({ ...prev, title: event.target.value }))}
              />
              <Textarea
                placeholder="Description of what needs to be decided"
                value={decisionForm.description}
                onChange={(event) => setDecisionForm((prev) => ({ ...prev, description: event.target.value }))}
              />
              <Button onClick={handleCreateDecision}>Open for voting</Button>
              {decisionNotice ? <p className="text-sm text-zinc-600">{decisionNotice}</p> : null}
            </div>
          </Card>
        </section>

        <section>
          <Card className="rounded-4xl">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Thathumusa logo" width={24} height={24} className="rounded-md" />
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Deceased beneficiaries</p>
                <h3 className="mt-2 text-2xl font-semibold text-zinc-950">Recorded member losses</h3>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {deceasedBeneficiaries.length ? (
                deceasedBeneficiaries.map((beneficiary) => (
                  <div key={beneficiary._id} className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                    <p className="font-semibold text-zinc-950">
                      {[beneficiary.name, beneficiary.surname].filter(Boolean).join(" ")}
                    </p>
                    <p className="mt-2 text-sm text-zinc-600">
                      Relationship: {beneficiary.relationship} · ID: {beneficiary.idNumber}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No deceased beneficiaries recorded yet.</p>
              )}
            </div>
          </Card>
        </section>

        <section>
          <AdminApprovalBoard />
        </section>
      </main>
    </SiteShell>
  );
}
