import { createHash } from "crypto";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

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
  const hash = await configuredPinHash();
  if (!hash) return false;
  const store = await cookies();
  return store.get("school_session")?.value === sessionValue(hash);
}
