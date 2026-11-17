import {mkdir,readFile,writeFile,rename,readdir} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {knowledge} from './knowledge';
import {seed,type Visitor} from './business';
import type {Workspace} from './workspace-types';
const dir=path.join(process.cwd(),'.data');
const state=globalThis as typeof globalThis&{shopQueue?:Promise<unknown>};
export function locked<T>(fn:()=>Promise<T>):Promise<T>{const p=(state.shopQueue||Promise.resolve()).then(fn);state.shopQueue=p.catch(()=>{});return p}
function initial():Workspace{return {knowledge:knowledge(seed()),prompts:[{id:'prompt-v1',text:'使用简洁、友好的中文回答。先理解预算和用途，再给出有依据的推荐；不确定时先询问，避免夸大商品效果。',created:new Date().toISOString()}],activePrompt:'prompt-v1',cases:[{id:'case-shopping',title:'预算内降噪耳机',input:'推荐500元以内的主动降噪耳机，请展示商品卡片。',contains:'',tool:'search_products',citation:false},{id:'case-order',title:'模拟订单查询',input:'订单SA20261117001什么时候到？',contains:'2026-11-18',tool:'get_order',citation:false},{id:'case-policy',title:'退货政策引用',input:'入耳式耳机拆封后能无理由退货吗？请引用企业政策。',contains:'拆封',tool:'search_knowledge',citation:true}],results:[],prices:{input:null,output:null,currency:'USD'},audit:[]}}
async function readWorkspace(){try{return JSON.parse(await readFile(path.join(dir,'workspace.json'),'utf8')) as Workspace}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;return initial()}}
export function workspace<T>(fn:(w:Workspace)=>T|Promise<T>):Promise<T>{return locked(async()=>{if(process.env.VERCEL)throw new Error('尚未配置云端存储');await mkdir(dir,{recursive:true});const w=await readWorkspace();w.results.forEach(r=>{if(r.state==='running'&&Date.now()-Date.parse(r.created)>240000){r.state='error';r.error='运行中断或超时，请重新运行'}});const result=await fn(w);const temp=path.join(dir,'workspace-'+randomUUID()+'.tmp');await writeFile(temp,JSON.stringify(w),{mode:0o600});await rename(temp,path.join(dir,'workspace.json'));return result})}
export function visitorLabel(owner:string){return createHash('sha256').update(owner).digest('hex').slice(0,10)}
export async function allVisitors(){return locked(async()=>{await mkdir(dir,{recursive:true});const files=(await readdir(dir)).filter(f=>/^[a-f0-9-]{36}\.json$/.test(f));return Promise.all(files.map(async file=>({owner:file.slice(0,-5),visitor:JSON.parse(await readFile(path.join(dir,file),'utf8')) as Visitor})))})}
export function audit(w:Workspace,action:string){w.audit.unshift({time:new Date().toISOString(),action});w.audit=w.audit.slice(0,200)}
