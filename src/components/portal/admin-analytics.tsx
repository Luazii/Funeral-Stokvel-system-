"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { TrendingUp, Activity, CircleDollarSign, AlertTriangle, FileCheck, Users } from "lucide-react";

// ─── types ───────────────────────────────────────────────────────────────────

export interface AnalyticsProps {
  financeSummary: {
    totalMoneyInClub: number;
    totalContributions: number;
    averageMonthly: number;
    monthlyTotals: Array<{ month: string; total: number }>;
  };
  attendanceOverview: { attended: number; total: number };
  contributionList: Array<{ _id: string; memberName: string; amount: number; date: string; status: string }>;
  loanList: Array<{ _id: string; memberId: string; amount: number; reason: string; status: string; interestRate: number }>;
  claimList: Array<{ _id: string; memberId: string; beneficiaryId: string; status: string; votesFor: number; votesAgainst: number }>;
  finesList: Array<{ _id: string; memberName: string; amount: number; reason: string; date: string; status: string }>;
}

// ─── primitive chart components ──────────────────────────────────────────────

function DonutChart({
  segments,
  size = 110,
  strokeWidth = 20,
  label,
  sublabel,
}: {
  segments: Array<{ value: number; color: string }>;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct = total > 0 ? seg.value / total : 0;
    const dashArray = `${pct * circumference} ${circumference}`;
    const rotate = offset * 360 - 90;
    offset += pct;
    return { ...seg, dashArray, rotate };
  });

  // If all zeros show a grey placeholder
  const isEmpty = total === 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {isEmpty ? (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#e4e4e7"
            strokeWidth={strokeWidth}
          />
        ) : (
          arcs.map((arc, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={arc.dashArray}
              transform={`rotate(${arc.rotate} ${cx} ${cy})`}
              strokeLinecap="butt"
            />
          ))
        )}
      </svg>
      {(label !== undefined || sublabel !== undefined) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {label !== undefined && (
            <span className="text-base font-bold leading-none text-zinc-900">{label}</span>
          )}
          {sublabel !== undefined && (
            <span className="mt-0.5 text-[10px] text-zinc-500">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

function BarChart({
  data,
  barColor = "#18181b",
  accentColor,
}: {
  data: Array<{ label: string; value: number; accent?: boolean }>;
  barColor?: string;
  accentColor?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = 24;
  const gap = 10;
  const chartH = 120;
  const labelH = 28;
  const totalW = data.length * (barW + gap) - gap;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${chartH + labelH}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {data.map((d, i) => {
        const barH = Math.max(3, (d.value / max) * chartH);
        const x = i * (barW + gap);
        const y = chartH - barH;
        const fill = d.accent && accentColor ? accentColor : barColor;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={fill} rx="5" opacity={d.value === 0 ? 0.18 : 1} />
            {/* value label above bar */}
            <text
              x={x + barW / 2}
              y={y - 4}
              textAnchor="middle"
              fontSize="8"
              fontWeight="600"
              fill="#3f3f46"
            >
              {d.value > 0 ? `R${d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value}` : ""}
            </text>
            {/* month label below bar */}
            <text
              x={x + barW / 2}
              y={chartH + labelH - 6}
              textAnchor="middle"
              fontSize="7"
              fill="#a1a1aa"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function HorizontalBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

// ─── legend dot ──────────────────────────────────────────────────────────────

function Dot({ color }: { color: string }) {
  return <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />;
}

// ─── main analytics component ────────────────────────────────────────────────

export function AdminAnalytics({
  financeSummary,
  attendanceOverview,
  contributionList,
  loanList,
  claimList,
  finesList,
}: AnalyticsProps) {
  // ── contribution status breakdown ─────────────────────────────────────────
  const contribStats = useMemo(() => {
    const paid = contributionList.filter((c) => c.status === "paid").length;
    const pending = contributionList.filter((c) => c.status === "pending").length;
    const late = contributionList.filter((c) => c.status === "late").length;
    const missed = contributionList.filter((c) => c.status === "missed").length;
    const total = contributionList.length;
    const complianceRate = total > 0 ? Math.round((paid / total) * 100) : 0;
    return { paid, pending, late, missed, total, complianceRate };
  }, [contributionList]);

  // ── loan status breakdown ─────────────────────────────────────────────────
  const loanStats = useMemo(() => {
    const pending = loanList.filter((l) => l.status === "pending").length;
    const approved = loanList.filter((l) => l.status === "approved").length;
    const rejected = loanList.filter((l) => l.status === "rejected").length;
    const settled = loanList.filter((l) => l.status === "settled").length;
    const totalAmount = loanList.filter((l) => l.status === "approved").reduce((s, l) => s + l.amount, 0);
    return { pending, approved, rejected, settled, totalAmount };
  }, [loanList]);

  // ── fines breakdown ───────────────────────────────────────────────────────
  const finesStats = useMemo(() => {
    const unpaid = finesList.filter((f) => f.status === "unpaid");
    const paid = finesList.filter((f) => f.status === "paid");
    const unpaidTotal = unpaid.reduce((s, f) => s + f.amount, 0);
    const paidTotal = paid.reduce((s, f) => s + f.amount, 0);
    return { unpaidCount: unpaid.length, paidCount: paid.length, unpaidTotal, paidTotal };
  }, [finesList]);

  // ── claims breakdown ──────────────────────────────────────────────────────
  const claimStats = useMemo(() => {
    const byStatus = claimList.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    }, {});
    return byStatus;
  }, [claimList]);

  // ── attendance ────────────────────────────────────────────────────────────
  const attendanceRate =
    attendanceOverview.total > 0
      ? Math.round((attendanceOverview.attended / attendanceOverview.total) * 100)
      : 0;

  // ── monthly bar chart data (last 8 months) ────────────────────────────────
  const barData = useMemo(() => {
    const recent = financeSummary.monthlyTotals.slice(-8);
    return recent.map((m) => ({
      label: m.month.slice(5), // "MM"
      value: m.total,
    }));
  }, [financeSummary.monthlyTotals]);

  // ── top contributors ──────────────────────────────────────────────────────
  const topContributors = useMemo(() => {
    const totals: Record<string, number> = {};
    contributionList.forEach((c) => {
      if (c.status === "paid") totals[c.memberName] = (totals[c.memberName] ?? 0) + c.amount;
    });
    return Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));
  }, [contributionList]);

  const maxContrib = topContributors[0]?.amount ?? 1;

  return (
    <section className="grid gap-6">
      {/* ── section header ─────────────────────────────────────────────── */}
      <Card className="rounded-4xl">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-zinc-500" />
          <Pill>Data analytics</Pill>
        </div>

        {/* KPI tiles */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-emerald-600" />
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Money in club</p>
            </div>
            <p className="mt-3 text-3xl font-bold text-zinc-950">R{financeSummary.totalMoneyInClub.toLocaleString()}</p>
            <p className="mt-1 text-xs text-zinc-400">Total contributions received</p>
          </div>

          <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Average monthly</p>
            </div>
            <p className="mt-3 text-3xl font-bold text-zinc-950">R{financeSummary.averageMonthly.toLocaleString()}</p>
            <p className="mt-1 text-xs text-zinc-400">Avg inflow per month</p>
          </div>

          <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-600" />
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Attendance rate</p>
            </div>
            <p className="mt-3 text-3xl font-bold text-zinc-950">{attendanceRate}%</p>
            <p className="mt-1 text-xs text-zinc-400">{attendanceOverview.attended} of {attendanceOverview.total} records</p>
          </div>

          <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-amber-600" />
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Compliance rate</p>
            </div>
            <p className="mt-3 text-3xl font-bold text-zinc-950">{contribStats.complianceRate}%</p>
            <p className="mt-1 text-xs text-zinc-400">{contribStats.paid} paid of {contribStats.total} contributions</p>
          </div>

          <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Unpaid fines</p>
            </div>
            <p className="mt-3 text-3xl font-bold text-zinc-950">R{finesStats.unpaidTotal.toLocaleString()}</p>
            <p className="mt-1 text-xs text-zinc-400">{finesStats.unpaidCount} outstanding fine{finesStats.unpaidCount !== 1 ? "s" : ""}</p>
          </div>

          <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-zinc-600" />
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Active loans</p>
            </div>
            <p className="mt-3 text-3xl font-bold text-zinc-950">R{loanStats.totalAmount.toLocaleString()}</p>
            <p className="mt-1 text-xs text-zinc-400">{loanStats.approved} approved loan{loanStats.approved !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </Card>

      {/* ── monthly contributions bar chart ────────────────────────────── */}
      <Card className="rounded-4xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Monthly inflow</p>
            <p className="mt-2 text-lg font-semibold text-zinc-950">Contribution history</p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-500">Last 8 months</span>
        </div>
        <div className="mt-6">
          {barData.length > 0 ? (
            <BarChart data={barData} barColor="#18181b" />
          ) : (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-zinc-100 bg-zinc-50">
              <p className="text-sm text-zinc-400">No contribution data yet</p>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <Dot color="#18181b" />
          <span className="text-xs text-zinc-500">Monthly total (ZAR)</span>
        </div>
      </Card>

      {/* ── donut charts row ────────────────────────────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* contribution compliance */}
        <Card className="rounded-4xl flex flex-col items-center gap-4">
          <p className="self-start text-xs uppercase tracking-[0.24em] text-zinc-500">Contributions</p>
          <DonutChart
            segments={[
              { value: contribStats.paid, color: "#16a34a" },
              { value: contribStats.pending, color: "#f59e0b" },
              { value: contribStats.late, color: "#f97316" },
              { value: contribStats.missed, color: "#ef4444" },
            ]}
            label={`${contribStats.complianceRate}%`}
            sublabel="paid"
          />
          <div className="w-full space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5"><Dot color="#16a34a" />Paid</span><span className="font-semibold text-zinc-900">{contribStats.paid}</span></div>
            <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5"><Dot color="#f59e0b" />Pending</span><span className="font-semibold text-zinc-900">{contribStats.pending}</span></div>
            <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5"><Dot color="#f97316" />Late</span><span className="font-semibold text-zinc-900">{contribStats.late}</span></div>
            <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5"><Dot color="#ef4444" />Missed</span><span className="font-semibold text-zinc-900">{contribStats.missed}</span></div>
          </div>
        </Card>

        {/* loan pipeline */}
        <Card className="rounded-4xl flex flex-col items-center gap-4">
          <p className="self-start text-xs uppercase tracking-[0.24em] text-zinc-500">Loans</p>
          <DonutChart
            segments={[
              { value: loanStats.approved, color: "#2563eb" },
              { value: loanStats.pending, color: "#f59e0b" },
              { value: loanStats.settled, color: "#16a34a" },
              { value: loanStats.rejected, color: "#ef4444" },
            ]}
            label={`${loanList.length}`}
            sublabel="total"
          />
          <div className="w-full space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5"><Dot color="#2563eb" />Approved</span><span className="font-semibold text-zinc-900">{loanStats.approved}</span></div>
            <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5"><Dot color="#f59e0b" />Pending</span><span className="font-semibold text-zinc-900">{loanStats.pending}</span></div>
            <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5"><Dot color="#16a34a" />Settled</span><span className="font-semibold text-zinc-900">{loanStats.settled}</span></div>
            <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5"><Dot color="#ef4444" />Rejected</span><span className="font-semibold text-zinc-900">{loanStats.rejected}</span></div>
          </div>
        </Card>

        {/* attendance */}
        <Card className="rounded-4xl flex flex-col items-center gap-4">
          <p className="self-start text-xs uppercase tracking-[0.24em] text-zinc-500">Attendance</p>
          <DonutChart
            segments={[
              { value: attendanceOverview.attended, color: "#8b5cf6" },
              { value: Math.max(0, attendanceOverview.total - attendanceOverview.attended), color: "#e4e4e7" },
            ]}
            label={`${attendanceRate}%`}
            sublabel="rate"
          />
          <div className="w-full space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5"><Dot color="#8b5cf6" />Attended</span><span className="font-semibold text-zinc-900">{attendanceOverview.attended}</span></div>
            <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5"><Dot color="#e4e4e7" />Missed</span><span className="font-semibold text-zinc-900">{Math.max(0, attendanceOverview.total - attendanceOverview.attended)}</span></div>
          </div>
        </Card>

        {/* fines recovery */}
        <Card className="rounded-4xl flex flex-col items-center gap-4">
          <p className="self-start text-xs uppercase tracking-[0.24em] text-zinc-500">Fines</p>
          <DonutChart
            segments={[
              { value: finesStats.paidTotal, color: "#16a34a" },
              { value: finesStats.unpaidTotal, color: "#ef4444" },
            ]}
            label={finesList.length > 0 ? `${Math.round((finesStats.paidTotal / Math.max(1, finesStats.paidTotal + finesStats.unpaidTotal)) * 100)}%` : "—"}
            sublabel="recovered"
          />
          <div className="w-full space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5"><Dot color="#16a34a" />Collected</span><span className="font-semibold text-zinc-900">R{finesStats.paidTotal}</span></div>
            <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5"><Dot color="#ef4444" />Outstanding</span><span className="font-semibold text-zinc-900">R{finesStats.unpaidTotal}</span></div>
          </div>
        </Card>
      </div>

      {/* ── claims pipeline + top contributors ────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* claims status pipeline */}
        <Card className="rounded-4xl">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Claims pipeline</p>
          <p className="mt-2 text-lg font-semibold text-zinc-950">Status breakdown</p>
          <div className="mt-5 space-y-3">
            {(["draft", "submitted", "voting", "approved", "rejected", "paid"] as const).map((status) => {
              const count = claimStats[status] ?? 0;
              const totalClaims = claimList.length;
              const colorMap: Record<string, string> = {
                draft: "#a1a1aa",
                submitted: "#f59e0b",
                voting: "#3b82f6",
                approved: "#16a34a",
                rejected: "#ef4444",
                paid: "#8b5cf6",
              };
              return (
                <div key={status} className="grid gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 capitalize text-zinc-600">
                      <Dot color={colorMap[status]} />{status}
                    </span>
                    <span className="font-semibold text-zinc-900">{count}</span>
                  </div>
                  <HorizontalBar value={count} max={Math.max(1, totalClaims)} color={colorMap[status]} />
                </div>
              );
            })}
            {claimList.length === 0 && (
              <p className="text-sm text-zinc-400">No claims recorded yet.</p>
            )}
          </div>
        </Card>

        {/* top contributors */}
        <Card className="rounded-4xl">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Top contributors</p>
          <p className="mt-2 text-lg font-semibold text-zinc-950">Members by total paid</p>
          <div className="mt-5 space-y-4">
            {topContributors.length > 0 ? (
              topContributors.map((member, i) => (
                <div key={member.name} className="grid gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-zinc-700">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500">
                        {i + 1}
                      </span>
                      {member.name}
                    </span>
                    <span className="font-semibold text-zinc-900">R{member.amount.toLocaleString()}</span>
                  </div>
                  <HorizontalBar value={member.amount} max={maxContrib} color="#18181b" />
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-400">No paid contributions yet.</p>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
