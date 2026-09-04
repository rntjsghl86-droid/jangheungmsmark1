import { createHash } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const store = await cookies();
  if (!process.env.SCHOOL_PIN) return NextResponse.json({ authenticated: false });
  const expected = createHash("sha256").update(`jangheung:${process.env.SCHOOL_PIN}`).digest("hex");
  return NextResponse.json({ authenticated: store.get("school_session")?.value === expected });
}
