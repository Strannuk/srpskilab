const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto');
const source=path.resolve(__dirname,'../legacy/site');
const ctx={window:{}};ctx.window.window=ctx.window; ctx.addSrModule=(...args)=>ctx.window.addSrModule(...args);
vm.createContext(ctx);
for(const file of ['curriculum-core.js','curriculum-a0-a1.js','curriculum-a2.js','curriculum-b1-b2.js','lesson-addons.js']){let body=fs.readFileSync(path.join(source,file),'utf8');if(file==='lesson-addons.js')body=body.replace('return {render,alphabet};','return {render,alphabet,refs};');vm.runInContext(body,ctx,{filename:file});}
const modules=JSON.parse(JSON.stringify(ctx.window.SR_MODULES));
const addons=JSON.parse(JSON.stringify(ctx.window.SrpskiAddons?.refs||{}));const alphabet=JSON.parse(JSON.stringify(ctx.window.SrpskiAddons?.alphabet||[]));
const lessons=[];
let position=0;
for(const m of modules){for(let i=0;i<m.lessons.length;i++){
 const obj=m.lessons[i],id=`m${m.id}l${i+1}`,words=Array.from({length:Math.min(11,m.vocab.length)},(_,n)=>{const v=m.vocab[(i*3+n)%m.vocab.length];return {...v,id:v.sr.toLowerCase().normalize('NFKC').replace(/\s+/g,' ').trim()};});
 // Shuffle of stable question bank per lesson; 7 prompts, 4 are multiple-choice, 3 are open input.
 const pool=Array.from({length:7},(_,n)=>m.vocab[(i*3+n)%m.vocab.length]);
 const questions=pool.map((w,n)=>{
   const answer = n%2===0 ? w.ru : w.sr;
   const wrongs=m.vocab.filter(x=>x.sr!==w.sr && x.ru!==w.ru).map(x=>n%2===0?x.ru:x.sr);
   const options=n<4?[answer,...wrongs.slice(n,n+3),...wrongs.slice(0,3)].filter((x,i,a)=>a.indexOf(x)===i).slice(0,4):[];
   // deterministic pseudo-shuffle options
   options.sort((a,b)=>crypto.createHash('sha256').update(id+n+a).digest('hex').localeCompare(crypto.createHash('sha256').update(id+n+b).digest('hex')));
   return {id:`${id}-q${n+1}`,kind:n<4?'choice':'input',prompt:n%2===0?`Переведи: ${w.sr}`:`Напиши по-сербски: ${w.ru}`,answer,options};
 });
 lessons.push({id,legacyId:id,order:++position,moduleId:m.id,level:m.level,title:obj.title,note:obj.note,version:1,objectives:[obj.title],vocab:words,examples:m.examples.slice((i*2)%Math.max(m.examples.length,1)).concat(m.examples).slice(0,Math.min(5,m.examples.length)),dialogue:m.dialogue,questions,addon:m.id===1?null:addons[m.id]||null});
}}
const examQuestions={};for(const level of ['A0','A1','A2','B1','B2']){const ls=lessons.filter(x=>x.level===level);const pool=ls.flatMap(x=>x.vocab);const pick=Array.from({length:20},(_,i)=>{const w=pool[(i*17)%pool.length],serbian=i%2===1;const answer=serbian?w.sr:w.ru;const candidates=pool.filter(x=>x.sr!==w.sr&&x.ru!==w.ru).map(x=>serbian?x.sr:x.ru);const opts=[answer,...candidates.slice(i*3,i*3+3),...candidates].filter((v,j,a)=>a.indexOf(v)===j).slice(0,4);opts.sort((a,b)=>crypto.createHash('sha256').update(level+i+a).digest('hex').localeCompare(crypto.createHash('sha256').update(level+i+b).digest('hex')));return{id:`${level}-ex${i+1}`,kind:'choice',prompt:serbian?`Напиши по-сербски: ${w.ru}`:`Переведи: ${w.sr}`,options:opts,answer};});examQuestions[level]=pick;}
const dictionary=new Map();for(const m of modules)for(const w of m.vocab){const id=w.sr.toLowerCase().normalize('NFKC').replace(/\s+/g,' ').trim();if(!dictionary.has(id))dictionary.set(id,{...w,id,level:m.level});}
const output={modules:modules.map(({id,level,name,desc,lessons})=>({id,level,name,desc,lessonCount:lessons.length})),lessons,examQuestions,dictionary:[...dictionary.values()],alphabet};
fs.writeFileSync(path.resolve(__dirname,'../src/content/catalog.json'),JSON.stringify(output,null,2));
const talk=new Map;const add=(s)=>{if(!s||typeof s!=='string')return;let norm=s.replace(/\s+/g,' ').trim();if(!norm)return;const id=crypto.createHash('sha256').update(norm.normalize('NFKC')).digest('hex').slice(0,20);talk.set(id,norm)};
for(const m of modules){for(const w of m.vocab){add(w.sr);add(w.usage)}for(const ex of m.examples)add(ex.sr);for(const d of m.dialogue)add(d.sr);for(const x of addons[m.id]?.[2]||[])add(x[0])}
// Include all lesson content actually displayed (same module-level pools).
fs.writeFileSync(path.resolve(__dirname,'../scripts/audio-phrases.json'),JSON.stringify([...talk].map(([id,text])=>({id,text,url:`/audio/${id}.mp3`})),null,2));
console.log('Original modules:',modules.length,'lessons:',lessons.length,'audio phrases:',talk.size,'exam items:',Object.keys(examQuestions).length*20);
