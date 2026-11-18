import {createHash} from 'node:crypto';
import {stateTransaction} from './persistence';
export function requestIdentity(r:Request){const ip=process.env.VERCEL?(r.headers.get('x-vercel-forwarded-for')||r.headers.get('x-real-ip')||'unknown'):'local';return createHash('sha256').update(ip.split(',')[0].trim()).digest('hex').slice(0,32)}
export async function consumeRate(name:string,limit:number,windowMs:number){return stateTransaction('rate:'+name,()=>({times:[] as number[]}),v=>{v.times=v.times.filter(t=>Date.now()-t<windowMs);if(v.times.length>=limit)return false;v.times.push(Date.now());return true})}
