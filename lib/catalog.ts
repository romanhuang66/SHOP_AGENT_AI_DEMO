export type Product={id:string;name:string;sub:string;price:number;old:number;category:string;type:'headphones'|'earbuds'|'speaker'|'watch';color:string;bg:string;tag:string;battery:string;weight:string;noise:string};
const baseProducts:Product[]=[
{id:'p1',name:'声屿 Quiet Pro',sub:'把喧嚣留在世界，把音乐留给自己',price:399,old:499,category:'头戴耳机',type:'headphones',color:'#194b3a',bg:'#e7eee7',tag:'通勤降噪首选',battery:'60 小时',weight:'238 g',noise:'混合主动降噪'},
{id:'p2',name:'声屿 Air Buds 3',sub:'轻盈入耳，每一程都有好声音',price:299,old:369,category:'真无线耳机',type:'earbuds',color:'#aab89a',bg:'#f0f0e6',tag:'轻装出行',battery:'32 小时（含充电盒）',weight:'4.5 g / 只',noise:'主动降噪'},
{id:'p3',name:'木音 Mini Speaker',sub:'让生活的每个角落，都有节奏',price:199,old:259,category:'蓝牙音箱',type:'speaker',color:'#c58a53',bg:'#f2e9de',tag:'居家好物',battery:'12 小时',weight:'420 g',noise:'不适用'},
{id:'p4',name:'跃动 Fit Watch',sub:'从今天开始，记录每一次进步',price:459,old:599,category:'智能穿戴',type:'watch',color:'#414d47',bg:'#e6e9e7',tag:'运动搭档',battery:'14 天',weight:'32 g',noise:'不适用'},
{id:'p5',name:'声屿 Studio Lite',sub:'轻量设计，沉浸聆听',price:479,old:599,category:'头戴耳机',type:'headphones',color:'#b9a68c',bg:'#eee9e0',tag:'长效续航',battery:'80 小时',weight:'210 g',noise:'混合主动降噪'},
{id:'p6',name:'声屿 Air Buds S',sub:'口袋里的音乐灵感',price:229,old:299,category:'真无线耳机',type:'earbuds',color:'#4a5c70',bg:'#e8edf1',tag:'高性价比',battery:'28 小时（含充电盒）',weight:'4.2 g / 只',noise:'通话降噪'}];

export const products:Product[]=[...baseProducts,...Array.from({length:24},(_,i)=>{const p=baseProducts[i%6];const edition=Math.floor(i/6)+1;return {...p,id:'p'+(i+7),name:p.name+' '+['悦享版','旅行版','轻量版','旗舰版'][edition-1],price:p.price+edition*80-40,old:p.old+edition*80,tag:['日常精选','旅途搭档','轻量随行','品质之选'][edition-1],battery:p.type==='headphones'?(50+edition*10)+' 小时':p.battery};})];
