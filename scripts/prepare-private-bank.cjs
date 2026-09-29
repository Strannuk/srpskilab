/**
 * Reconstruct the *original v2.1* server answer bank from this project's own legacy
 * authoring sources. Verify every original public question, ID and option first.
 * This does NOT prepare the v3 draft bank, and does NOT connect to Supabase.
 * Output is in supabase/private/, excluded by .gitignore; never serve in frontend.
 * Run: node scripts/prepare-private-bank.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const source = path.resolve(__dirname,'../legacy/site');
const catalog = require('../src/content/catalog.json');
const ctx = {window:{}};ctx.window.window=ctx.window;ctx.addSrModule=(...args)=>ctx.window.addSrModule(...args);vm.createContext(ctx);
for(const file of ['curriculum-core.js','curriculum-a0-a1.js','curriculum-a2.js','curriculum-b1-b2.js','lesson-addons.js']){
 let js=fs.readFileSync(path.join(source,file),'utf8');
 if(file==='lesson-addons.js')js=js.replace('return {render,alphabet};','return {render,alphabet,refs};');
 vm.runInContext(js,ctx,{filename:file});
}
const modules=JSON.parse(JSON.stringify(ctx.window.SR_MODULES));
const legacyLessons=[];let order=0;
for(const m of modules)for(let i=0;i<m.lessons.length;i++){
 const id=`m${m.id}l${i+1}`;
 const vocab=Array.from({length:Math.min(11,m.vocab.length)},(_,n)=>({...m.vocab[(i*3+n)%m.vocab.length]}));
 const pool=Array.from({length:7},(_,n)=>m.vocab[(i*3+n)%m.vocab.length]);
 const questions=pool.map((w,n)=>{
  const answer=n%2===0?w.ru:w.sr;
  const wrongs=m.vocab.filter(x=>x.sr!==w.sr&&x.ru!==w.ru).map(x=>n%2===0?x.ru:x.sr);
  const options=n<4?[answer,...wrongs.slice(n,n+3),...wrongs.slice(0,3)].filter((x,k,a)=>a.indexOf(x)===k).slice(0,4):[];
  options.sort((a,b)=>crypto.createHash('sha256').update(id+n+a).digest('hex').localeCompare(crypto.createHash('sha256').update(id+n+b).digest('hex')));
  return {id:`${id}-q${n+1}`,kind:n<4?'choice':'input',prompt:n%2===0?`Переведи: ${w.sr}`:`Напиши по-сербски: ${w.ru}`,options,answer,ordinal:n+1};
 });
 legacyLessons.push({id,order:++order,level:m.level,questions,vocab});
}
assert.equal(catalog.lessons.length,265);
assert.equal(legacyLessons.length,265);
const qs=[];
for(const [i,old] of legacyLessons.entries()){
 const pub=catalog.lessons[i];
 assert.equal(pub.id,old.id);assert.equal(pub.order,old.order);assert.equal(pub.level,old.level);
 assert.equal(pub.questions.length,7);
 assert.equal(pub.vocab.length,old.vocab.length);
 for(const [n,q] of old.questions.entries()){
  const publicQuestion=pub.questions[n];
  assert.deepEqual(publicQuestion,{id:q.id,kind:q.kind,prompt:q.prompt,options:q.options},'Mismatch with public lesson question '+q.id);
  assert.ok(typeof q.answer==='string'&&q.answer.length>0,'empty correct answer '+q.id);
  qs.push({...q,lessonId:old.id});
 }
}
const exam=[];
for(const level of ['A0','A1','A2','B1','B2']){
 const ls=legacyLessons.filter(x=>x.level===level);
 const pool=ls.flatMap(x=>x.vocab);
 const questions=Array.from({length:20},(_,i)=>{
  const w=pool[(i*17)%pool.length],serbian=i%2===1;
  const answer=serbian?w.sr:w.ru;
  const candidates=pool.filter(x=>x.sr!==w.sr&&x.ru!==w.ru).map(x=>serbian?x.sr:x.ru);
  const opts=[answer,...candidates.slice(i*3,i*3+3),...candidates].filter((v,j,a)=>a.indexOf(v)===j).slice(0,4);
  opts.sort((a,b)=>crypto.createHash('sha256').update(level+i+a).digest('hex').localeCompare(crypto.createHash('sha256').update(level+i+b).digest('hex')));
  return{id:`${level}-ex${i+1}`,kind:'choice',prompt:serbian?`Напиши по-сербски: ${w.ru}`:`Переведи: ${w.sr}`,options:opts,answer,ordinal:i+1};
 });
 for(const [i,q] of questions.entries()){
  assert.deepEqual(catalog.examQuestions[level][i],{id:q.id,kind:q.kind,prompt:q.prompt,options:q.options},'Mismatch with public exam '+q.id);
  assert.ok(q.answer&&q.options.includes(q.answer),'bad exam answer '+q.id);
  exam.push({...q,level});
 }
}
assert.equal(qs.length,1855);assert.equal(exam.length,100);
const esc=s=>"'"+String(s).replace(/'/g,"''")+"'";
const seq = [
 '-- GENERATED PRIVATE ORIGINAL v2.1 QUESTION BANK. NEVER COMMIT OR PUBLISH.',
 '-- Reconstructed from legacy authoring source with FULL equality checks',
 '-- against all public lesson/exam question IDs, prompts, and choice options.',
 '-- Do not apply for v3 question IDs. Run only when BOTH old banks are empty.',
 'begin;',
 'do $guard$ begin',
 "  if (select count(*) from public.course_lessons) <> 265 then raise exception 'Expected 265 old course lessons'; end if;",
 "  if (select count(*) from private.lesson_question_bank) <> 0 then raise exception 'Lesson bank not empty; STOP, inspect existing data'; end if;",
 "  if (select count(*) from private.exam_question_bank) <> 0 then raise exception 'Exam bank not empty; STOP, inspect existing data'; end if;",
 "  if exists (select 1 from public.course_lessons where content_version <> 1) then raise exception 'Some lessons not at original version 1; STOP'; end if;",
 'end $guard$;',
];
for(const q of qs)seq.push(`insert into private.lesson_question_bank(lesson_id,question_id,ordinal,answer,accepted,content_version) values(${esc(q.lessonId)},${esc(q.id)},${q.ordinal},${esc(q.answer)},ARRAY[${esc(q.answer)}]::text[],1);`);
for(const q of exam)seq.push(`insert into private.exam_question_bank(level,question_id,ordinal,answer,accepted) values(${esc(q.level)},${esc(q.id)},${q.ordinal},${esc(q.answer)},ARRAY[${esc(q.answer)}]::text[]);`);
seq.push('do $check$ begin',
 "  if (select count(*) from private.lesson_question_bank) <> 1855 then raise exception 'Bank row count not 1855'; end if;",
 "  if (select count(*) from private.exam_question_bank) <> 100 then raise exception 'Exam row count not 100'; end if;",
 "  if exists (select 1 from public.course_lessons c left join private.lesson_question_bank b on b.lesson_id=c.id group by c.id having count(b.question_id)<>7) then raise exception 'One or more lessons have wrong question count'; end if;",
 'end $check$;',
 'commit;','');
const dir=path.resolve(__dirname,'../supabase/private');fs.mkdirSync(dir,{recursive:true});
const output=path.join(dir,'legacy-answer-bank-reviewed-source.sql');
fs.writeFileSync(output,seq.join('\n'),'utf8');
console.log('VERIFIED LEGACY question IDs/prompts/options vs public catalog; lesson='+qs.length+' exam='+exam.length);
console.log('PRIVATE file written: '+output+' ('+fs.statSync(output).size+' bytes). Contains teaching answers. NEVER COMMIT.');
