import { NextResponse } from "next/server";
import { callQuery, getConvexClient } from "@/lib/convex-server";

const CATALOG: Record<string, { maxStock: number }> = {
  tent: { maxStock: 5 },
  chair: { maxStock: 100 },
  table: { maxStock: 30 },
  car: { maxStock: 2 },
};

export async function POST(request: Request) {
  const body = (await request.json()) as {
    equipmentCategory?: string;
    startDate?: string;
    endDate?: string;
    quantity?: number;
  };

  if (!body.equipmentCategory || !body.startDate || !body.endDate || !body.quantity) {
    return NextResponse.json(
      { ok: false, available: false, message: "Equipment type, dates, and quantity are required." },
      { status: 400 },
    );
  }

  // Date validation: no past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(body.startDate);
  const end = new Date(body.endDate);

  if (start < today) {
    return NextResponse.json({ ok: false, available: false, message: "Start date cannot be in the past." });
  }
  if (end < start) {
    return NextResponse.json({ ok: false, available: false, message: "End date must be after start date." });
  }

  const catalogItem = CATALOG[body.equipmentCategory];
  if (!catalogItem) {
    return NextResponse.json({ ok: false, available: false, message: "Unknown equipment type." });
  }

  const client = getConvexClient();
  if (!client) {
    // If Convex not configured, allow the request (will be validated server-side on submit)
    return NextResponse.json({ ok: true, available: true, availableQty: catalogItem.maxStock });
  }

  const booked = await callQuery<
    { equipmentCategory: string; startDate: string; endDate: string },
    number
  >(client, "rentals:getBookedQuantity", {
    equipmentCategory: body.equipmentCategory,
    startDate: body.startDate,
    endDate: body.endDate,
  });

  const availableQty = catalogItem.maxStock - (booked ?? 0);

  if (body.quantity > availableQty) {
    return NextResponse.json({
      ok: false,
      available: false,
      availableQty,
      message: `Only ${availableQty} available for those dates. You requested ${body.quantity}.`,
    });
  }

  return NextResponse.json({ ok: true, available: true, availableQty });
}
