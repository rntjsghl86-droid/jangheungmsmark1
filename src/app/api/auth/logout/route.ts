import { NextResponse } from "next/server";
export async function POST() {
  const response=NextResponse.json({ok:true});
  response.cookies.delete("school_admin");response.cookies.delete("school_session");return response;
}
