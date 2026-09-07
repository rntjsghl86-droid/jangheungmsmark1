import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { permissionsFrom, type Role } from "./permissions";

export function database() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const pinHash = (pin: string) => createHash("sha256").update(`jangheung-pin:${pin}`).digest("hex");
export const sessionValue = (hash: string) => createHash("sha256").update(`jangheung-session:${hash}`).digest("hex");

export async function configuredPinHash() {
  try {
    const { data } = await database().from("school_app_state").select("data").eq("id", "main").maybeSingle();
    const stored = (data?.data as { settings?: { pinHash?: string } } | null)?.settings?.pinHash;
    if (stored) return stored;
  } catch {
    // Initial deployments can still use the environment PIN before the database is ready.
  }
  return process.env.SCHOOL_PIN ? pinHash(process.env.SCHOOL_PIN) : null;
}

export async function authorized() {
  return (await currentRole()) !== null;
}

export function adminSession() {
  const secret = process.env.ADMIN_PIN;
  return secret ? createHmac("sha256", secret).update("jangheung-admin-session-v1").digest("hex") : null;
}
function equal(a: string | undefined, b: string | null) {
  return !!a && !!b && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
export async function configuredAdminPin() {
  const pin=process.env.ADMIN_PIN;
  if(!pin || !/^\d{4,12}$/.test(pin) || pinHash(pin)===await configuredPinHash())return null;
  return pin;
}
export async function currentRole(): Promise<Role | null> {
  const store = await cookies();
  if (equal(store.get("school_admin")?.value, adminSession()) && await configuredAdminPin()) return "admin";
  const hash = await configuredPinHash();
  return hash && equal(store.get("school_session")?.value, sessionValue(hash)) ? "teacher" : null;
}
export async function teacherPermissions() {
  const { data, error } = await database().from("school_app_state").select("data").eq("id", "main").single();
  if (error) throw error;
  return permissionsFrom(data.data?.settings?.teacherPermissions);
}
