import { can, canMerge, permissionsFrom, type Permission, type Role } from "./permissions";
import { makeBackup, parseBackup } from "./backup";

type Row = Record<string, unknown>;
export type StateOperation = { type: string; epoch: number; record?: Row; student?: Row; id?: string; before?: Row; data?: Row };
export class OperationError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export const epochOf = (state: Row): number => Number((state.settings as Row | undefined)?.dataEpoch || 0);
const same = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) || Array.isArray(b)) return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => same(v, b[i]));
  const x=a as Row,y=b as Row;
  return Object.keys(x).length===Object.keys(y).length && Object.keys(x).every(k=>Object.hasOwn(y,k)&&same(x[k],y[k]));
};
const conflict = () => { throw new OperationError("다른 사용자가 먼저 변경했습니다. 최신 내용을 확인하고 다시 저장해 주세요.", 409); };

// Recomputed against the latest database snapshot on every compare-and-swap retry.
export function applyStateOperation(state: Row, operation: StateOperation, role: Role): Row {
  if (!operation || typeof operation !== "object") throw new OperationError("잘못된 요청입니다.",400);
  const permission: Record<string, Permission> = {"record:add":"recordAdd","record:update":"recordEdit","record:delete":"recordDelete","student:add":"studentManage","student:update":"studentManage","student:delete":"studentManage"};
  const permissions=permissionsFrom((state.settings as Row | undefined)?.teacherPermissions);
  if (operation.type!=="state:merge" && !Object.hasOwn(permission,operation.type)) throw new OperationError("지원하지 않는 작업입니다.",400);
  if (operation.type!=="state:merge" && !can(role,permissions,permission[operation.type])) throw new OperationError("이 작업을 할 권한이 없습니다.",403);
  if (!Number.isInteger(operation.epoch) || operation.epoch!==epochOf(state)) conflict();
  let next: Row;
  if(operation.type==="state:merge") {
    const patch=operation.data;
    if(!patch || typeof patch!=="object" || Array.isArray(patch))throw new OperationError("잘못된 요청입니다.",400);
    if(!canMerge(role,permissions,state,patch))throw new OperationError("이 작업을 할 권한이 없습니다.",403);
    if(!operation.before || Object.keys(patch).some(k=>!Object.hasOwn(operation.before!,k)||!same(operation.before![k],state[k])))conflict();
    next={...state,...patch};
    // Whole-roster replacement invalidates in-flight writes from older browser tabs.
    if(Object.hasOwn(patch,"students") && Object.hasOwn(patch,"records"))next.settings={...(state.settings as Row),dataEpoch:epochOf(state)+1};
  } else {
    const studentOperation=operation.type.startsWith("student:"), key=studentOperation?"students":"records";
    const rows=[...(state[key] as Row[] || [])];
    const incoming=studentOperation?operation.student:operation.record;
    const id=operation.type.endsWith(":delete")?operation.id:incoming?.id;
    if(typeof id!=="string" || !id)throw new OperationError("ID가 필요합니다.",400);
    const index=rows.findIndex(row=>row.id===id);
    if(operation.type.endsWith(":add")) {
      if(!incoming)throw new OperationError("입력 내용이 없습니다.",400);
      if(index>=0) { if(same(rows[index],incoming))return state;conflict(); }
      rows.unshift(incoming);
    } else {
      if(index<0 || !same(rows[index],operation.before))conflict();
      if(operation.type.endsWith(":delete"))rows.splice(index,1);
      else { if(!incoming)throw new OperationError("입력 내용이 없습니다.",400);rows[index]=incoming; }
    }
    if(!studentOperation && !operation.type.endsWith(":delete") && !(state.students as Row[]).some(s=>s.id===incoming?.studentId))conflict();
    next={...state,[key]:rows};
    if(studentOperation && !operation.type.endsWith(":delete")) {
      if(rows.some(r=>r.id!==id&&r.grade===incoming?.grade&&r.classNumber===incoming?.classNumber&&r.number===incoming?.number))throw new OperationError("같은 학년·반·번호의 학생이 이미 있습니다.",409);
    }
    if(operation.type==="student:delete") {
      next.records=(state.records as Row[]).filter(r=>r.studentId!==id);
      const held={...(state.committeeHeld as Row)};delete held[id];next.committeeHeld=held;
      next.committeeDismissed=(state.committeeDismissed as string[]).filter(x=>x!==id);
    }
  }
  try { parseBackup(makeBackup(next)); } catch(e) { throw new OperationError(e instanceof Error?e.message:"데이터 형식이 올바르지 않습니다.",400); }
  return next;
}
