import { createHash } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function authorized() {
  if (!process.env.SCHOOL_PIN) return false;
  const store = await cookies();
  const expected = createHash("sha256").update(`jangheung:${process.env.SCHOOL_PIN}`).digest("hex");
  return store.get("school_session")?.value === expected;
}

function database() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { data, error } = await database().from("school_app_state").select("data, updated_at").eq("id", "main").single();
    if (error) throw error;
    return NextResponse.json({ data: data.data, updatedAt: data.updated_at });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const { data, error } = await database().from("school_app_state").upsert({ id: "main", data: body, updated_at: new Date().toISOString() }).select("updated_at").single();
    if (error) throw error;
    return NextResponse.json({ ok: true, updatedAt: data.updated_at });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database error" }, { status: 500 });
  }
}
