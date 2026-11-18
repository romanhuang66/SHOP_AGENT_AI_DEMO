import {changeCart,checkout,confirmReceipt,CommerceError} from '@/lib/commerce';
import {storageBackend} from '@/lib/persistence';
import {authenticated} from '@/lib/admin-auth';
import {workspace} from '@/lib/workspace';
import {owner,sameOrigin} from '@/lib/visitor';
import {configured,model} from '@/lib/agent';
import {knowledge} from '@/lib/knowledge';
import {randomUUID} from 'node:crypto';
import {transaction} from '@/lib/store';
import {policies,reply,returnAdvice,type Ticket} from '@/lib/business';
export const runtime='nodejs';
export const dynamic='force-dynamic';
class InputError extends Error{}
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){try{const v=await transaction(await owner(),v=>({cart:v.cart,cartRevision:v.cartRevision,orders:v.orders.filter(o=>!o.receivedAt),tickets:v.tickets,feedback:v.feedback,messages:v.messages,conversationId:v.conversationId}));return json({...v,policies,storage:storageBackend(),ai:{configured:configured(),model:model(),voice:process.env.VOICE_PROVIDER==='deepseek'?'deepseek':'browser',retrieval:'local-lexical'}})}catch{return json({error:'业务数据读取失败，请稍后重试。'},503)}}
export async function POST(request:Request){try{if(!sameOrigin(request))return json({error:'请求来源无效'},403);const raw=await request.text();if(raw.length>40000)return json({error:'请求内容过长'},413);let b;try{b=JSON.parse(raw)}catch{throw new InputError('请求格式无效')}if(!b||typeof b!=='object'||Array.isArray(b))throw new InputError('请求格式无效');if(['process','knowledge_save','knowledge_toggle'].includes(b.action))return json({error:'此操作需要在管理员后台完成'},401);const result=await transaction(await owner(),v=>{const text=(x:unknown,max:number)=>{if(typeof x!=='string'||!x.trim()||x.length>max)throw new InputError('请填写有效内容，或缩短输入长度');return x.trim()};switch(b.action){case 'cart_add':return changeCart(v,b.productId,b.quantity??1,true);
case 'cart_set':return changeCart(v,b.productId,b.quantity);
case 'checkout':return checkout(v,b.key,b.cartRevision,randomUUID);
case 'confirm_receipt':return confirmReceipt(v,b.orderId);
case 'chat':{if(v.agentRequests?.some(r=>r.state==='pending'&&Date.now()-r.started<240000))throw new InputError('AI 正在生成，请稍后再试');const t=text(b.text,2000);if(v.messages.length>1000)throw new InputError('会话已达上限，请清空后重试');v.messages.push({id:randomUUID(),role:'user',text:t});const answer=reply(v,t,randomUUID);v.messages.push(answer);return {messages:v.messages}}
case 'clear':if(v.agentRequests?.some(r=>r.state==='pending'&&Date.now()-r.started<240000))throw new InputError('AI 正在生成，请稍后清空');v.messages=[];v.agentRequests=[];v.budget=undefined;return {ok:true};
case 'lookup':{const o=v.orders.find(x=>!x.receivedAt&&x.id===text(b.orderId,40).toUpperCase());if(!o)throw new InputError('无法查询该订单，请核对订单号');return {order:o}}
case 'advice':{const o=v.orders.find(x=>x.id===b.orderId);if(!o)throw new InputError('无法查询该订单');return {advice:returnAdvice(o,b.opened===true,b.quality===true),policy:policies[0]}}
case 'feedback':{const message=v.messages.find(x=>x.id===b.messageId&&x.role==='assistant');if(!message||!['up','down'].includes(b.rating))throw new InputError('反馈目标或评价无效');const reason=typeof b.reason==='string'?b.reason.trim().slice(0,500):'';const item={messageId:message.id,rating:b.rating,reason,created:new Date().toISOString()};v.feedback=v.feedback.filter(x=>x.messageId!==message.id);v.feedback.push(item);return {ok:true}}
case 'ticket':{const description=text(b.description,1000),key=text(b.key,100);if(b.orderId&&!v.orders.some(o=>o.id===b.orderId))throw new InputError('无法查询该订单');if(!['人工咨询','退货申请','质量问题'].includes(b.kind))throw new InputError('请选择有效工单类型');const previous=v.tickets.find(t=>t.key===key||t.description===description&&t.orderId===(b.orderId||'')&&t.kind===b.kind&&t.status!=='已解决');if(previous)return {ticket:previous,duplicate:true};const ticket:Ticket={id:'TK-'+randomUUID().slice(0,12).toUpperCase(),orderId:b.orderId||'',description,kind:b.kind,status:'待处理',note:'',created:new Date().toISOString(),key};v.tickets.unshift(ticket);return {ticket}}
case 'process':{const ticket=v.tickets.find(t=>t.id===b.id);if(!ticket||!['处理中','已解决'].includes(b.status))throw new InputError('工单或状态无效');ticket.note=text(b.note,1000);ticket.status=b.status;return {ticket}}
case 'knowledge_save':{const title=text(b.title,150),body=text(b.text,20000);const list=knowledge(v);const doc=b.id?list.find(d=>d.id===b.id):undefined;if(b.id&&!doc)throw new InputError('知识不存在');if(doc){doc.title=title;doc.text=body;doc.version++;doc.published=b.published===true}else list.unshift({id:'KB-'+randomUUID().slice(0,8),title,text:body,version:1,published:b.published===true});return {knowledge:list}}
case 'knowledge_toggle':{const doc=knowledge(v).find(d=>d.id===b.id);if(!doc)throw new InputError('知识不存在');doc.published=!doc.published;doc.version++;return {knowledge:v.knowledge}}
default:throw new InputError('未知操作')}});return json(result)}catch(e){return json({error:(e instanceof InputError||e instanceof CommerceError)?e.message:'操作失败，请稍后重试。'},(e instanceof InputError||e instanceof CommerceError)?400:503)}}
