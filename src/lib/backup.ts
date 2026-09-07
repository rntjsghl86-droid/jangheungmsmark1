export const dataKeys = ["students", "records", "violations", "committeeHeld", "committeeDismissed"] as const;
export function publicData(state: Record<string, unknown>) {
  return Object.fromEntries(dataKeys.map(key => [key, state[key] ?? (key === "committeeHeld" ? {} : [])]));
}
export function makeBackup(state: Record<string, unknown>) {
  return { format: "jangheung-school-backup", version: 1, createdAt: new Date().toISOString(), data: publicData(state) };
}
export function parseBackup(value: unknown): Record<string, unknown> {
  const file = value as ReturnType<typeof makeBackup>;
  if (!file || file.format !== "jangheung-school-backup" || file.version !== 1 || !file.data) throw new Error("이 시스템에서 만든 백업 파일을 선택해 주세요.");
  const d = file.data;
  for (const key of ["students", "records", "violations", "committeeDismissed"]) if (!Array.isArray(d[key])) throw new Error("백업 데이터 형식이 올바르지 않습니다.");
  if (!d.committeeHeld || typeof d.committeeHeld !== "object" || Array.isArray(d.committeeHeld) || Object.values(d.committeeHeld).some(v => typeof v !== "boolean")) throw new Error("위원회 데이터가 올바르지 않습니다.");
  const rows = (key: string) => d[key] as Record<string, unknown>[];
  for (const key of ["students", "records", "violations"]) {
    const ids = new Set();
    for (const row of rows(key)) { if (!row || typeof row.id !== "string" || !row.id || ids.has(row.id)) throw new Error("중복되거나 누락된 ID가 있습니다."); ids.add(row.id); }
  }
  if (rows("students").some(s => typeof s.name !== "string" || ![1,2,3].includes(Number(s.grade)) || !Number.isInteger(s.classNumber) || Number(s.classNumber)<1 || !Number.isInteger(s.number) || Number(s.number)<1 || typeof s.createdAt !== "string")) throw new Error("학생 데이터가 올바르지 않습니다.");
  if (rows("records").some(r => typeof r.studentId !== "string" || typeof r.reason !== "string" || typeof r.awardedBy !== "string" || typeof r.awardedAt !== "string" || !Number.isFinite(Date.parse(r.awardedAt)) || typeof r.score !== "number" || !Number.isFinite(r.score) || !["reward","penalty"].includes(String(r.type)) || (r.note !== undefined && typeof r.note !== "string"))) throw new Error("위반 기록 데이터가 올바르지 않습니다.");
  if (rows("violations").some(r => typeof r.reason !== "string" || typeof r.score !== "number" || !Number.isFinite(r.score)) || (d.committeeDismissed as unknown[]).some(x => typeof x !== "string")) throw new Error("규정 데이터가 올바르지 않습니다.");
  return publicData(d);
}
