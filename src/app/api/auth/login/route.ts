import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { configuredPinHash, configuredAdminPin, pinHash, sessionValue, adminSession, teacherPermissions } from "@/lib/server-auth";
import { defaultPermissions } from "@/lib/permissions";

export async function POST(request: Request) {
  const { pin, role = "teacher" } = await request.json();
  if (role !== "teacher" && role !== "admin") return NextResponse.json({ok:false},{status:400});
  let permissions = defaultPermissions;
  try { permissions = await teacherPermissions(); } catch { /* Defaults deny destructive operations. */ }
  if (role === "admin") {
    const secret=await configuredAdminPin();
    if (!secret) return NextResponse.json({error:"교원 PIN과 다른 관리자 전용 PIN(숫자 4~12자리)을 설정해야 합니다."},{status:503});
    const a=Buffer.from(secret),b=Buffer.from(String(pin||""));
    if(a.length!==b.length||!timingSafeEqual(a,b))return NextResponse.json({ok:false},{status:401});
    const response=NextResponse.json({ok:true,role,permissions});
    response.cookies.set("school_admin",adminSession()!,{httpOnly:true,sameSite:"strict",secure:process.env.NODE_ENV==="production",maxAge:60*60*12,path:"/"});
    response.cookies.delete("school_session");
    return response;
  }
  const configured = await configuredPinHash();
  if (!configured) return NextResponse.json({ ok: false, error: "PIN is not configured" }, { status: 503 });
  const expected = Buffer.from(configured);
  const provided = Buffer.from(pinHash(String(pin || "")));
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true, role, permissions });
  response.cookies.delete("school_admin");
  response.cookies.set("school_session", sessionValue(configured), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 12, path: "/" });
  return response;
}
