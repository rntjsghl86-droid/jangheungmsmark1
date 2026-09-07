"use client";
import { useState } from "react";
import { Dashboard } from "@/components/dashboard/dashboard";
import { previewRequest, setPreviewRole, showPreviewLogin } from "@/lib/preview-api";
import type { Role } from "@/lib/permissions";
export default function Preview() {
  const [role,setRole]=useState<Role>("admin"),[generation,setGeneration]=useState(0),[loginDemo,setLoginDemo]=useState(false);
  return <><div className="sticky top-0 z-[100] flex flex-wrap items-center justify-between gap-2 border-b border-sky-200 bg-sky-50 px-5 py-3 text-xs text-sky-950"><span><b>로컬 미리보기</b> · 예시 데이터만 사용 · 실제 DB와 연결되지 않음 · 새로고침하면 초기화</span><div className="flex gap-2">{(["admin","teacher"] as Role[]).map(r=><button key={r} onClick={()=>{setLoginDemo(false);setPreviewRole(r);setRole(r);setGeneration(n=>n+1)}} className={`rounded-lg px-3 py-2 font-bold ${role===r?"bg-[#102a43] text-white":"bg-white text-slate-600"}`}>{r==="admin"?"관리자로 보기":"일반 교원으로 보기"}</button>)}<button onClick={()=>{showPreviewLogin();setLoginDemo(true);setGeneration(n=>n+1)}} className="rounded-lg bg-white px-3 py-2 font-bold text-slate-600">PIN 로그인 체험</button></div></div>{loginDemo&&<div className="bg-amber-50 p-3 text-center text-xs text-amber-900">요청하신 역할별 PIN으로 로그인할 수 있습니다. 현재는 로컬 미리보기에만 적용되어 있습니다.</div>}<Dashboard key={generation} request={previewRequest} preview/></>;
}
