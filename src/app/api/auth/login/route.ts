import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

const sessionValue = () => createHash("sha256").update(`jangheung:${process.env.SCHOOL_PIN}`).digest("hex");

export async function POST(request: Request) {
  const { pin } = await request.json();
  if (!process.env.SCHOOL_PIN) return NextResponse.json({ ok: false, error: "PIN is not configured" }, { status: 503 });
  const expected = Buffer.from(process.env.SCHOOL_PIN);
  const provided = Buffer.from(String(pin || ""));
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set("school_session", sessionValue(), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 12, path: "/" });
  return response;
}
