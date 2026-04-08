import { NextResponse } from "next/server";
import { callMutation, callQuery, getConvexClient } from "@/lib/convex-server";
import { getCurrentUserProfile } from "@/lib/clerk-server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    surname?: string;
    idNumber?: string;
    relationship?: string;
    age?: number;
    gender?: string;
    idDocumentUrl?: string;
    photoUrl?: string;
  };

  const profile = await getCurrentUserProfile();
  if (!profile) {
    return NextResponse.json(
      { ok: false, message: "You must be signed in." },
      { status: 401 },
    );
  }

  const client = getConvexClient();
  if (!client) {
    return NextResponse.json(
      { ok: false, message: "Convex is not configured yet." },
      { status: 503 },
    );
  }

  if (!body.name || !body.surname || !body.idNumber || !body.relationship) {
    return NextResponse.json(
      { ok: false, message: "Name, surname, ID number, and relationship are required." },
      { status: 400 },
    );
  }

  const memberId =
    (await callMutation<unknown, string>(client, "users:ensure", {
      clerkId: profile.userId,
      name: profile.name,
      email: profile.email,
    })) ??
    (await callQuery<unknown, { _id: string } | null>(client, "users:getByClerkId", {
      clerkId: profile.userId,
    }))?._id;

  if (!memberId) {
    return NextResponse.json(
      { ok: false, message: "Member profile not found." },
      { status: 404 },
    );
  }

  try {
    await callMutation(client, "beneficiaries:create", {
      memberId,
      name: body.name,
      surname: body.surname,
      idNumber: body.idNumber,
      relationship: body.relationship,
      age: body.age,
      gender: body.gender,
      idDocumentUrl: body.idDocumentUrl,
      photoUrl: body.photoUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add beneficiary.";
    const status = message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ ok: false, message }, { status });
  }

  return NextResponse.json({ ok: true, message: "Beneficiary added." });
}
