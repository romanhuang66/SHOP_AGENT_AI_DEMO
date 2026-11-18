import {randomUUID} from 'node:crypto';
import {seed,type Visitor} from './business';
import {upgradeCommerce} from './commerce';
import {stateTransaction} from './persistence';
export function transaction<T>(owner:string,fn:(v:Visitor)=>T|Promise<T>):Promise<T>{if(!/^[a-f0-9-]{36}$/.test(owner))throw new Error('访客标识无效');return stateTransaction('visitor:'+owner,seed,async v=>{upgradeCommerce(v);v.conversationId??=randomUUID();const before=structuredClone(v);const result=await fn(v);if(before.messages.length&&v.messages.length===0){v.archives??=[];v.archives.push({id:before.conversationId!,messages:before.messages,requests:before.agentRequests||[]});v.conversationId=randomUUID()}const old=new Set(before.messages.map(m=>m.id));v.messages.forEach(m=>{if(!old.has(m.id))m.created??=new Date().toISOString()});return result})}
