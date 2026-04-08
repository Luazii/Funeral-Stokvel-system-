"use client";

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        ref: string;
        metadata?: Record<string, unknown>;
        callback: (response: { reference: string }) => Promise<void> | void;
        onClose: () => void;
      }) => { openIframe: () => void };
    };
  }
}

import { useEffect, useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/field";

const MONTHLY_CONTRIBUTION = 250;
const MAX_PROOF_SIZE_MB = 5;
const ALLOWED_PROOF_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const paymentSchema = z.object({
  amount: z.number().min(MONTHLY_CONTRIBUTION, `Minimum contribution is R${MONTHLY_CONTRIBUTION}`),
  month: z.string().min(1, "Select a contribution month"),
});

const claimSchema = z.object({
  beneficiaryIdNumber: z.string().min(13, "Enter the beneficiary's 13-digit SA ID number").max(13, "SA ID number must be 13 digits"),
  notes: z.string().min(8, "Please add at least a brief note"),
});

const loanSchema = z.object({
  amount: z.number().min(500, "Minimum loan amount is R500"),
  reason: z.string().min(8, "Please describe your reason in at least 8 characters"),
  repaymentPlan: z.string().min(1, "Select a repayment plan"),
});

type Transaction = {
  _id: string;
  memberName: string;
  amount: number;
  date: string;
  month?: string;
  status: string;
  paymentReference?: string;
};

type PaymentReceipt = {
  reference: string;
  amount: number;
  date: string;
  month: string;
};

export function MemberWorkflows() {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <PaymentCard />
      <ClaimCard />
      <LoanCard />
    </div>
  );
}

function PaymentCard() {
  const defaultMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success" | "info">("info");
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);
  const [email, setEmail] = useState("");
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proofMode, setProofMode] = useState(false); // manual proof upload mode

  const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "";
  const paystackConfigured = Boolean(paystackPublicKey);

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: MONTHLY_CONTRIBUTION, month: defaultMonth },
  });

  const { watch, formState: { errors } } = form;
  const selectedMonth = watch("month");

  const alreadyPaidForSelectedMonth = useMemo(() => {
    if (!selectedMonth || !transactionHistory.length) return false;
    return transactionHistory.some(
      (t) => t.status.toLowerCase() === "paid" && (t.month ?? "").slice(0, 7) === selectedMonth.slice(0, 7),
    );
  }, [selectedMonth, transactionHistory]);

  const loadPaystack = useCallback(() => {
    if (typeof window === "undefined" || window.PaystackPop) {
      setPaystackLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => setPaystackLoaded(true);
    document.body.appendChild(script);
  }, []);

  const fetchUserEmail = useCallback(async () => {
    try {
      const res = await fetch("/api/users/summary");
      if (!res.ok) return;
      const data = await res.json();
      setEmail(data.user?.email ?? "");
    } catch { /* ignore */ }
  }, []);

  const fetchTransactionHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/contributions/list?mine=true");
      if (!res.ok) return;
      const data = (await res.json()) as { ok: boolean; items?: Transaction[] };
      if (data.ok && data.items) setTransactionHistory(data.items.slice(-6).reverse());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadPaystack();
    fetchUserEmail();
    fetchTransactionHistory();
  }, []);

  // Proof of payment file validation
  const handleProofChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProofError(null);
    const file = event.target.files?.[0] ?? null;
    if (!file) { setProofFile(null); return; }

    if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
      setProofError("Invalid file type. Please upload a PDF, JPEG, PNG, or WebP image.");
      setProofFile(null);
      return;
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_PROOF_SIZE_MB) {
      setProofError(`File is too large (${sizeMB.toFixed(1)} MB). Maximum size is ${MAX_PROOF_SIZE_MB} MB.`);
      setProofFile(null);
      return;
    }
    setProofFile(file);
  };

  const verifyPayment = async (reference: string, amount: number, month: string) => {
    try {
      const res = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`);
      const data = await res.json();
      if (data.ok && data.data?.status === "success") {
        setCheckoutOpen(false);
        setReceipt({ reference, amount, date: new Date().toISOString(), month });
        setMessage("Payment successful – thank you for your contribution!");
        setMessageType("success");
        fetchTransactionHistory();
        return;
      }
      setCheckoutOpen(false);
      setMessage("Payment not confirmed. Please retry or upload proof manually.");
      setMessageType("error");
    } catch {
      setCheckoutOpen(false);
      setMessage("Payment verification failed. Check your transaction reference.");
      setMessageType("error");
    }
  };

  const onSubmit = async (values: z.infer<typeof paymentSchema>) => {
    if (checkoutOpen) return;

    // Validate: amount must equal R250
    if (values.amount < MONTHLY_CONTRIBUTION) {
      setMessage(`The required monthly contribution is R${MONTHLY_CONTRIBUTION}.`);
      setMessageType("error");
      return;
    }

    if (alreadyPaidForSelectedMonth) {
      setMessage(`You have already paid for ${selectedMonth}. Only one payment per month is allowed.`);
      setMessageType("error");
      return;
    }

    if (!email) {
      setMessage("Your email could not be loaded. Please refresh and try again.");
      setMessageType("error");
      return;
    }

    if (!paystackConfigured) {
      setMessage("Paystack is not configured. Set NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY in .env.local.");
      setMessageType("info");
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setReceipt(null);

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: values.amount, month: values.month, email }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string; data?: { authorization_url: string; reference: string } };

      if (!data.ok || !data.data) {
        setMessage(data.message ?? "Failed to start Paystack checkout.");
        setMessageType("error");
        return;
      }

      const reference = data.data.reference;
      setCheckoutOpen(true);

      if (window.PaystackPop && paystackPublicKey) {
        window.PaystackPop.setup({
          key: paystackPublicKey,
          email,
          amount: values.amount * 100,
          ref: reference,
          metadata: { month: values.month },
          callback: async () => { await verifyPayment(reference, values.amount, values.month); },
          onClose: () => {
            setCheckoutOpen(false);
            if (!receipt) { setMessage("Payment window closed before completion."); setMessageType("info"); }
          },
        }).openIframe();
      } else {
        window.location.href = data.data.authorization_url;
      }
    } catch {
      setCheckoutOpen(false);
      setMessage("Payment initialization failed. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProofSubmit = async () => {
    if (!proofFile) { setProofError("Please select a proof of payment file."); return; }
    if (alreadyPaidForSelectedMonth) {
      setMessage(`Already paid for ${selectedMonth}.`); setMessageType("info"); return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      // Log a pending contribution with proof indicator
      const res = await fetch("/api/contributions/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: form.getValues("amount"), date: new Date().toISOString(), month: form.getValues("month"), status: "pending" }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (data.ok) {
        setMessage("Proof of payment submitted. Admin will verify and confirm your contribution.");
        setMessageType("success");
        setProofFile(null);
        fetchTransactionHistory();
      } else {
        setMessage(data.message ?? "Submission failed.");
        setMessageType("error");
      }
    } catch {
      setMessage("Network error. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const nextDueDate = useMemo(() => {
    const d = new Date();
    d.setDate(7);
    if (new Date() > d) d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString("en-ZA", { month: "long", day: "numeric", year: "numeric" });
  }, []);

  const msgClass = messageType === "success" ? "text-emerald-700" : messageType === "error" ? "text-red-600" : "text-zinc-600";

  return (
    <Card className="rounded-4xl">
      <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Monthly contribution</p>
      <h3 className="mt-3 text-2xl font-semibold text-zinc-950">Pay R{MONTHLY_CONTRIBUTION}</h3>

      {/* Due date banner */}
      <div className="mt-5 rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Next due date</p>
        <p className="mt-2 text-lg font-semibold text-zinc-950">{nextDueDate}</p>
        <p className="mt-1 text-sm text-zinc-500">Required amount: R{MONTHLY_CONTRIBUTION} per month.</p>
      </div>

      {/* Month + amount */}
      <form className="mt-5 grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.24em] text-zinc-500">Contribution month</label>
          <Input type="month" {...form.register("month")} />
          {errors.month ? <p className="mt-1 text-xs text-red-600">{errors.month.message}</p> : null}
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.24em] text-zinc-500">Amount (R)</label>
          <Input
            type="number"
            {...form.register("amount", { valueAsNumber: true })}
            min={MONTHLY_CONTRIBUTION}
            defaultValue={MONTHLY_CONTRIBUTION}
          />
          {errors.amount ? <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p> : null}
        </div>

        {alreadyPaidForSelectedMonth ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm text-emerald-800">Contribution already paid for this month.</p>
          </div>
        ) : null}

        {/* Pay online via Paystack */}
        <Button
          type="submit"
          disabled={isLoading || checkoutOpen || alreadyPaidForSelectedMonth || !paystackConfigured}
        >
          {isLoading ? "Opening checkout..." : "Pay R250 with Paystack"}
        </Button>
        {!paystackConfigured ? (
          <p className="text-xs text-amber-700">Paystack not configured. Add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to .env.local.</p>
        ) : null}
      </form>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-200" />
        <span className="text-xs uppercase tracking-[0.24em] text-zinc-400">or upload proof</span>
        <div className="h-px flex-1 bg-zinc-200" />
      </div>

      {/* Manual proof upload */}
      <div className="grid gap-3">
        <p className="text-sm text-zinc-600">Already paid via bank transfer? Upload your proof of payment.</p>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.24em] text-zinc-500">
            Proof of payment (PDF or Image, max {MAX_PROOF_SIZE_MB} MB)
          </label>
          <Input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleProofChange}
          />
          {proofError ? <p className="mt-1 text-xs text-red-600">{proofError}</p> : null}
          {proofFile ? (
            <p className="mt-1 text-xs text-emerald-700">
              ✓ {proofFile.name} ({(proofFile.size / (1024 * 1024)).toFixed(2)} MB) — valid file
            </p>
          ) : null}
        </div>
        <Button
          variant="secondary"
          disabled={!proofFile || isLoading || alreadyPaidForSelectedMonth}
          onClick={handleProofSubmit}
        >
          {isLoading ? "Submitting..." : "Submit proof for admin review"}
        </Button>
      </div>

      {receipt ? (
        <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-semibold text-emerald-900">Payment confirmed!</p>
          <p className="mt-2 text-sm text-zinc-700">Reference: {receipt.reference}</p>
          <p className="text-sm text-zinc-700">Amount: R{receipt.amount}</p>
          <p className="text-sm text-zinc-700">Month: {receipt.month}</p>
        </div>
      ) : null}
      {message ? <p className={`mt-4 text-sm leading-7 ${msgClass}`}>{message}</p> : null}

      {/* Transaction history */}
      <div className="mt-6 rounded-[28px] border border-zinc-200/80 bg-white/85 p-4">
        <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Transaction history</p>
        <div className="mt-4 space-y-3">
          {transactionHistory.length ? (
            transactionHistory.map((t) => (
              <div key={t._id} className="rounded-3xl border border-zinc-200/80 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-950">{t.month ? t.month.slice(0, 7) : `R${t.amount}`}</p>
                    <p className="text-xs text-zinc-500">{new Date(t.date).toLocaleDateString("en-ZA")}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.24em] ${t.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                    {t.status}
                  </span>
                </div>
                {t.paymentReference ? <p className="mt-2 text-xs text-zinc-500">Ref: {t.paymentReference}</p> : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-500">No contribution transactions yet.</p>
          )}
        </div>
      </div>
    </Card>
  );
}

const ALLOWED_DOC_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_DOC_SIZE_MB = 10;

function validateDocFile(file: File | null): string | null {
  if (!file) return null;
  if (!ALLOWED_DOC_TYPES.includes(file.type)) return "Invalid file type. Use PDF, JPEG, or PNG.";
  if (file.size / (1024 * 1024) > MAX_DOC_SIZE_MB) return `File too large. Max ${MAX_DOC_SIZE_MB} MB.`;
  return null;
}

function ClaimCard() {
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success" | "info">("info");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Document upload state
  const [idCopyFile, setIdCopyFile] = useState<File | null>(null);
  const [deathCertFile, setDeathCertFile] = useState<File | null>(null);
  const [idCopyError, setIdCopyError] = useState<string | null>(null);
  const [deathCertError, setDeathCertError] = useState<string | null>(null);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validated, setValidated] = useState(false);
  const [contribUpToDate, setContribUpToDate] = useState<boolean | null>(null);

  const form = useForm<z.infer<typeof claimSchema>>({
    resolver: zodResolver(claimSchema),
    defaultValues: { beneficiaryIdNumber: "", notes: "" },
  });
  const { formState: { errors }, watch } = form;
  const idNumber = watch("beneficiaryIdNumber");

  const handleIdCopyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setIdCopyError(validateDocFile(file));
    setIdCopyFile(file && !validateDocFile(file) ? file : null);
    setValidated(false);
  };

  const handleDeathCertChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setDeathCertError(validateDocFile(file));
    setDeathCertFile(file && !validateDocFile(file) ? file : null);
    setValidated(false);
  };

  const validateClaim = async () => {
    setIsValidating(true);
    setValidationErrors([]);
    setValidated(false);
    const errs: string[] = [];

    // Check 1: ID number format (SA ID = 13 digits)
    const rawId = idNumber.replace(/\s/g, "");
    if (!/^\d{13}$/.test(rawId)) {
      errs.push("Beneficiary ID number must be exactly 13 digits.");
    }

    // Check 2: Documents uploaded
    if (!idCopyFile) errs.push("Please upload a copy of the beneficiary's ID document.");
    if (!deathCertFile) errs.push("Please upload the official death certificate.");

    // Check 3: Contributions up to date
    try {
      const contribRes = await fetch("/api/contributions/status");
      if (contribRes.ok) {
        const data = (await contribRes.json()) as { upToDate: boolean; reason?: string | null };
        setContribUpToDate(data.upToDate);
        if (!data.upToDate && data.reason) errs.push(data.reason);
      }
    } catch {
      // Non-blocking — continue with submission
    }

    if (errs.length > 0) {
      setValidationErrors(errs);
      setIsValidating(false);
      return;
    }

    setValidated(true);
    setMessage("All checks passed. You may now submit the claim.");
    setMessageType("success");
    setIsValidating(false);
  };

  const onSubmit = async (values: z.infer<typeof claimSchema>) => {
    if (!validated) {
      setMessage("Please validate your claim first.");
      setMessageType("error");
      return;
    }
    if (!idCopyFile || !deathCertFile) {
      setMessage("Both documents are required.");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/claims/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beneficiaryIdNumber: values.beneficiaryIdNumber.replace(/\s/g, ""),
          idCopyUrl: `uploaded:${idCopyFile.name}`,
          deathCertificateUrl: `uploaded:${deathCertFile.name}`,
          notes: values.notes,
        }),
      });
      const data = (await response.json()) as { ok: boolean; message?: string };
      setMessage(data.message ?? (data.ok ? "Claim submitted. Admin and committee will review." : "Submission failed."));
      setMessageType(data.ok ? "success" : "error");
      if (data.ok) {
        form.reset();
        setIdCopyFile(null);
        setDeathCertFile(null);
        setValidated(false);
      }
    } catch {
      setMessage("Network error. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const msgClass = messageType === "success" ? "text-emerald-700" : messageType === "error" ? "text-red-600" : "text-zinc-600";

  return (
    <Card className="rounded-4xl">
      <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Request for payment</p>
      <h3 className="mt-3 text-2xl font-semibold text-zinc-950">Funeral claim</h3>
      <p className="mt-2 text-sm text-zinc-500">Submit when a registered beneficiary has passed. Contributions must be up to date and documents uploaded.</p>

      <form className="mt-5 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Beneficiary ID */}
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.24em] text-zinc-500">Beneficiary SA ID number (13 digits)</label>
          <Input
            {...form.register("beneficiaryIdNumber")}
            placeholder="e.g. 8001015009087"
            maxLength={13}
          />
          {errors.beneficiaryIdNumber ? <p className="mt-1 text-xs text-red-600">{errors.beneficiaryIdNumber.message}</p> : null}
        </div>

        {/* ID copy upload */}
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.24em] text-zinc-500">
            Beneficiary ID copy (PDF/Image, max {MAX_DOC_SIZE_MB} MB) *
          </label>
          <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleIdCopyChange} />
          {idCopyError ? <p className="mt-1 text-xs text-red-600">{idCopyError}</p> : null}
          {idCopyFile ? <p className="mt-1 text-xs text-emerald-700">✓ {idCopyFile.name}</p> : null}
        </div>

        {/* Death certificate upload */}
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.24em] text-zinc-500">
            Death certificate (PDF/Image, max {MAX_DOC_SIZE_MB} MB) *
          </label>
          <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleDeathCertChange} />
          {deathCertError ? <p className="mt-1 text-xs text-red-600">{deathCertError}</p> : null}
          {deathCertFile ? <p className="mt-1 text-xs text-emerald-700">✓ {deathCertFile.name}</p> : null}
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.24em] text-zinc-500">Family notes / support request</label>
          <Textarea {...form.register("notes")} placeholder="Brief description of the situation" />
          {errors.notes ? <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p> : null}
        </div>

        {/* Validation step */}
        {!validated ? (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={isValidating}
            onClick={validateClaim}
          >
            {isValidating ? "Validating..." : "Validate claim"}
          </Button>
        ) : null}

        {/* Validation errors */}
        {validationErrors.length > 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">Claim cannot be submitted:</p>
            {validationErrors.map((err, i) => (
              <p key={i} className="mt-1 text-sm text-red-700">• {err}</p>
            ))}
          </div>
        ) : null}

        {/* Contribution status badge */}
        {contribUpToDate !== null ? (
          <div className={`rounded-2xl border px-4 py-2 ${contribUpToDate ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
            <p className={`text-xs ${contribUpToDate ? "text-emerald-700" : "text-amber-700"}`}>
              {contribUpToDate ? "✓ Contributions are up to date" : "Contributions not up to date — pay before submitting"}
            </p>
          </div>
        ) : null}

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isLoading || !validated}>
          {isLoading ? "Submitting..." : "Submit funeral claim"}
        </Button>
      </form>

      {message ? <p className={`mt-4 text-sm leading-7 ${msgClass}`}>{message}</p> : null}
    </Card>
  );
}

type EligibilityState = {
  checked: boolean;
  eligible: boolean;
  reasons: string[];
  memberNumber: string | null;
};

function LoanCard() {
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success" | "info">("info");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [eligibility, setEligibility] = useState<EligibilityState>({
    checked: false,
    eligible: false,
    reasons: [],
    memberNumber: null,
  });

  const form = useForm<z.infer<typeof loanSchema>>({
    resolver: zodResolver(loanSchema),
    defaultValues: { amount: 1500, reason: "", repaymentPlan: "" },
  });

  const { formState: { errors } } = form;

  const checkEligibility = async () => {
    setIsCheckingEligibility(true);
    setMessage(null);
    const reasons: string[] = [];
    let memberNumber: string | null = null;

    try {
      // Check 1: Member is registered (has member number)
      const summaryRes = await fetch("/api/users/summary");
      if (summaryRes.ok) {
        const summaryData = (await summaryRes.json()) as { user?: { memberNumber?: string; status?: string } };
        memberNumber = summaryData.user?.memberNumber ?? null;
        if (!memberNumber) reasons.push("You do not have a membership card yet. Contact admin to complete registration.");
        if (summaryData.user?.status === "pending") reasons.push("Your membership is still pending approval.");
      } else {
        reasons.push("Could not verify membership. Please ensure you are signed in.");
      }

      // Check 2: Contributions are up to date
      const contribRes = await fetch("/api/contributions/status");
      if (contribRes.ok) {
        const contribData = (await contribRes.json()) as { upToDate: boolean; reason?: string | null };
        if (!contribData.upToDate && contribData.reason) {
          reasons.push(contribData.reason);
        }
      }

      const eligible = reasons.length === 0;
      setEligibility({ checked: true, eligible, reasons, memberNumber });
      if (eligible) {
        setMessage("You are eligible to apply for a loan. Please complete the form below.");
        setMessageType("success");
      }
    } catch {
      setMessage("Could not verify eligibility. Please try again.");
      setMessageType("error");
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof loanSchema>) => {
    if (!eligibility.eligible) {
      setMessage("Please check your eligibility first.");
      setMessageType("error");
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/loans/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: values.amount,
          reason: `${values.reason} (Repayment plan: ${values.repaymentPlan})`,
        }),
      });
      const data = (await response.json()) as { ok: boolean; message?: string };
      setMessage(data.message ?? (data.ok ? "Loan request submitted." : "Submission failed."));
      setMessageType(data.ok ? "success" : "error");
      if (data.ok) form.reset({ amount: 1500, reason: "", repaymentPlan: "" });
    } catch {
      setMessage("Network error. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const msgClass = messageType === "success" ? "text-emerald-700" : messageType === "error" ? "text-red-600" : "text-zinc-600";

  return (
    <Card className="rounded-4xl">
      <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Loan programme</p>
      <h3 className="mt-3 text-2xl font-semibold text-zinc-950">Loan application</h3>
      <p className="mt-2 text-sm text-zinc-500">7% interest applies. Requires up-to-date contributions and an active membership card.</p>

      {/* Step 1 – Eligibility check */}
      {!eligibility.checked ? (
        <div className="mt-5">
          <Button onClick={checkEligibility} disabled={isCheckingEligibility} className="w-full">
            {isCheckingEligibility ? "Checking eligibility..." : "Check my eligibility"}
          </Button>
        </div>
      ) : null}

      {/* Eligibility result */}
      {eligibility.checked ? (
        <div className={`mt-5 rounded-3xl border p-4 ${eligibility.eligible ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
          <p className={`font-semibold ${eligibility.eligible ? "text-emerald-900" : "text-red-800"}`}>
            {eligibility.eligible ? "Eligible to apply" : "Not eligible at this time"}
          </p>
          {eligibility.memberNumber ? (
            <p className="mt-1 text-sm text-zinc-600">Membership card: {eligibility.memberNumber}</p>
          ) : null}
          {eligibility.reasons.map((reason, i) => (
            <p key={i} className="mt-2 text-sm text-red-700">• {reason}</p>
          ))}
          <button
            type="button"
            className="mt-3 text-xs text-zinc-400 underline"
            onClick={() => { setEligibility({ checked: false, eligible: false, reasons: [], memberNumber: null }); setMessage(null); }}
          >
            Re-check eligibility
          </button>
        </div>
      ) : null}

      {/* Step 2 – Loan form (only shown if eligible) */}
      {eligibility.eligible ? (
        <form className="mt-5 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.24em] text-zinc-500">Loan amount (R)</label>
            <Input type="number" {...form.register("amount", { valueAsNumber: true })} min={500} placeholder="Minimum R500" />
            {errors.amount ? <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p> : null}
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.24em] text-zinc-500">Reason for loan</label>
            <Textarea {...form.register("reason")} placeholder="Describe your reason (min 8 characters)" />
            {errors.reason ? <p className="mt-1 text-xs text-red-600">{errors.reason.message}</p> : null}
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.24em] text-zinc-500">Repayment plan</label>
            <Select {...form.register("repaymentPlan")}>
              <option value="">Select a repayment plan</option>
              <option value="3 months">3 months</option>
              <option value="5 months">5 months</option>
              <option value="6 months">6 months</option>
            </Select>
            {errors.repaymentPlan ? <p className="mt-1 text-xs text-red-600">{errors.repaymentPlan.message}</p> : null}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit loan request"}
          </Button>
        </form>
      ) : null}

      {message ? <p className={`mt-4 text-sm leading-7 ${msgClass}`}>{message}</p> : null}
    </Card>
  );
}
