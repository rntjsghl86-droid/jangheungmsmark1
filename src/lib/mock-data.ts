import type { ClassStat, PointPreset, PointRecord, Student } from "@/types";

export const students: Student[] = [
  { id: "s-001", grade: 1, classNumber: 1, number: 1, name: "학생가", createdAt: "2026-03-02" },
  { id: "s-002", grade: 1, classNumber: 1, number: 2, name: "학생나", createdAt: "2026-03-02" },
  { id: "s-003", grade: 1, classNumber: 2, number: 1, name: "학생다", createdAt: "2026-03-02" },
  { id: "s-004", grade: 2, classNumber: 1, number: 1, name: "학생라", createdAt: "2026-03-02" },
  { id: "s-005", grade: 3, classNumber: 1, number: 1, name: "학생마", createdAt: "2026-03-02" },
];

export const pointPresets: PointPreset[] = [
  { id: "p-01", label: "환경정화", type: "reward", score: 2, category: "봉사", isActive: true },
  { id: "p-02", label: "수업 참여", type: "reward", score: 1, category: "학습", isActive: true },
  { id: "p-03", label: "무단지각", type: "penalty", score: -1, category: "출결", isActive: true },
  { id: "p-04", label: "수업 방해", type: "penalty", score: -2, category: "생활", isActive: true },
];

export const pointRecords: PointRecord[] = [
  { id: "r-01", studentId: "s-001", presetId: "p-01", type: "reward", score: 2, reason: "환경정화", awardedBy: "담당교사 A", awardedAt: "2026-09-04T09:10:00" },
  { id: "r-02", studentId: "s-002", presetId: "p-02", type: "reward", score: 1, reason: "수업 참여", awardedBy: "담당교사 A", awardedAt: "2026-09-04T10:25:00" },
  { id: "r-03", studentId: "s-003", presetId: "p-03", type: "penalty", score: -1, reason: "무단지각", awardedBy: "담당교사 B", awardedAt: "2026-09-04T08:54:00" },
  { id: "r-04", studentId: "s-004", presetId: "p-04", type: "penalty", score: -2, reason: "수업 방해", awardedBy: "담당교사 A", awardedAt: "2026-09-03T13:45:00" },
];

export const classStats: ClassStat[] = [
  { label: "1학년 1반", reward: 18, penalty: 3 },
  { label: "1학년 2반", reward: 13, penalty: 5 },
  { label: "2학년 3반", reward: 21, penalty: 7 },
  { label: "3학년 1반", reward: 16, penalty: 2 },
];
