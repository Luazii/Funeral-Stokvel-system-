import { NextResponse } from "next/server";
import { callMutation, callQuery, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

const CATALOG: Record<string, { label: string; type: "car" | "equipment"; pricePerUnit: number; maxStock: number }> = {
  tent: { label: "Tent", type: "equipment", pricePerUnit: 350, maxStock: 5 },
  chair: { label: "Chairs", type: "equipment", pricePerUnit: 10, maxStock: 100 },
  table: { label: "Tables", type: "equipment", pricePerUnit: 25, maxStock: 30 },
  car: { label: "Funeral car", type: "car", pricePerUnit: 800, maxStock: 2 },
};

export async function POST(request: Request) {
  const body = (await request.json()) as {
    equipmentCategory?: string;
    quantity?: number;
    startDate?: string;
    endDate?: string;
    notes?: string;
  };

  const profile = await getCurrentUserProfile();
  if (!profile) {
    return NextResponse.json({ ok: false, message: "You must be signed in." }, { status: 401 });
  }

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json({ ok: false, message: "Convex is not configured." }, { status: 503 });
  }

  // — Validate required fields —
  if (!body.equipmentCategory || !body.quantity || !body.startDate || !body.endDate) {
    return NextResponse.json(
      { ok: false, message: "Equipment type, quantity, start date, and end date are required." },
      { status: 400 },
    );
  }

  const catalogItem = CATALOG[body.equipmentCategory];
  if (!catalogItem) {
    return NextResponse.json({ ok: false, message: "Invalid equipment type selected." }, { status: 400 });
  }

  // — Date validation —
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(body.startDate);
  const end = new Date(body.endDate);

  if (start < today) {
    return NextResponse.json({ ok: false, message: "Start date cannot be in the past." }, { status: 400 });
  }
  if (end < start) {
    return NextResponse.json({ ok: false, message: "End date must be on or after start date." }, { status: 400 });
  }

  // — Quantity validation —
  if (body.quantity < 1) {
    return NextResponse.json({ ok: false, message: "Quantity must be at least 1." }, { status: 400 });
  }
  if (body.quantity > catalogItem.maxStock) {
    return NextResponse.json(
      { ok: false, message: `Maximum available stock for ${catalogItem.label} is ${catalogItem.maxStock}.` },
      { status: 400 },
    );
  }

  // — Availability check —
  const booked = await callQuery<
    { equipmentCategory: string; startDate: string; endDate: string },
    number
  >(client, "rentals:getBookedQuantity", {
    equipmentCategory: body.equipmentCategory,
    startDate: body.startDate,
    endDate: body.endDate,
  });

  const available = catalogItem.maxStock - (booked ?? 0);
  if (body.quantity > available) {
    return NextResponse.json(
      {
        ok: false,
        message: `Only ${available} ${catalogItem.label}(s) available for those dates. You requested ${body.quantity}.`,
      },
      { status: 409 },
    );
  }

  // — Calculate cost —
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const totalCost = catalogItem.pricePerUnit * body.quantity * days;

  await callMutation(client, "rentals:create", {
    memberName: profile.name,
    type: catalogItem.type,
    item: catalogItem.label,
    date: body.startDate,
    notes: body.notes,
    equipmentCategory: body.equipmentCategory,
    quantity: body.quantity,
    pricePerUnit: catalogItem.pricePerUnit,
    totalCost,
    startDate: body.startDate,
    endDate: body.endDate,
    days,
  });

  return NextResponse.json({
    ok: true,
    message: `${catalogItem.label} rental booked for ${days} day(s). Total: R${totalCost}. Awaiting admin approval.`,
    totalCost,
    days,
  });
}
