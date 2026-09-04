import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "장흥중학교 생활관리", description: "장흥중학교 생활규정 위반 기록 및 학생 생활지도 관리 시스템" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }
