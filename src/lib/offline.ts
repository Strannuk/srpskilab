// Offline retry queue, scoped to authenticated user, never grants a server-confirmed completion.
export type PendingAttempt={userId:string,lessonId:string,key:string,answers:Record<string,string>,createdAt:string,schemaVersion?:1|2};
const DB='srpskilab-sync-queue-v2';const STORE='attempts';
function connect():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'key'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function request<T>(mode:IDBTransactionMode,operation:(s:IDBObjectStore)=>IDBRequest<T>):Promise<T>{const db=await connect();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode),r=operation(tx.objectStore(STORE));r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();tx.onerror=()=>reject(tx.error)})}
export const queueAttempt=(item:PendingAttempt)=>request('readwrite',s=>s.put(item));
export const takeQueue=async(uid:string)=>((await request('readonly',s=>s.getAll())) as PendingAttempt[]).filter(x=>x.userId===uid);
export const removeAttempt=(key:string)=>request('readwrite',s=>s.delete(key));
// Delete all pending attempts belonging to the former account when user requests local data cleanup.
export async function clearQueueForUser(uid:string){for(const item of await takeQueue(uid))await removeAttempt(item.key)}
