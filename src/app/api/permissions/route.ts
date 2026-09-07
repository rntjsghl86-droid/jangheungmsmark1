import { NextResponse } from "next/server";
import { currentRole, database } from "@/lib/server-auth";
import { defaultPermissions, permissionsFrom } from "@/lib/permissions";
export async function PUT(request:Request) {
  if(await currentRole()!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});
  const {permissions:body,before}=await request.json();
  if(!body||Object.keys(body).some(k=>!(k in defaultPermissions))||Object.keys(defaultPermissions).some(k=>typeof body[k]!=="boolean"))return NextResponse.json({error:"Invalid permissions"},{status:400});
  const client=database();
  for(let i=0;i<10;i++) {
    const {data:current,error}=await client.from("school_app_state").select("data,updated_at").eq("id","main").single();
    if(error)return NextResponse.json({error:"Database error"},{status:500});
    if(!before || JSON.stringify(permissionsFrom(before))!==JSON.stringify(permissionsFrom(current.data?.settings?.teacherPermissions)))return NextResponse.json({error:"다른 관리자가 권한을 변경했습니다. 새로고침 후 확인해 주세요."},{status:409});
    const next={...current.data,settings:{...current.data.settings,teacherPermissions:permissionsFrom(body)}};
    const {data:updated,error:writeError}=await client.from("school_app_state").update({data:next,updated_at:new Date(Math.max(Date.now(),Date.parse(current.updated_at)+1)).toISOString()}).eq("id","main").eq("updated_at",current.updated_at).select("id").maybeSingle();
    if(writeError)return NextResponse.json({error:"Database error"},{status:500});
    if(updated)return NextResponse.json({ok:true});
  }
  return NextResponse.json({error:"Concurrent update"},{status:409});
}
