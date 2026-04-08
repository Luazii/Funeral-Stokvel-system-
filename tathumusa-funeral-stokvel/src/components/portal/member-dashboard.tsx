"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  LayoutGrid,
  ThumbsDown,
  ThumbsUp,
  Users,
} from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { MemberWorkflows } from "@/components/portal/member-workflows";

const initialDecisions: Array<{ id: string; title: string; description: string; yes: number; no: number }> = [];

export function MemberDashboard() {
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);
  const [contributionNotice, setContributionNotice] = useState<string | null>(null);
  const [attendanceNotice, setAttendanceNotice] = useState<string | null>(null);
  const [rentalNotice, setRentalNotice] = useState<string | null>(null);
  const [supportNotice, setSupportNotice] = useState<string | null>(null);
  const [meetingNotice, setMeetingNotice] = useState<string | null>(null);
  const [votingNotice, setVotingNotice] = useState<string | null>(null);
  const [customize, setCustomize] = useState(false);
  const [showBeneficiaries, setShowBeneficiaries] = useState(true);
  const [showMeetings, setShowMeetings] = useState(true);
  const [showAttendance, setShowAttendance] = useState(true);
  const [showVoting, setShowVoting] = useState(true);
  const [showMembershipCard, setShowMembershipCard] = useState(true);
  const [showRentalsSupport, setShowRentalsSupport] = useState(true);
  const [beneficiaryList, setBeneficiaryList] = useState<
    Array<{
      name: string;
      surname?: string;
      relationship: string;
      idNumber: string;
      age?: number;
      gender?: string;
      photoUrl?: string;
      idUploaded: boolean;
      idFile: string;
    }>
  >([]);
  const [showBeneficiaryForm, setShowBeneficiaryForm] = useState(false);
  const [beneficiaryForm, setBeneficiaryForm] = useState<{
    name: string;
    surname: string;
    relationship: string;
    idNumber: string;
    age: string;
    gender: string;
    idFile: File | null;
    photoFile: File | null;
  }>({
    name: "",
    surname: "",
    relationship: "",
    idNumber: "",
    age: "",
    gender: "",
    idFile: null,
    photoFile: null,
  });
  const [beneficiaryNotice, setBeneficiaryNotice] = useState<string | null>(null);
  const [isAddingBeneficiary, setIsAddingBeneficiary] = useState(false);
  const [meetingsList, setMeetingsList] = useState<
    Array<{
      _id: string;
      title: string;
      date: string;
      description: string;
      acceptedCount: number;
      declinedCount: number;
    }>
  >([]);
  const [decisions, setDecisions] = useState(initialDecisions);
  const [rsvpState, setRsvpState] = useState<Record<string, { status: string; reason: string }>>({});
  const [rentalForm, setRentalForm] = useState({
    type: "car",
    item: "",
    date: "",
    notes: "",
    // Extended validated fields
    equipmentCategory: "car",
    quantity: 1,
    startDate: "",
    endDate: "",
  });
  const [rentalAvailability, setRentalAvailability] = useState<{
    checked: boolean;
    available: boolean;
    availableQty: number;
    message: string | null;
  }>({ checked: false, available: true, availableQty: 0, message: null });
  const [rentalTotalCost, setRentalTotalCost] = useState(0);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [supportForm, setSupportForm] = useState({ funeralOf: "", supportType: "", notes: "" });
  const [memberSummary, setMemberSummary] = useState({
    name: "Current member",
    memberNumber: "MEM-0001",
    points: 0,
    role: "member",
    email: "",
  });

  const [totalPaid, setTotalPaid] = useState(0);
  const [myFines, setMyFines] = useState<Array<{ _id: string; amount: number; reason: string; date: string; status: string }>>([]);
  const remainingBeneficiaries = Math.max(0, 15 - beneficiaryList.length);
  const [attendanceSummary, setAttendanceSummary] = useState({ attended: 7, total: 9 });
  const attendanceRate = attendanceSummary.total
    ? Math.round((attendanceSummary.attended / attendanceSummary.total) * 100)
    : 0;
  const attendanceReward = "10% additional payout if attendance stays above 80%";

  const RENTAL_CATALOG = [
    { id: "tent", label: "Tent", type: "equipment" as const, pricePerUnit: 350, priceUnit: "per day", maxStock: 5 },
    { id: "chair", label: "Chairs", type: "equipment" as const, pricePerUnit: 10, priceUnit: "per chair/day", maxStock: 100 },
    { id: "table", label: "Tables", type: "equipment" as const, pricePerUnit: 25, priceUnit: "per table/day", maxStock: 30 },
    { id: "car", label: "Funeral car", type: "car" as const, pricePerUnit: 800, priceUnit: "per day", maxStock: 2 },
  ];

  const selectedCatalogItem = RENTAL_CATALOG.find((c) => c.id === rentalForm.equipmentCategory);

  const meetingDays = useMemo(() => {
    return meetingsList
      .map((meeting) => {
        const parsed = new Date(meeting.date);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.getDate();
        }
        const fallback = Number(meeting.date.split(" ")[0]);
        return Number.isFinite(fallback) ? fallback : null;
      })
      .filter((value): value is number => Number.isFinite(value));
  }, [meetingsList]);

  const calendarDays = Array.from({ length: 30 }, (_, index) => index + 1);
  const isHttpUrl = (value?: string) => Boolean(value && value.startsWith("http"));

  // Auto-calculate rental total cost
  const calculatedRentalCost = useMemo(() => {
    const item = RENTAL_CATALOG.find((c) => c.id === rentalForm.equipmentCategory);
    if (!item || !rentalForm.startDate || !rentalForm.endDate) return 0;
    const start = new Date(rentalForm.startDate);
    const end = new Date(rentalForm.endDate);
    if (end < start) return 0;
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return item.pricePerUnit * rentalForm.quantity * days;
  }, [rentalForm.equipmentCategory, rentalForm.quantity, rentalForm.startDate, rentalForm.endDate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          beneficiaryRes,
          meetingRes,
          contributionRes,
          attendanceRes,
          decisionsRes,
          summaryRes,
          finesRes,
        ] = await Promise.all([
          fetch("/api/beneficiaries/list"),
          fetch("/api/meetings/list"),
          fetch("/api/contributions/summary"),
          fetch("/api/attendance/summary"),
          fetch("/api/decisions/list"),
          fetch("/api/users/summary"),
          fetch("/api/fines/my"),
        ]);

        if (beneficiaryRes.ok) {
          const data = (await beneficiaryRes.json()) as {
            items?: Array<{
              name: string;
              surname?: string;
              relationship: string;
              idNumber: string;
              age?: number;
              gender?: string;
              idDocumentUrl?: string | null;
              photoUrl?: string | null;
            }>;
          };
          if (data.items?.length) {
            setBeneficiaryList(
              data.items.map((person) => ({
                ...person,
                idUploaded: Boolean(person.idDocumentUrl),
                idFile: person.idDocumentUrl ?? "",
                photoUrl: person.photoUrl ?? "",
              })),
            );
          }
        }

        if (meetingRes.ok) {
          const data = (await meetingRes.json()) as {
            items?: Array<{
              _id: string;
              title: string;
              date: string;
              description?: string;
              acceptedCount?: number;
              declinedCount?: number;
              memberStatus?: "accept" | "decline";
              memberReason?: string;
            }>;
          };
          if (data.items?.length) {
            setMeetingsList(
              data.items.map((meeting) => ({
                _id: meeting._id,
                title: meeting.title,
                date: meeting.date,
                description:
                  meeting.description ??
                  "Agenda and RSVP details have been shared by the admin team.",
                acceptedCount: meeting.acceptedCount ?? 0,
                declinedCount: meeting.declinedCount ?? 0,
              })),
            );
            setRsvpState(
              data.items.reduce<Record<string, { status: string; reason: string }>>((acc, meeting) => {
                if (meeting.memberStatus) {
                  acc[meeting.title] = {
                    status: meeting.memberStatus,
                    reason: meeting.memberReason ?? "",
                  };
                }
                return acc;
              }, {}),
            );
          }
        }

        if (contributionRes.ok) {
          const data = (await contributionRes.json()) as { totalPaid?: number };
          if (typeof data.totalPaid === "number") {
            setTotalPaid(data.totalPaid);
          }
        }

        if (attendanceRes.ok) {
          const data = (await attendanceRes.json()) as { attended?: number; total?: number };
          if (typeof data.attended === "number" && typeof data.total === "number") {
            setAttendanceSummary({ attended: data.attended, total: data.total });
          }
        }

        if (decisionsRes.ok) {
          const data = (await decisionsRes.json()) as {
            items?: Array<{
              externalId: string;
              title: string;
              description: string;
              yesVotes: number;
              noVotes: number;
            }>;
          };
          if (data.items?.length) {
            setDecisions(
              data.items.map((item) => ({
                id: item.externalId,
                title: item.title,
                description: item.description,
                yes: item.yesVotes,
                no: item.noVotes,
              })),
            );
          }
        }

        if (summaryRes.ok) {
          const data = (await summaryRes.json()) as {
            user?: { name?: string; memberNumber?: string; points?: number; role?: string; email?: string };
          };
          if (data.user) {
            setMemberSummary({
              name: data.user.name ?? "Member",
              memberNumber: data.user.memberNumber ?? "MEM-0001",
              points: data.user.points ?? 0,
              role: data.user.role ?? "member",
              email: data.user.email ?? "",
            });
          }
        }
        if (finesRes.ok) {
          const data = (await finesRes.json()) as {
            items?: Array<{ _id: string; amount: number; reason: string; date: string; status: string }>;
          };
          if (data.items?.length) {
            setMyFines(data.items);
          }
        }
      } catch {
        // keep empty state until Convex responds
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("dashboardLayout");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          showBeneficiaries?: boolean;
          showMeetings?: boolean;
          showAttendance?: boolean;
          showVoting?: boolean;
          showMembershipCard?: boolean;
          showRentalsSupport?: boolean;
        };
        setShowBeneficiaries(parsed.showBeneficiaries ?? true);
        setShowMeetings(parsed.showMeetings ?? true);
        setShowAttendance(parsed.showAttendance ?? true);
        setShowVoting(parsed.showVoting ?? true);
        setShowMembershipCard(parsed.showMembershipCard ?? true);
        setShowRentalsSupport(parsed.showRentalsSupport ?? true);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "dashboardLayout",
      JSON.stringify({
        showBeneficiaries,
        showMeetings,
        showAttendance,
        showVoting,
        showMembershipCard,
        showRentalsSupport,
      }),
    );
  }, [
    showBeneficiaries,
    showMeetings,
    showAttendance,
    showVoting,
    showMembershipCard,
    showRentalsSupport,
  ]);

  const handleRequestPayment = async () => {
    setBroadcastMessage(null);
    try {
      const response = await fetch("/api/decisions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalId: "request-payment",
          title: "Request for Payment",
          description: "A beneficiary has passed away. Member voting is required.",
        }),
      });
      const data = (await response.json()) as { message?: string };
      setBroadcastMessage(
        data.message ?? "Request for Payment has been broadcast to all members and the admin team.",
      );
    } catch {
      setBroadcastMessage("Request for Payment queued locally. Connect Convex to broadcast.");
    }
  };

  const handleBeneficiaryRemoval = async (idNumber: string) => {
    setBeneficiaryList((prev) => prev.filter((person) => person.idNumber !== idNumber));
    try {
      await fetch("/api/beneficiaries/mark-deceased", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idNumber }),
      });
    } catch {
      // keep local state change
    }
  };

  const uploadToStorage = async (file: File, endpoint: string) => {
    const uploadUrlRes = await fetch(endpoint, { method: "POST" });
    const uploadUrlData = (await uploadUrlRes.json()) as { uploadUrl?: string };
    if (!uploadUrlRes.ok || !uploadUrlData.uploadUrl) {
      throw new Error("Upload URL not available.");
    }
    const uploadRes = await fetch(uploadUrlData.uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const uploadResult = (await uploadRes.json()) as { storageId?: string };
    if (!uploadResult.storageId) {
      throw new Error("Storage id missing.");
    }
    return uploadResult.storageId;
  };

  const handleBeneficiaryUpload = async (idNumber: string, file: File | null) => {
    if (!file) {
      return;
    }
    try {
      const storageId = await uploadToStorage(file, "/api/beneficiaries/upload-id-url");
      await fetch("/api/beneficiaries/upload-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idNumber, storageId }),
      });
      setBeneficiaryList((prev) =>
        prev.map((person) =>
          person.idNumber === idNumber
            ? { ...person, idUploaded: true, idFile: "Uploaded" }
            : person,
        ),
      );
      setBeneficiaryNotice("ID copy uploaded successfully.");
    } catch {
      setBeneficiaryNotice("ID upload failed. Please try again.");
    }
  };

  const handleBeneficiaryPhotoUpload = async (idNumber: string, file: File | null) => {
    if (!file) {
      return;
    }
    try {
      const storageId = await uploadToStorage(file, "/api/beneficiaries/upload-photo-url");
      await fetch("/api/beneficiaries/upload-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idNumber, storageId }),
      });
      setBeneficiaryList((prev) =>
        prev.map((person) =>
          person.idNumber === idNumber ? { ...person, photoUrl: "Uploaded" } : person,
        ),
      );
      setBeneficiaryNotice("Beneficiary photo uploaded successfully.");
    } catch {
      setBeneficiaryNotice("Photo upload failed. Please try again.");
    }
  };

  const handleAddBeneficiary = async () => {
    if (isAddingBeneficiary) {
      return;
    }
    setIsAddingBeneficiary(true);
    setBeneficiaryNotice(null);
    if (beneficiaryList.length >= 15) {
      setBeneficiaryNotice("You have reached the maximum of 15 beneficiaries.");
      setIsAddingBeneficiary(false);
      return;
    }
    if (!beneficiaryForm.name || !beneficiaryForm.surname || !beneficiaryForm.idNumber || !beneficiaryForm.relationship) {
      setBeneficiaryNotice("Please fill in name, surname, ID number, and relationship.");
      setIsAddingBeneficiary(false);
      return;
    }
    if (!beneficiaryForm.idFile || !beneficiaryForm.photoFile) {
      setBeneficiaryNotice("Please upload both the ID document and a photo.");
      setIsAddingBeneficiary(false);
      return;
    }
    const parsedAge = beneficiaryForm.age ? Number(beneficiaryForm.age) : undefined;
    if (beneficiaryForm.age && !Number.isFinite(parsedAge)) {
      setBeneficiaryNotice("Age must be a number.");
      setIsAddingBeneficiary(false);
      return;
    }
    let idStorageId: string | undefined;
    let photoStorageId: string | undefined;
    try {
      idStorageId = await uploadToStorage(beneficiaryForm.idFile, "/api/beneficiaries/upload-id-url");
      photoStorageId = await uploadToStorage(beneficiaryForm.photoFile, "/api/beneficiaries/upload-photo-url");
    } catch {
      setBeneficiaryNotice("Unable to upload files. Please try again.");
      setIsAddingBeneficiary(false);
      return;
    }
    const payload = {
      name: beneficiaryForm.name.trim(),
      surname: beneficiaryForm.surname.trim(),
      idNumber: beneficiaryForm.idNumber.trim(),
      relationship: beneficiaryForm.relationship.trim(),
      age: parsedAge,
      gender: beneficiaryForm.gender || undefined,
      idDocumentUrl: idStorageId,
      photoUrl: photoStorageId,
    };
    try {
      const response = await fetch("/api/beneficiaries/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { message?: string };
      if (response.ok) {
        setBeneficiaryList((prev) => [
          ...prev,
          {
            name: payload.name,
            surname: payload.surname,
            relationship: payload.relationship,
            idNumber: payload.idNumber,
            age: payload.age,
            gender: payload.gender,
            photoUrl: payload.photoUrl,
            idUploaded: true,
            idFile: "Uploaded",
          },
        ]);
        setBeneficiaryForm({
          name: "",
          surname: "",
          relationship: "",
          idNumber: "",
          age: "",
          gender: "",
          idFile: null,
          photoFile: null,
        });
        setShowBeneficiaryForm(false);
        setBeneficiaryNotice("Beneficiary added.");
      } else {
        setBeneficiaryNotice(data.message ?? "Unable to add beneficiary.");
      }
    } catch {
      setBeneficiaryNotice("Unable to add beneficiary right now.");
    } finally {
      setIsAddingBeneficiary(false);
    }
  };

  const handleDeleteBeneficiary = async (idNumber: string) => {
    setBeneficiaryList((prev) => prev.filter((person) => person.idNumber !== idNumber));
    try {
      await fetch("/api/beneficiaries/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idNumber }),
      });
      setBeneficiaryNotice("Beneficiary removed.");
    } catch {
      setBeneficiaryNotice("Beneficiary removed locally. Connect Convex to persist.");
    }
  };

  const handleVote = async (id: string, vote: "yes" | "no") => {
    setDecisions((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              yes: vote === "yes" ? item.yes + 1 : item.yes,
              no: vote === "no" ? item.no + 1 : item.no,
            }
          : item,
      ),
    );
    setVotingNotice(`Your vote was recorded as ${vote.toUpperCase()}.`);
    try {
      await fetch("/api/decisions/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalId: id, vote }),
      });
    } catch {
      setVotingNotice("Your vote was recorded locally. It will sync once online.");
    }
  };

  const handleRsvp = async (meetingTitle: string, status: "accept" | "decline") => {
    setRsvpState((prev) => ({
      ...prev,
      [meetingTitle]: {
        status,
        reason: prev[meetingTitle]?.reason ?? "",
      },
    }));
    setMeetingNotice(`You have ${status === "accept" ? "accepted" : "declined"} the meeting: ${meetingTitle}.`);
    try {
      await fetch("/api/meetings/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingTitle, status }),
      });
    } catch {
      setMeetingNotice("Your RSVP was saved locally. It will sync once online.");
    }
  };

  const handleRsvpReason = async (meetingTitle: string, reason: string) => {
    setRsvpState((prev) => ({
      ...prev,
      [meetingTitle]: {
        status: "decline",
        reason,
      },
    }));
    setMeetingNotice("Your reason for declining has been saved.");
    try {
      await fetch("/api/meetings/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingTitle, status: "decline", reason }),
      });
    } catch {
      setMeetingNotice("Your decline reason was saved locally. It will sync once online.");
    }
  };

  const handleContribution = async () => {
    setContributionNotice(null);
    try {
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 380,
          email: memberSummary.email,
          month: new Date().toISOString().slice(0, 7), // YYYY-MM
        }),
      });
      const data = (await response.json()) as { ok: boolean; message: string; data?: { authorization_url: string } };
      if (data.ok && data.data?.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        setContributionNotice(data.message ?? "Failed to initialize payment.");
      }
    } catch {
      setContributionNotice("Failed to initialize payment. Please try again.");
    }
  };

  const handleAttendanceLog = async () => {
    setAttendanceNotice(null);
    try {
      const response = await fetch("/api/attendance/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberName: memberSummary.name,
          meetingTitle: meetingsList[0]?.title ?? "General meeting",
          date: new Date().toISOString(),
          status: "attended",
        }),
      });
      const data = (await response.json()) as { message?: string; pointsAdded?: number };
      setAttendanceNotice(data.message ?? "Attendance recorded.");
      const pointsAdded = data.pointsAdded;
    if (typeof pointsAdded === "number" && pointsAdded > 0) {
      setMemberSummary((prev) => ({ ...prev, points: prev.points + pointsAdded }));
    }
    } catch {
      setAttendanceNotice("Attendance noted locally. Connect Convex to persist.");
    }
  };

  const handleCheckAvailability = async () => {
    setIsCheckingAvailability(true);
    setRentalAvailability({ checked: false, available: true, availableQty: 0, message: null });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!rentalForm.startDate || !rentalForm.endDate) {
      setRentalAvailability({ checked: true, available: false, availableQty: 0, message: "Please enter start and end dates." });
      setIsCheckingAvailability(false);
      return;
    }
    const start = new Date(rentalForm.startDate);
    const end = new Date(rentalForm.endDate);
    if (start < today) {
      setRentalAvailability({ checked: true, available: false, availableQty: 0, message: "Start date cannot be in the past." });
      setIsCheckingAvailability(false);
      return;
    }
    if (end < start) {
      setRentalAvailability({ checked: true, available: false, availableQty: 0, message: "End date must be after start date." });
      setIsCheckingAvailability(false);
      return;
    }
    try {
      const response = await fetch("/api/rentals/check-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentCategory: rentalForm.equipmentCategory,
          startDate: rentalForm.startDate,
          endDate: rentalForm.endDate,
          quantity: rentalForm.quantity,
        }),
      });
      const data = (await response.json()) as { ok: boolean; available: boolean; availableQty?: number; message?: string };
      setRentalAvailability({
        checked: true,
        available: data.available ?? false,
        availableQty: data.availableQty ?? 0,
        message: data.message ?? (data.available ? "Available! You can proceed." : "Not available for those dates."),
      });
    } catch {
      setRentalAvailability({ checked: true, available: true, availableQty: 0, message: "Could not check availability. You can still submit the request." });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleRentalRequest = async () => {
    setRentalNotice(null);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!rentalForm.startDate || !rentalForm.endDate) {
      setRentalNotice("Please select start and end dates.");
      return;
    }
    if (new Date(rentalForm.startDate) < today) {
      setRentalNotice("Start date cannot be in the past.");
      return;
    }
    if (new Date(rentalForm.endDate) < new Date(rentalForm.startDate)) {
      setRentalNotice("End date must be on or after start date.");
      return;
    }
    if (rentalForm.quantity < 1) {
      setRentalNotice("Quantity must be at least 1.");
      return;
    }
    try {
      const response = await fetch("/api/rentals/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentCategory: rentalForm.equipmentCategory,
          quantity: rentalForm.quantity,
          startDate: rentalForm.startDate,
          endDate: rentalForm.endDate,
          notes: rentalForm.notes,
        }),
      });
      const data = (await response.json()) as { ok: boolean; message?: string };
      setRentalNotice(data.message ?? (data.ok ? "Rental request submitted." : "Submission failed."));
      if (data.ok) {
        setRentalForm({ type: "car", item: "", date: "", notes: "", equipmentCategory: "car", quantity: 1, startDate: "", endDate: "" });
        setRentalAvailability({ checked: false, available: true, availableQty: 0, message: null });
      }
    } catch {
      setRentalNotice("Network error. Please try again.");
    }
  };

  const handleSupportRequest = async () => {
    setSupportNotice(null);
    try {
      const response = await fetch("/api/supports/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supportForm),
      });
      const data = (await response.json()) as { message?: string };
      setSupportNotice(data.message ?? "Group support request submitted.");
      setSupportForm({ funeralOf: "", supportType: "", notes: "" });
    } catch {
      setSupportNotice("Group support saved locally. Connect Convex to persist.");
    }
  };

  return (
    <SiteShell currentPath="/dashboard" eyebrow="Member command centre">
      <main className="section-shell mt-8 grid gap-6">
        <section className="grid gap-6">
          <Card className="relative overflow-hidden rounded-[40px] px-7 py-8 lg:px-10 lg:py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(120,120,120,0.16),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.95),rgba(228,228,224,0.88))]" />
            <div className="relative z-10 ornate-border memorial-shell p-6 sm:p-9 lg:p-10">
              <h2 className="mt-2 max-w-3xl font-display text-4xl text-zinc-950 sm:text-5xl">
                Track your contribution, beneficiaries, claims, and meetings in one place.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-600">
                Your live data will appear here as soon as your membership is approved and activity is recorded.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button onClick={handleRequestPayment}>Request for Payment</Button>
                <Button variant="secondary" onClick={handleContribution}>
                  Make monthly contribution
                </Button>
                <Button variant="secondary" onClick={() => setCustomize((prev) => !prev)}>
                  {customize ? "Close customization" : "Customize dashboard"}
                </Button>
              </div>
              {broadcastMessage ? (
                <p className="mt-4 text-sm text-zinc-600">{broadcastMessage}</p>
              ) : null}
              {contributionNotice ? (
                <p className="mt-2 text-sm text-zinc-600">{contributionNotice}</p>
              ) : null}
              <div className="mt-9 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[26px] border border-zinc-200/80 bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-[0.26em] text-zinc-500">Total paid</p>
                  <p className="mt-3 text-3xl font-semibold text-zinc-950">R{totalPaid}</p>
                  <p className="mt-2 text-sm text-zinc-500">Live contributions from Convex</p>
                </div>
                <div className="rounded-[26px] border border-zinc-200/80 bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-[0.26em] text-zinc-500">Remaining beneficiaries</p>
                  <p className="mt-3 text-3xl font-semibold text-zinc-950">{remainingBeneficiaries}</p>
                  <p className="mt-2 text-sm text-zinc-500">Up to 15 allowed</p>
                </div>
                <div className="rounded-[26px] border border-zinc-200/80 bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-[0.26em] text-zinc-500">Attendance rate</p>
                  <p className="mt-3 text-3xl font-semibold text-zinc-950">{attendanceRate}%</p>
                  <p className="mt-2 text-sm text-zinc-500">Based on meeting logs</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {customize ? (
          <Card className="rounded-4xl">
            <Pill>Dashboard layout</Pill>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={showBeneficiaries}
                  onChange={(event) => setShowBeneficiaries(event.target.checked)}
                />
                Show beneficiaries
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={showMeetings}
                  onChange={(event) => setShowMeetings(event.target.checked)}
                />
                Show meetings calendar
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={showAttendance}
                  onChange={(event) => setShowAttendance(event.target.checked)}
                />
                Show attendance rewards
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={showVoting}
                  onChange={(event) => setShowVoting(event.target.checked)}
                />
                Show voting panel
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={showMembershipCard}
                  onChange={(event) => setShowMembershipCard(event.target.checked)}
                />
                Show membership card
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={showRentalsSupport}
                  onChange={(event) => setShowRentalsSupport(event.target.checked)}
                />
                Show rentals and support
              </label>
            </div>
          </Card>
        ) : null}

        {showMembershipCard ? (
          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-4xl memorial-shell ornate-border">
              <Pill>Virtual membership card</Pill>
              <div className="mt-4 grid gap-4 sm:grid-cols-[0.7fr_1.3fr]">
                <div className="rounded-[26px] border border-[rgba(122,99,67,0.3)] bg-white/85 p-5">
                  <p className="text-xs uppercase tracking-[0.26em] text-zinc-500">Member name</p>
                  <p className="mt-3 text-2xl font-semibold text-zinc-900">{memberSummary.name}</p>
                  <p className="mt-4 text-xs uppercase tracking-[0.26em] text-zinc-500">Member number</p>
                  <p className="mt-2 text-sm text-zinc-700">{memberSummary.memberNumber}</p>
                  <div className="mt-4 rounded-full bg-zinc-900 px-4 py-2 text-center text-xs uppercase tracking-[0.32em] text-white">
                    {memberSummary.role}
                  </div>
                </div>
                <div className="rounded-[26px] border border-[rgba(122,99,67,0.3)] bg-white/85 p-5">
                  <p className="text-xs uppercase tracking-[0.26em] text-zinc-500">Points balance</p>
                  <p className="mt-3 text-4xl font-semibold text-zinc-900">{memberSummary.points}</p>
                  <p className="mt-3 text-sm text-zinc-600">
                    Points grow with attendance and timely contributions. Admins can add bonus points.
                  </p>
                  <div className="mt-5 flex items-center gap-3 text-xs uppercase tracking-[0.32em] text-zinc-500">
                    <span className="h-2 w-2 rounded-full bg-zinc-900" />
                    Active membership
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-4xl">
              <Pill>Live dashboard totals</Pill>
              <div className="mt-4 space-y-4">
                <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Total paid</p>
                  <p className="mt-3 text-3xl font-semibold text-zinc-950">R{totalPaid}</p>
                </div>
                <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Attendance rate</p>
                  <p className="mt-3 text-3xl font-semibold text-zinc-950">{attendanceRate}%</p>
                </div>
                <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Open votes</p>
                  <p className="mt-3 text-3xl font-semibold text-zinc-950">{decisions.length}</p>
                </div>
                <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Outstanding fines</p>
                  <p className="mt-3 text-3xl font-semibold text-zinc-950">
                    R{myFines.filter((f) => f.status === "unpaid").reduce((sum, f) => sum + f.amount, 0)}
                  </p>
                  {myFines.filter((f) => f.status === "unpaid").length ? (
                    <div className="mt-3 space-y-2">
                      {myFines.filter((f) => f.status === "unpaid").map((fine) => (
                        <p key={fine._id} className="text-sm text-zinc-600">R{fine.amount} – {fine.reason}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-500">No outstanding fines.</p>
                  )}
                </div>
              </div>
            </Card>
          </section>
        ) : null}

        {showBeneficiaries ? (
          <section className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-4xl lg:col-span-2 memorial-shell ornate-border">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-zinc-500" />
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Beneficiaries</p>
                <h3 className="mt-2 text-2xl font-semibold text-zinc-950">
                  Members added to the club as beneficiaries will appear here.
                </h3>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-zinc-600">
                You can add {remainingBeneficiaries} more beneficiaries.
              </p>
              <Button
                variant="secondary"
                onClick={() => setShowBeneficiaryForm((prev) => !prev)}
                disabled={beneficiaryList.length >= 15}
              >
                {showBeneficiaryForm ? "Close form" : "Add beneficiary"}
              </Button>
            </div>
            {showBeneficiaryForm ? (
              <div className="mt-5 rounded-3xl border border-[rgba(122,99,67,0.2)] bg-white/90 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Name"
                    value={beneficiaryForm.name}
                    onChange={(event) => setBeneficiaryForm((prev) => ({ ...prev, name: event.target.value }))}
                  />
                  <Input
                    placeholder="Surname"
                    value={beneficiaryForm.surname}
                    onChange={(event) => setBeneficiaryForm((prev) => ({ ...prev, surname: event.target.value }))}
                  />
                  <Input
                    placeholder="Relationship"
                    value={beneficiaryForm.relationship}
                    onChange={(event) => setBeneficiaryForm((prev) => ({ ...prev, relationship: event.target.value }))}
                  />
                  <Input
                    placeholder="ID number"
                    value={beneficiaryForm.idNumber}
                    onChange={(event) => setBeneficiaryForm((prev) => ({ ...prev, idNumber: event.target.value }))}
                  />
                  <Input
                    placeholder="Age"
                    value={beneficiaryForm.age}
                    onChange={(event) => setBeneficiaryForm((prev) => ({ ...prev, age: event.target.value }))}
                  />
                  <select
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900"
                    value={beneficiaryForm.gender}
                    onChange={(event) => setBeneficiaryForm((prev) => ({ ...prev, gender: event.target.value }))}
                  >
                    <option value="">Gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                  <label className="text-xs text-zinc-600">
                    ID document
                    <Input
                      type="file"
                      className="mt-2"
                      onChange={(event) =>
                        setBeneficiaryForm((prev) => ({
                          ...prev,
                          idFile: event.target.files?.[0] ?? null,
                        }))
                      }
                    />
                  </label>
                  <label className="text-xs text-zinc-600">
                    Beneficiary photo
                    <Input
                      type="file"
                      className="mt-2"
                      onChange={(event) =>
                        setBeneficiaryForm((prev) => ({
                          ...prev,
                          photoFile: event.target.files?.[0] ?? null,
                        }))
                      }
                    />
                  </label>
                </div>
                <Button className="mt-4" onClick={handleAddBeneficiary} disabled={isAddingBeneficiary}>
                  {isAddingBeneficiary ? "Saving..." : "Save beneficiary"}
                </Button>
                {beneficiaryNotice ? (
                  <p className="mt-3 text-sm text-zinc-600">{beneficiaryNotice}</p>
                ) : null}
              </div>
            ) : null}
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {beneficiaryList.length ? (
                beneficiaryList.map((person) => (
                  <div
                    key={person.idNumber}
                    className="rounded-[26px] border border-white/80 bg-white/90 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative overflow-hidden rounded-[22px] border border-[rgba(122,99,67,0.25)] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),rgba(239,230,213,0.85))] px-4 pb-5 pt-6">
                      <div className="absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top,rgba(193,166,122,0.35),transparent_60%)]" />
                      <p className="relative text-center text-[0.65rem] uppercase tracking-[0.3em] text-zinc-500">
                        In loving memory of
                      </p>
                      <div className="relative mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(122,99,67,0.35)] bg-white text-lg font-semibold text-zinc-700">
                        {[person.name, person.surname]
                          .filter(Boolean)
                          .join(" ")
                          .split(" ")
                          .map((word) => word[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <h4 className="relative mt-4 text-center text-lg font-semibold text-zinc-900">
                        {[person.name, person.surname].filter(Boolean).join(" ")}
                      </h4>
                      <p className="relative mt-2 text-center text-sm text-zinc-600">
                        {person.relationship}
                      </p>
                      <p className="relative mt-2 text-center text-xs uppercase tracking-[0.22em] text-zinc-500">
                        {person.gender ? `${person.gender} • ${person.age ?? "Age n/a"}` : `Age ${person.age ?? "n/a"}`}
                      </p>
                      <p className="relative mt-4 text-center text-xs uppercase tracking-[0.22em] text-zinc-500">
                        ID Number
                      </p>
                      <p className="relative mt-2 text-center text-sm text-zinc-700">
                        {person.idNumber}
                      </p>
                    <div className="relative mt-4 rounded-[18px] border border-[rgba(122,99,67,0.2)] bg-white/80 px-3 py-2 text-xs text-zinc-600">
                      {person.idUploaded ? "ID uploaded" : "ID not uploaded"}
                    </div>
                    {person.idUploaded && isHttpUrl(person.idFile) ? (
                      <div className="mt-3 flex justify-center">
                        <a
                          href={person.idFile}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs uppercase tracking-[0.22em] text-zinc-600 underline"
                        >
                          View ID document
                        </a>
                      </div>
                    ) : null}
                      <div className="relative mt-3 rounded-[18px] border border-[rgba(122,99,67,0.2)] bg-white/80 px-3 py-2 text-xs text-zinc-600">
                      {person.photoUrl ? "Photo uploaded" : "Photo not uploaded"}
                    </div>
                    {isHttpUrl(person.photoUrl) ? (
                      <div className="mt-3 flex justify-center">
                        <img
                          src={person.photoUrl}
                            alt={`${person.name} ${person.surname ?? ""}`}
                            className="h-20 w-20 rounded-full object-cover"
                          />
                        </div>
                      ) : null}
                      <div className="relative mt-4 flex flex-col gap-2">
                        <label className="text-xs text-zinc-600">
                          Upload ID copy
                          <Input
                            type="file"
                            className="mt-2"
                          onChange={(event) =>
                            handleBeneficiaryUpload(
                              person.idNumber,
                              event.target.files?.[0] ?? null,
                            )
                          }
                          />
                        </label>
                        <label className="text-xs text-zinc-600">
                          Upload photo
                          <Input
                            type="file"
                            className="mt-2"
                          onChange={(event) =>
                            handleBeneficiaryPhotoUpload(
                              person.idNumber,
                              event.target.files?.[0] ?? null,
                            )
                          }
                          />
                        </label>
                        <Button
                          variant="secondary"
                          onClick={() => handleBeneficiaryRemoval(person.idNumber)}
                        >
                          Mark deceased
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleDeleteBeneficiary(person.idNumber)}
                        >
                          Delete beneficiary
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[26px] border border-zinc-200/80 bg-white/85 p-5 text-sm text-zinc-600">
                  No beneficiaries yet. Add the first beneficiary to start the list.
                </div>
              )}
            </div>
          </Card>

          <Card className="rounded-4xl">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-zinc-500" />
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Notifications</p>
                <h3 className="mt-2 text-2xl font-semibold text-zinc-950">SMS-ready updates</h3>
              </div>
            </div>
            <div className="mt-6">
              <div className="rounded-[22px] border border-zinc-200/80 bg-white/85 p-4">
                <p className="font-semibold text-zinc-950">No notifications yet</p>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  SMS notifications will appear here once the admin schedules meetings, claims, or reminders.
                </p>
              </div>
            </div>
          </Card>
          </section>
        ) : null}

        {showMeetings || showAttendance ? (
          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            {showMeetings ? (
          <Card className="rounded-4xl">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-6 w-6 text-zinc-500" />
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Upcoming meetings</p>
                <h3 className="mt-2 text-2xl font-semibold text-zinc-950">Calendar view</h3>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs text-zinc-500">
              {calendarDays.map((day) => (
                <div
                  key={day}
                  className={`rounded-full px-2 py-2 ${
                    meetingDays.includes(day)
                      ? "bg-zinc-900 text-white"
                      : "bg-white/80"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-4">
              {meetingNotice ? <p className="text-sm text-zinc-600">{meetingNotice}</p> : null}
              {meetingsList.map((meeting) => {
                const rsvp = rsvpState[meeting.title];
                const isDecline = rsvp?.status === "decline";
                return (
                  <div key={meeting.title} className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-zinc-950">{meeting.title}</p>
                        <p className="mt-1 text-sm text-zinc-500">{meeting.date}</p>
                      </div>
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs uppercase tracking-[0.24em] text-zinc-500">
                        RSVP {rsvp?.status ?? "open"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-zinc-600">{meeting.description}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Accepted {meeting.acceptedCount} · Declined {meeting.declinedCount}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button onClick={() => handleRsvp(meeting.title, "accept")}>Accept</Button>
                      <Button variant="secondary" onClick={() => handleRsvp(meeting.title, "decline")}>Decline</Button>
                    </div>
                    {rsvp?.status === "accept" ? (
                      <p className="mt-3 text-sm text-zinc-600">Meeting accepted.</p>
                    ) : null}
                    {isDecline ? (
                      <Textarea
                        className="mt-4"
                        placeholder="Reason for not attending"
                        value={rsvp?.reason ?? ""}
                        onChange={(event) => handleRsvpReason(meeting.title, event.target.value)}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>
            ) : null}

            {showAttendance ? (
          <Card className="rounded-4xl">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Thathumusa logo" width={24} height={24} className="rounded-md" />
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Attendance and rewards</p>
                <h3 className="mt-2 text-2xl font-semibold text-zinc-950">Attendance performance</h3>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Meetings attended</p>
                <p className="mt-3 text-3xl font-semibold text-zinc-950">
                  {attendanceSummary.attended} / {attendanceSummary.total}
                </p>
                <p className="mt-2 text-sm text-zinc-500">Attendance rate: {attendanceRate}%</p>
                <Button variant="secondary" className="mt-4" onClick={handleAttendanceLog}>
                  Log attendance
                </Button>
                {attendanceNotice ? (
                  <p className="mt-2 text-sm text-zinc-600">{attendanceNotice}</p>
                ) : null}
              </div>
              <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Reward policy</p>
                <p className="mt-3 text-sm leading-7 text-zinc-600">
                  {attendanceReward}
                </p>
              </div>
              <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-zinc-500" />
                  <p className="font-semibold text-zinc-950">Eligible for attendance bonus</p>
                </div>
                <p className="mt-2 text-sm text-zinc-600">
                  Keep attendance above 80% to unlock the 10% benefit on payouts.
                </p>
              </div>
            </div>
          </Card>
            ) : null}
        </section>
        ) : null}

        {showVoting ? (
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-4xl">
            <div className="flex items-center gap-3">
              <LayoutGrid className="h-6 w-6 text-zinc-500" />
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Member voting</p>
                <h3 className="mt-2 text-2xl font-semibold text-zinc-950">Decisions awaiting votes</h3>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {votingNotice ? <p className="text-sm text-zinc-600">{votingNotice}</p> : null}
              {decisions.length ? (
                decisions.map((decision) => (
                  <div key={decision.id} className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                    <p className="font-semibold text-zinc-950">{decision.title}</p>
                    <p className="mt-2 text-sm text-zinc-600">{decision.description}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button onClick={() => handleVote(decision.id, "yes")}>Vote yes</Button>
                      <Button variant="secondary" onClick={() => handleVote(decision.id, "no")}>Vote no</Button>
                      <div className="ml-auto flex items-center gap-3 text-sm text-zinc-600">
                        <span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" />{decision.yes}</span>
                        <span className="flex items-center gap-1"><ThumbsDown className="h-4 w-4" />{decision.no}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                  <p className="font-semibold text-zinc-950">No open votes yet</p>
                  <p className="mt-2 text-sm text-zinc-600">
                    Voting requests will appear here once a claim or decision is opened.
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="rounded-4xl">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Thathumusa logo" width={24} height={24} className="rounded-md" />
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Counselling and support</p>
                <h3 className="mt-2 text-2xl font-semibold text-zinc-950">Support extends beyond finances</h3>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-zinc-500" />
                  <p className="font-semibold text-zinc-950">Next payment</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-600">Pay R380 monthly through Paystack once your live public and secret keys are connected.</p>
              </div>
              <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-zinc-500" />
                  <p className="font-semibold text-zinc-950">Claim checklist</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-600">Request for Payment requires the beneficiary ID and death certificate before member voting starts.</p>
              </div>
              <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                <p className="font-semibold text-zinc-950">Counselling access</p>
                <p className="mt-2 text-sm text-zinc-500">Member wellbeing</p>
                <p className="mt-3 text-sm leading-7 text-zinc-600">
                  Access counselling resources and request support from the admin team.
                </p>
              </div>
              <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-4">
                <p className="font-semibold text-zinc-950">Transportation support</p>
                <p className="mt-2 text-sm text-zinc-500">Funeral logistics</p>
                <p className="mt-3 text-sm leading-7 text-zinc-600">
                  Request funeral transport rentals and coordinate pickup details.
                </p>
              </div>
            </div>
          </Card>
        </section>
        ) : null}

        {showRentalsSupport ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-4xl">
            <Pill>Car and equipment rental</Pill>
            <div className="mt-4 grid gap-3">
              {/* Step 1 – Equipment type dropdown */}
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.24em] text-zinc-500">Equipment type</label>
                <select
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900"
                  value={rentalForm.equipmentCategory}
                  onChange={(event) => {
                    const cat = event.target.value;
                    const item = RENTAL_CATALOG.find((c) => c.id === cat);
                    setRentalForm((prev) => ({ ...prev, equipmentCategory: cat, type: item?.type ?? "equipment" }));
                    setRentalAvailability({ checked: false, available: true, availableQty: 0, message: null });
                  }}
                >
                  {RENTAL_CATALOG.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </div>

              {/* Step 2 – Price display */}
              {selectedCatalogItem ? (
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Price</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-900">R{selectedCatalogItem.pricePerUnit} <span className="text-sm font-normal text-zinc-500">{selectedCatalogItem.priceUnit}</span></p>
                  <p className="mt-1 text-xs text-zinc-500">Max available: {selectedCatalogItem.maxStock}</p>
                </div>
              ) : null}

              {/* Step 3 – Quantity */}
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.24em] text-zinc-500">Quantity</label>
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={String(rentalForm.quantity)}
                  min="1"
                  max={String(selectedCatalogItem?.maxStock ?? 100)}
                  onChange={(event) => {
                    const q = Math.max(1, Number(event.target.value));
                    setRentalForm((prev) => ({ ...prev, quantity: q }));
                    setRentalAvailability({ checked: false, available: true, availableQty: 0, message: null });
                  }}
                />
              </div>

              {/* Step 4 – Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.24em] text-zinc-500">Start date</label>
                  <Input
                    type="date"
                    value={rentalForm.startDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(event) => {
                      setRentalForm((prev) => ({ ...prev, startDate: event.target.value }));
                      setRentalAvailability({ checked: false, available: true, availableQty: 0, message: null });
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.24em] text-zinc-500">End date</label>
                  <Input
                    type="date"
                    value={rentalForm.endDate}
                    min={rentalForm.startDate || new Date().toISOString().split("T")[0]}
                    onChange={(event) => {
                      setRentalForm((prev) => ({ ...prev, endDate: event.target.value }));
                      setRentalAvailability({ checked: false, available: true, availableQty: 0, message: null });
                    }}
                  />
                </div>
              </div>

              {/* Step 5 – Auto-calculated total */}
              {calculatedRentalCost > 0 ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-700">Estimated total</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-900">R{calculatedRentalCost}</p>
                  <p className="mt-1 text-xs text-emerald-700">
                    {rentalForm.quantity} × R{selectedCatalogItem?.pricePerUnit} ×{" "}
                    {Math.max(1, Math.ceil((new Date(rentalForm.endDate).getTime() - new Date(rentalForm.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)} day(s)
                  </p>
                </div>
              ) : null}

              <Textarea
                placeholder="Additional notes (optional)"
                value={rentalForm.notes}
                onChange={(event) => setRentalForm((prev) => ({ ...prev, notes: event.target.value }))}
              />

              {/* Step 6 – Check availability, then submit */}
              <Button
                variant="secondary"
                onClick={handleCheckAvailability}
                disabled={isCheckingAvailability || !rentalForm.startDate || !rentalForm.endDate}
              >
                {isCheckingAvailability ? "Checking..." : "Check availability"}
              </Button>

              {rentalAvailability.checked ? (
                <div className={`rounded-2xl px-4 py-3 ${rentalAvailability.available ? "border border-emerald-200 bg-emerald-50" : "border border-red-200 bg-red-50"}`}>
                  <p className={`text-sm ${rentalAvailability.available ? "text-emerald-800" : "text-red-700"}`}>
                    {rentalAvailability.message}
                  </p>
                </div>
              ) : null}

              <Button
                onClick={handleRentalRequest}
                disabled={rentalAvailability.checked && !rentalAvailability.available}
              >
                Submit rental request
              </Button>
              {rentalNotice ? <p className="text-sm text-zinc-600">{rentalNotice}</p> : null}
            </div>
          </Card>

          <Card className="rounded-4xl">
            <Pill>Group support after funeral</Pill>
            <div className="mt-4 grid gap-3">
              <Input
                placeholder="Funeral of (name)"
                value={supportForm.funeralOf}
                onChange={(event) => setSupportForm((prev) => ({ ...prev, funeralOf: event.target.value }))}
              />
              <Input
                placeholder="Support type (food, transport, counselling, etc.)"
                value={supportForm.supportType}
                onChange={(event) => setSupportForm((prev) => ({ ...prev, supportType: event.target.value }))}
              />
              <Textarea
                placeholder="Additional notes"
                value={supportForm.notes}
                onChange={(event) => setSupportForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
              <Button onClick={handleSupportRequest}>Submit group support request</Button>
              {supportNotice ? <p className="text-sm text-zinc-600">{supportNotice}</p> : null}
            </div>
          </Card>
        </section>
        ) : null}

        <section>
          <MemberWorkflows />
        </section>
      </main>
    </SiteShell>
  );
}
