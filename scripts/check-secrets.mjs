import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const files=[...new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean))];
const privatePath=p=>/(^|\/)(\.env(?:\..*)?|\.data|\.vercel)(\/|$)/.test(p)&&!p.endsWith('.env.example');
const local=fs.existsSync('.env.local')?fs.readFileSync('.env.local','utf8'):'';
const knownKeys=local.split(/\r?\n/).filter(l=>/^\s*[A-Z0-9_]*(KEY|SECRET|TOKEN|PASSWORD)\s*=/.test(l)).map(l=>l.slice(l.indexOf('=')+1).trim().replace(/^['"]|['"]$/g,'')).filter(v=>v.length>=16);
let failed=false;for(const file of files){if(privatePath(file)){console.error('BLOCK: private path included: '+file);failed=true;continue}if(!fs.existsSync(file)||!fs.statSync(file).isFile()||fs.statSync(file).size>3000000||/\.(jpg|png|gif|pdf|woff2?|mp[34]|wav)$/.test(file))continue;const body=fs.readFileSync(file,'utf8');if(knownKeys.some(k=>body.includes(k))||/\bsk-[A-Za-z0-9_-]{24,}\b/.test(body)){console.error('BLOCK: possible credential in '+file+' (value hidden)');failed=true}}
if(failed)process.exitCode=1;else console.log('PASS: no private paths or detected credentials in Git tracked/unignored files. This is a focused check, not a guarantee against every credential format.');
