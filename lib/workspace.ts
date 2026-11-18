import {createHash} from 'node:crypto';
import {knowledge} from './knowledge';
import {seed,type Visitor} from './business';
import type {Workspace} from './workspace-types';
import {stateTransaction,visitorStates} from './persistence';
function initial():Workspace{return {knowledge:knowledge(seed()),prompts:[{id:'prompt-v1',text:'使用简洁、友好的中文回答。先理解预算和用途，再给出有依据的推荐；不确定时先询问，避免夸大商品效果。',created:new Date().toISOString()}],activePrompt:'prompt-v1',cases:[{id:'case-shopping',title:'预算内降噪耳机',input:'推荐500元以内的主动降噪耳机，请展示商品卡片。',contains:'',tool:'search_products',citation:false},{id:'case-order',title:'未下单时查询订单',input:'帮我查询我的订单，如果还没有订单请说明如何下单。',contains:'购物车',tool:'get_order',citation:false},{id:'case-policy',title:'退货政策引用',input:'入耳式耳机拆封后能无理由退货吗？请引用企业政策。',contains:'拆封',tool:'search_knowledge',citation:true}],results:[],prices:{input:null,output:null,currency:'USD'},audit:[]}}
export function workspace<T>(fn:(w:Workspace)=>T|Promise<T>):Promise<T>{return stateTransaction('workspace',initial,async w=>{const oldOrderCase=w.cases.find(c=>c.id==='case-order'&&c.input==='订单SA20261117001什么时候到？');if(oldOrderCase)Object.assign(oldOrderCase,{title:'未下单时查询订单',input:'帮我查询我的订单，如果还没有订单请说明如何下单。',contains:'购物车'});w.results.forEach(r=>{if(r.state==='running'&&Date.now()-Date.parse(r.created)>240000){r.state='error';r.error='运行中断或超时，请重新运行'}});return fn(w)})}
export function visitorLabel(owner:string){return createHash('sha256').update(owner).digest('hex').slice(0,10)}
export async function allVisitors(){return visitorStates<Visitor>()}
export function audit(w:Workspace,action:string){w.audit.unshift({time:new Date().toISOString(),action});w.audit=w.audit.slice(0,200)}
