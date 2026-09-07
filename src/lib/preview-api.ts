import { students, pointRecords } from "./mock-data";
import { defaultPermissions, permissionsFrom, type Role } from "./permissions";
import { makeBackup, parseBackup, publicData } from "./backup";
import { applyStateOperation, epochOf, OperationError } from "./state-operations";
let role: Role = "admin";
let authenticated=true;
let permissions = {...defaultPermissions};
let state: Record<string, unknown> = { students, records: pointRecords, violations: [{id:"v-1",reason:"무단 지각",score:-1},{id:"v-2",reason:"수업 방해",score:-1},{id:"v-3",reason:"교내 전자기기 무단 사용",score:-1}], committeeHeld: {}, committeeDismissed: [] };
let updatedAt = new Date().toISOString();
export function setPreviewRole(next: Role) {role=next;authenticated=true;}
export function showPreviewLogin() {authenticated=false;}
export const previewRequest: typeof fetch = async (input, init) => {
  const path=String(input), method=init?.method||"GET", body=init?.body?JSON.parse(String(init.body)):null;
  const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json"}});
  if(path==="/api/auth/status")return reply({authenticated,role,permissions});
  if(path==="/api/auth/login") { const response=await globalThis.fetch("/api/preview-login",init);if(!response.ok)return response;role=body.role;authenticated=true;return reply({ok:true,role,permissions}); }
  if(!authenticated)return reply({error:"로그인이 필요합니다."},401);
  if(path==="/api/auth/change-pin")return reply({error:"미리보기에서는 실제 PIN을 변경하지 않습니다."},400);
  if(path==="/api/permissions") {if(role!=="admin")return reply({},403);if(method==="PUT"){if(JSON.stringify(permissionsFrom(body.before))!==JSON.stringify(permissions))return reply({error:"다른 관리자가 권한을 변경했습니다."},409);permissions=permissionsFrom(body.permissions);state={...state,settings:{...(state.settings as object),teacherPermissions:permissions}};updatedAt=new Date(Math.max(Date.now(),Date.parse(updatedAt)+1)).toISOString();}return reply(permissions);}
  if(path==="/api/backup") {if(role!=="admin")return reply({},403);if(method==="GET")return reply(makeBackup(state));if(body.expectedUpdatedAt!==updatedAt)return reply({},409);try{state={...state,...parseBackup(body.backup),settings:{...(state.settings as object),dataEpoch:epochOf(state)+1}};updatedAt=new Date(Math.max(Date.now(),Date.parse(updatedAt)+1)).toISOString();return reply({ok:true});}catch{return reply({},400);}}
  if(path==="/api/state") {
    if(method==="GET")return reply({data:publicData(state),epoch:epochOf(state),updatedAt});
    if(method==="PATCH") {
      try{state=applyStateOperation(state,body,role);}catch(e){return reply({error:e instanceof Error?e.message:"저장 오류"},e instanceof OperationError?e.status:400);}

      updatedAt=new Date(Math.max(Date.now(),Date.parse(updatedAt)+1)).toISOString();return reply({data:publicData(state),epoch:epochOf(state),updatedAt});
    }
  }
  return reply({error:"미리보기에서 지원하지 않는 작업입니다."},400);
};
