import { NextResponse } from "next/server";
import { authorized, currentRole, database } from "@/lib/server-auth";
import { applyStateOperation, epochOf, OperationError, type StateOperation } from "@/lib/state-operations";
import { dataKeys, publicData, makeBackup, parseBackup } from "@/lib/backup";

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { data, error } = await database().from("school_app_state").select("data, updated_at").eq("id", "main").single();
    if (error) throw error;
    return NextResponse.json({ data: publicData(data.data), epoch: epochOf(data.data), updatedAt: data.updated_at }, {headers:{"Cache-Control":"no-store"}});
  } catch (error) { if (error instanceof OperationError) return NextResponse.json({error:error.message},{status:error.status});
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if ((await currentRole()) !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = parseBackup(makeBackup(await request.json()));
    const client = database();
    const { data: current, error: readError } = await client.from("school_app_state").select("data").eq("id", "main").maybeSingle();
    if (readError) throw readError;
    // PUT is only for the very first seed. Old browser tabs must never overwrite live shared data.
    if (current && current.data && Object.keys(current.data as Record<string, unknown>).length > 0) {
      return NextResponse.json({ error: "Full-state replacement is disabled" }, { status: 409 });
    }
    const { data, error } = await client.from("school_app_state").upsert({ id: "main", data: body, updated_at: new Date().toISOString() }).select("updated_at").single();
    if (error) throw error;
    return NextResponse.json({ ok: true, updatedAt: data.updated_at });
  } catch (error) { if (error instanceof OperationError) return NextResponse.json({error:error.message},{status:error.status});
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const role = await currentRole();
  if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const operation = await request.json() as StateOperation;
    if (!["record:add", "record:update", "record:delete", "student:add", "student:update", "student:delete", "state:merge"].includes(operation.type)) {
      return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
    }

    const client = database();
    // Compare-and-swap prevents two teachers from overwriting each other's record.
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const { data: current, error: readError } = await client
        .from("school_app_state").select("data, updated_at").eq("id", "main").single();
      if (readError) throw readError;

      const nextData = applyStateOperation(current.data || {}, operation, role);
      if (JSON.stringify(nextData) === JSON.stringify(current.data || {})) {
        return NextResponse.json({ ok: true, data: publicData(current.data), epoch: epochOf(current.data), updatedAt: current.updated_at });
      }
      const nextUpdatedAt = new Date(Math.max(Date.now() + attempt, Date.parse(current.updated_at) + 1)).toISOString();
      const { data: updated, error: updateError } = await client
        .from("school_app_state")
        .update({ data: nextData, updated_at: nextUpdatedAt })
        .eq("id", "main")
        .eq("updated_at", current.updated_at)
        .select("data, updated_at")
        .maybeSingle();
      if (updateError) throw updateError;
      if (updated) return NextResponse.json({ ok: true, data: publicData(updated.data), epoch: epochOf(updated.data), updatedAt: updated.updated_at });
      // Spread retries slightly so a burst of many teachers does not keep colliding.
      await new Promise(resolve => setTimeout(resolve, Math.min(5 + attempt * 3, 100) + Math.random() * 20));
    }
    return NextResponse.json({ error: "Concurrent update; please retry" }, { status: 409 });
  } catch (error) { if (error instanceof OperationError) return NextResponse.json({error:error.message},{status:error.status});
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database error" }, { status: 500 });
  }
}
