const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),ts=require('typescript');
const cache=new Map();
function load(filename){filename=path.resolve(filename);if(cache.has(filename))return cache.get(filename).exports;const m={exports:{}};cache.set(filename,m);const js=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',js)((id)=>id.startsWith('.')?load(path.resolve(path.dirname(filename),id+'.ts')):require(id),m,m.exports);return m.exports;}
const {canMerge,defaultPermissions:requestedPermissions}=load('src/lib/permissions.ts'),{makeBackup,parseBackup}=load('src/lib/backup.ts');
const defaultPermissions={...requestedPermissions,recordEdit:false,recordDelete:false,studentManage:false,exportData:false};
const student={id:'1',name:'예시',grade:1,classNumber:1,number:1,createdAt:'2026-01-01'};
const state={students:[student],records:[],violations:[],committeeHeld:{},committeeDismissed:[],settings:{pinHash:'SECRET',teacherPermissions:defaultPermissions}};
assert(!JSON.stringify(makeBackup(state)).includes('SECRET'));
assert.deepEqual(parseBackup(makeBackup(state)).students,[student]);
assert.throws(()=>parseBackup({...makeBackup(state),version:2}));
assert.throws(()=>parseBackup(makeBackup({...state,students:[student,student]})));
assert.throws(()=>parseBackup(makeBackup({...state,records:[{id:'r',awardedAt:'invalid'}]})));
assert(!canMerge('teacher',defaultPermissions,state,{students:[]}));
assert(!canMerge('admin',defaultPermissions,state,{settings:{}}));
assert(!canMerge('teacher',defaultPermissions,state,{records:[]}));
assert(canMerge('teacher',{...defaultPermissions,studentManage:true},state,{students:[],records:[]}));
assert(canMerge('teacher',{...defaultPermissions,rosterReplace:true},state,{students:[],records:[],committeeHeld:{},committeeDismissed:[]}));
assert(!canMerge('teacher',{...defaultPermissions,studentManage:true},{...state,students:[student,{...student,id:'2'}]},{students:[],records:[]}));
(async()=>{const {previewRequest:api,setPreviewRole}=load('src/lib/preview-api.ts');setPreviewRole('admin');await api('/api/permissions',{method:'PUT',body:JSON.stringify({permissions:defaultPermissions,before:requestedPermissions})});setPreviewRole('teacher');assert.equal((await api('/api/backup')).status,403);assert.equal((await api('/api/permissions',{method:'PUT',body:JSON.stringify(defaultPermissions)})).status,403);assert.equal((await api('/api/state',{method:'PATCH',body:JSON.stringify({type:'record:delete',id:'1'})})).status,403);setPreviewRole('admin');const backup=await(await api('/api/backup')).json();const current=await(await api('/api/state')).json();assert.equal((await api('/api/backup',{method:'POST',body:JSON.stringify({backup,expectedUpdatedAt:'stale'})})).status,409);assert.equal((await api('/api/backup',{method:'POST',body:JSON.stringify({backup,expectedUpdatedAt:current.updatedAt})})).status,200);console.log('16 permission, backup validation, round-trip and conflict assertions passed.');})().catch(e=>{console.error(e);process.exitCode=1});
