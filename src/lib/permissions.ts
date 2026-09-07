export type Role = "admin" | "teacher";
export const permissionLabels = {
  recordAdd: "위반 기록 입력", recordEdit: "위반 기록 수정", recordDelete: "위반 기록 삭제",
  studentManage: "학생 추가 · 수정 · 삭제", rosterReplace: "엑셀로 전체 명단 교체 · 학년도 전환",
  ruleManage: "규정 항목 설정", committeeManage: "생활교육위원회 처리", exportData: "리포트 · 내보내기",
};
export type Permission = keyof typeof permissionLabels;
export type Permissions = Record<Permission, boolean>;
export const defaultPermissions: Permissions = { recordAdd: true, recordEdit: true, recordDelete: true, studentManage: true, rosterReplace: false, ruleManage: false, committeeManage: false, exportData: true };
export function permissionsFrom(value: unknown): Permissions {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(Object.keys(defaultPermissions).map(key => [key, typeof input[key] === "boolean" ? input[key] : defaultPermissions[key as Permission]])) as Permissions;
}
export const can = (role: Role, permissions: Permissions, key: Permission) => role === "admin" || permissions[key];

export function canMerge(role: Role, permissions: Permissions, before: Record<string, unknown>, patch: Record<string, unknown>) {
  const keys: Record<string, Permission> = {students:"studentManage", records:"rosterReplace", violations:"ruleManage", committeeHeld:"committeeManage", committeeDismissed:"committeeManage"};
  if(Object.keys(patch).some(k=>!(k in keys)))return false;
  if(role==="admin")return true;
  const roster=permissions.rosterReplace && Array.isArray(patch.students);
  const previous=Array.isArray(before.students)?before.students as {id:string}[]:[];
  const next=Array.isArray(patch.students)?patch.students as {id:string}[]:previous;
  const removed=previous.filter(s=>!next.some(n=>n.id===s.id));
  const changed=next.filter(s=>JSON.stringify(s)!==JSON.stringify(previous.find(n=>n.id===s.id))).length+removed.length;
  if(patch.students && !roster && changed>1)return false;
  const oldRecords=Array.isArray(before.records)?before.records as {studentId:string}[]:[];
  const studentRemoval=permissions.studentManage && removed.length===1 && changed===1 && JSON.stringify(patch.records)===JSON.stringify(oldRecords.filter(r=>r.studentId!==removed[0].id));
  return Object.keys(patch).every(k=>permissions[keys[k]] || (k==="records"&&studentRemoval) || (roster&&["students","records","committeeHeld","committeeDismissed"].includes(k)));
}
