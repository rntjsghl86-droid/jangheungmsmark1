import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
export async function POST(request:Request) {
  if(process.env.LOCAL_PREVIEW!=="true")return new NextResponse(null,{status:404});
  const {role,pin}=await request.json();
  if(role!=="admin"&&role!=="teacher")return NextResponse.json({error:"Invalid role"},{status:400});
  const expected=process.env[role==="admin"?"ADMIN_PIN":"SCHOOL_PIN"];
  const a=Buffer.from(expected||""),b=Buffer.from(String(pin||""));
  if(!expected||a.length!==b.length||!timingSafeEqual(a,b))return NextResponse.json({error:"PIN을 확인해 주세요."},{status:401});
  return NextResponse.json({ok:true,role});
}
