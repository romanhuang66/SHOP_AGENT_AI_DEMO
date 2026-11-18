import {readFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const env=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>/^[A-Z0-9_]+=/.test(l)).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')]}));
const allKeys={DEEPSEEK_API_KEY:'secret',DEEPSEEK_MODEL:'config',VOICE_PROVIDER:'config',ADMIN_PASSWORD:'secret',ADMIN_SESSION_SECRET:'secret',SUPABASE_URL:'config',SUPABASE_SERVICE_ROLE_KEY:'secret'};
const keys=Object.fromEntries(Object.entries(allKeys).filter(([key])=>!process.argv.includes('--without-database')||!key.startsWith('SUPABASE_')));
for(const key of Object.keys(keys))if(!env[key])throw new Error('缺少 '+key+'，未同步任何变量。');if(!existsSync('.vercel/project.json'))throw new Error('请先执行 vercel link');
const environments=process.argv.includes('--preview')?['preview']:['production'];
for(const environment of environments)for(const [key,type]of Object.entries(keys)){const args=['env','add',key,'--environment',environment,'--type',type,'--force','--yes'];const cliIndex=process.argv.indexOf('--cli');const cli=process.env.VERCEL_CLI_PATH||(cliIndex>=0?process.argv[cliIndex+1]:undefined);const r=spawnSync(cli?process.execPath:'npx',cli?[cli,...args]:['--yes','vercel@65.9.0',...args],{input:env[key]+'\n',encoding:'utf8',maxBuffer:1024*1024,env:process.env});if(r.status!==0){console.error('同步失败：'+key+'；为避免泄露，未输出CLI原始日志。请检查Vercel登录与项目关联。');process.exit(1)}console.log('Configured '+key+' ('+type+', '+environment+'); value hidden.');}
