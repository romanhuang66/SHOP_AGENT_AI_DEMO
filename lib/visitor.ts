import {cookies} from 'next/headers';
import {randomUUID} from 'node:crypto';
export async function owner(){const jar=await cookies();let id=jar.get('sa-visitor')?.value;if(!id||!/^\w{8}-\w{4}-4\w{3}-[89ab]\w{3}-\w{12}$/.test(id)){id=randomUUID();jar.set('sa-visitor',id,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:2592000})}return id}
export function sameOrigin(request:Request){try{const origin=request.headers.get('origin');return !origin||new URL(origin).host===request.headers.get('host')}catch{return false}}
