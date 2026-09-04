export type PointType = "reward" | "penalty";

export interface Student {
  id: string;
  grade: number;
  classNumber: number;
  number: number;
  name: string;
  createdAt: string;
}

export interface PointPreset {
  id: string;
  label: string;
  type: PointType;
  score: number;
  category: string;
  isActive: boolean;
}

export interface PointRecord {
  id: string;
  studentId: string;
  presetId?: string;
  type: PointType;
  score: number;
  reason: string;
  awardedBy: string;
  awardedAt: string;
  note?: string;
}

export interface ClassStat {
  label: string;
  reward: number;
  penalty: number;
}
