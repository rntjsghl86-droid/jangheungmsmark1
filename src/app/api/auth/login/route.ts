import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { configuredPinHash, pinHash, sessionValue } from "@/lib/server-auth";

export async function POST(request: Request) {
  const { pin } = await request.json();
  const configured = await configuredPinHash();
  if (!configured) return NextResponse.json({ ok: false, error: "PIN is not configured" }, { status: 503 });
  const expected = Buffer.from(configured);
  const provided = Buffer.from(pinHash(String(pin || "")));
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set("school_session", sessionValue(configured), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 12, path: "/" });
  return response;
}
