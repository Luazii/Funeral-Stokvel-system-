import { NextResponse } from "next/server";

const CATALOG = [
  { id: "tent", label: "Tent", type: "equipment", pricePerUnit: 350, priceUnit: "per day", maxStock: 5 },
  { id: "chair", label: "Chairs", type: "equipment", pricePerUnit: 10, priceUnit: "per chair/day", maxStock: 100 },
  { id: "table", label: "Tables", type: "equipment", pricePerUnit: 25, priceUnit: "per table/day", maxStock: 30 },
  { id: "car", label: "Funeral car", type: "car", pricePerUnit: 800, priceUnit: "per day", maxStock: 2 },
];

export async function GET() {
  return NextResponse.json({ ok: true, items: CATALOG });
}
