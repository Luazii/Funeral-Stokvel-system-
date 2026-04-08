import { NextResponse } from "next/server";
import { hasSmsConfig } from "@/lib/notifications";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    phone?: string;
    message?: string;
  };

  if (!hasSmsConfig()) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "SMS credentials are not configured yet. Add the provider settings to enable live member notifications.",
        payload: body,
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "SMS notification endpoint is ready for live provider wiring.",
    payload: body,
  });
}
