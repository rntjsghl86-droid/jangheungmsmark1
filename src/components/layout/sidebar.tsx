"use client";

import { Award, BarChart3, ClipboardList, FileText, GraduationCap, LayoutDashboard, Menu, Settings, Users, X } from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "대시보드", icon: LayoutDashboard, active: true },
  { name: "학생 관리", icon: Users },
  { name: "상벌점 부여", icon: Award },
  { name: "상벌점 내역", icon: ClipboardList },
  { name: "리포트 · 내보내기", icon: FileText },
  { name: "항목 설정", icon: Settings },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);
  return <>
    <button onClick={() => setOpen(true)} className="fixed left-4 top-4 z-50 rounded-lg border border-border bg-white p-2 text-slate-600 shadow-card lg:hidden" aria-label="메뉴 열기"><Menu size={20} /></button>
    {open && <button onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden" aria-label="메뉴 닫기" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white p-5 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="mb-9 flex items-center justify-between px-2">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><GraduationCap size={22} /></div><div><p className="font-bold tracking-tight text-slate-900">우리학교 생활관리</p><p className="text-xs text-muted-foreground">학생 상벌점 시스템</p></div></div>
        <button onClick={() => setOpen(false)} className="lg:hidden"><X size={20} /></button>
      </div>
      <nav className="space-y-1">{navigation.map((item) => <button key={item.name} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${item.active ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}><item.icon size={19} />{item.name}</button>)}</nav>
      <div className="mt-auto rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">2026학년도 2학기</p><p className="mt-1 text-sm font-semibold text-slate-800">정상 운영 중</p></div>
    </aside>
  </>;
}
