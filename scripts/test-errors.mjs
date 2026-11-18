import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHmac} from 'node:crypto';
const base=process.env.SHOP_TEST_URL||'http://127.0.0.1:3000';const env=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>/^[A-Z_]+=/.test(l)).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')]}));
async function request(route,options={}){return fetch(base+route,{...options,headers:{Origin:base,...options.headers}})}
for(const route of ['/api/business','/api/admin/auth','/api/agent']){const r=await request(route,{method:'POST',headers:{'Content-Type':'application/json'},body:'null'});assert.equal(r.status,400,route+' should reject null body')}
assert.equal((await request('/api/business',{method:'POST',headers:{Origin:'not a valid origin','Content-Type':'application/json'},body:'{}'})).status,403);
assert.equal((await request('/api/admin',{headers:{Cookie:'sa-admin=malformed.token'}})).status,401);
const sign=s=>createHmac('sha256',env.ADMIN_SESSION_SECRET).update(s).digest('base64url');const body=Buffer.from(JSON.stringify({exp:Date.now()-1000,version:sign('password:'+env.ADMIN_PASSWORD)})).toString('base64url');assert.equal((await request('/api/admin',{headers:{Cookie:'sa-admin='+body+'.'+sign(body)}})).status,401);
const publicData=await (await request('/api/business')).json();assert.ok(!('knowledge'in publicData));assert.ok(!('agentRequests'in publicData));assert.ok(!JSON.stringify(publicData).includes(env.DEEPSEEK_API_KEY));
console.log('PASS: malformed request bodies, invalid origin, forged/expired admin cookies, and no private configuration in consumer API response.');
