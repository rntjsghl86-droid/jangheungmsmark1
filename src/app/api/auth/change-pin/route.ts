import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { authorized, database, pinHash, sessionValue } from "@/lib/server-auth";

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { adminPassword, newPin } = await request.json();
  const configuredAdmin = process.env.ADMIN_PASSWORD;
  if (!configuredAdmin) return NextResponse.json({ error: "관리자 비밀번호가 설정되지 않았습니다." }, { status: 503 });
  const expected = Buffer.from(configuredAdmin);
  const provided = Buffer.from(String(adminPassword || ""));
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return NextResponse.json({ error: "관리자 비밀번호가 올바르지 않습니다." }, { status: 403 });
  }
  if (!/^\d{4,12}$/.test(String(newPin || ""))) {
    return NextResponse.json({ error: "새 PIN은 숫자 4~12자리로 입력해 주세요." }, { status: 400 });
  }

  const client = database();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data: current, error: readError } = await client.from("school_app_state").select("data, updated_at").eq("id", "main").single();
    if (readError) throw readError;
    const hash = pinHash(String(newPin));
    const currentData = (current.data || {}) as Record<string, unknown>;
    const settings = { ...((currentData.settings || {}) as Record<string, unknown>), pinHash: hash };
    const nextData = { ...currentData, settings };
    const updatedAt = new Date(Date.now() + attempt).toISOString();
    const { data: updated, error } = await client.from("school_app_state").update({ data: nextData, updated_at: updatedAt }).eq("id", "main").eq("updated_at", current.updated_at).select("id").maybeSingle();
    if (error) throw error;
    if (updated) {
      const response = NextResponse.json({ ok: true });
      response.cookies.set("school_session", sessionValue(hash), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 12, path: "/" });
      return response;
    }
    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 30));
  }
  return NextResponse.json({ error: "다른 변경 작업과 겹쳤습니다. 다시 시도해 주세요." }, { status: 409 });
}
