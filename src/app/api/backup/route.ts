import { NextResponse } from "next/server";
import { currentRole, database } from "@/lib/server-auth";
import { epochOf } from "@/lib/state-operations";
import { makeBackup, parseBackup } from "@/lib/backup";
export async function GET() {
  if(await currentRole()!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});
  const {data,error}=await database().from("school_app_state").select("data").eq("id","main").single();
  if(error)return NextResponse.json({error:"Database error"},{status:500});
  return NextResponse.json(makeBackup(data.data),{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:Request) {
  if(await currentRole()!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});
  let data:Record<string,unknown>,expectedUpdatedAt:string;
  try {const text=await request.text();if(Buffer.byteLength(text)>20*1024*1024)throw new Error();const body=JSON.parse(text);data=parseBackup(body.backup);expectedUpdatedAt=body.expectedUpdatedAt;if(typeof expectedUpdatedAt!=="string")throw new Error();}catch{return NextResponse.json({error:"Invalid backup"},{status:400});}
  const client=database();
  const {data:current,error}=await client.from("school_app_state").select("data,updated_at").eq("id","main").single();
  if(error)return NextResponse.json({error:"Database error"},{status:500});
  if(current.updated_at!==expectedUpdatedAt)return NextResponse.json({error:"Concurrent update"},{status:409});
  const {data:updated,error:writeError}=await client.from("school_app_state").update({data:{...current.data,...data,settings:{...current.data.settings,dataEpoch:epochOf(current.data)+1}},updated_at:new Date(Math.max(Date.now(),Date.parse(current.updated_at)+1)).toISOString()}).eq("id","main").eq("updated_at",expectedUpdatedAt).select("id").maybeSingle();
  if(writeError)return NextResponse.json({error:"Database error"},{status:500});
  return NextResponse.json(updated?{ok:true}:{error:"Concurrent update"},{status:updated?200:409});
}
