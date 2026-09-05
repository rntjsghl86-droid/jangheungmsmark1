import { NextResponse } from "next/server";
import { authorized } from "@/lib/server-auth";

export async function GET() {
  return NextResponse.json({ authenticated: await authorized() });
}
