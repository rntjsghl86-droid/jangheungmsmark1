import { NextResponse } from "next/server";
import { currentRole, teacherPermissions } from "@/lib/server-auth";
import { defaultPermissions } from "@/lib/permissions";

export async function GET() {
  const role = await currentRole();
  let permissions = defaultPermissions;
  if (role) { try { permissions = await teacherPermissions(); } catch { /* Fail closed. */ } }
  return NextResponse.json({ authenticated: !!role, role, permissions }, {headers:{"Cache-Control":"no-store"}});
}
