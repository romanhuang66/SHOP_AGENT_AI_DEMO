import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {seed,type Visitor} from './business';
const dir=path.join(process.cwd(),'.data');
// A local-only adapter. Cloud deployment must replace it with a durable database.
const state=globalThis as typeof globalThis&{shopQueue?:Promise<unknown>};
export function transaction<T>(owner:string,fn:(v:Visitor)=>T|Promise<T>):Promise<T>{const run=async()=>{if(process.env.VERCEL)throw new Error('请先配置云端持久化存储');await mkdir(dir,{recursive:true});const file=path.join(dir,owner+'.json');let v:Visitor;try{v=JSON.parse(await readFile(file,'utf8'))}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;v=seed()}v.conversationId??=randomUUID();const before=structuredClone(v);const result=await fn(v);if(before.messages.length&&v.messages.length===0){v.archives??=[];v.archives.push({id:before.conversationId!,messages:before.messages,requests:before.agentRequests||[]});v.conversationId=randomUUID()}const old=new Set(before.messages.map(m=>m.id));v.messages.forEach(m=>{if(!old.has(m.id))m.created??=new Date().toISOString()});const temp=file+'.'+randomUUID()+'.tmp';await writeFile(temp,JSON.stringify(v),{mode:0o600});await rename(temp,file);return result};const next=(state.shopQueue||Promise.resolve()).then(run);state.shopQueue=next.catch(()=>{});return next}
