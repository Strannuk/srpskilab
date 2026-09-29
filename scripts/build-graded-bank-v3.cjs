/** Produce 265 distinct v3 assessments and a separate PRIVATE answer bank.
 * Never commit the answer SQL: it includes the expected answer to each question.
 * The old v2.1 bank and grading RPC are not modified.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const lessons=require('../src/content/catalog.json').lessons;
const study=require('../src/content/study-program-v3.json');
const privatePath=path.join(root,'supabase/private');fs.mkdirSync(privatePath,{recursive:true});
const escapeSql=v=>"'"+v.replaceAll("'","''")+"'";
const publicData={};let bank=[],errors=[];
function shuffleStable(pool,key){return [...pool].sort((a,b)=>crypto.createHash('sha256').update(key+'|'+a).digest('hex').localeCompare(crypto.createHash('sha256').update(key+'|'+b).digest('hex')))}
const fix=s=>s.normalize('NFC').trim().toLowerCase().replace(/[!?.,:;«»„“"'()—–]/g,'').replace(/\s+/g,' ');
function options(correct,candidates,key){
  const found=new Set([fix(correct)]);let result=[correct];for(const candidate of shuffleStable(candidates,key)){if(!candidate||found.has(fix(candidate)))continue;found.add(fix(candidate));result.push(candidate);if(result.length===4)break;}
  if(result.length!==4)throw Error('Need 4 distinct options at '+key);
  return shuffleStable(result,'shuffle:'+key);
}
function add(lessonId,idx,prompt,answer,optionsList,kind='choice'){
  if(!answer||answer.length>350||!prompt)throw Error('Empty or oversized answer '+lessonId+' '+idx);
  const id='v3-'+lessonId+'-q'+idx;
  if(kind==='choice'&&!optionsList.includes(answer))throw Error('Correct option missing '+id);
  const entry={id,kind,prompt,options:kind==='choice'?optionsList:[]};
  publicData[lessonId].push(entry);
  bank.push({lessonId,id,ordinal:idx,answer,accepted:[answer]});
}
for(const unit of study){
 const lesson=lessons.find(x=>x.id===unit.id);if(!lesson)throw Error('No base lesson '+unit.id);
 const group=study.filter(x=>x.moduleId===unit.moduleId);
 publicData[unit.id]=[];
 if(unit.moduleId<=4){const pilot=require(path.join(root,'supabase/private/pilot-editorial-originals',unit.id+'.json'));
   if(pilot.quiz.length!==7)throw Error('Pilot question count '+unit.id);
   for(let i=0;i<7;i++){const q=pilot.quiz[i];if(q.id!==`v3-${unit.id}-q${i+1}`)throw Error('Pilot id mismatch '+q.id);
    add(unit.id,i+1,q.prompt,q.answer,q.options||[],q.kind==='input'?'input':'choice');}
 }else{
  const A=unit.dialogue.turns[0],B=unit.dialogue.turns[1];
  const others=group.filter(x=>x.id!==unit.id);
  add(unit.id,1,'Переведи смысл реплики: '+A.sr,A.ru,options(A.ru,others.map(x=>x.dialogue.turns[0].ru),'1:'+unit.id));
  add(unit.id,2,'Переведи смысл ответа: '+B.sr,B.ru,options(B.ru,others.map(x=>x.dialogue.turns[1].ru),'2:'+unit.id));
  add(unit.id,3,'Выбери реплику по-сербски: '+A.ru,A.sr,options(A.sr,others.map(x=>x.dialogue.turns[0].sr),'3:'+unit.id));
  add(unit.id,4,'Выбери реплику по-сербски: '+B.ru,B.sr,options(B.sr,others.map(x=>x.dialogue.turns[1].sr),'4:'+unit.id));
  const ix=unit.order%11,jx=(unit.order+5)%11;
  const w=lesson.vocab[ix],v=lesson.vocab[jx],vocabPool=[...new Map(group.flatMap(g=>lessons.find(l=>l.id===g.id).vocab).map(w=>[w.id,w])).values()];
  add(unit.id,5,'Что означает выражение '+w.sr+'?',w.ru,options(w.ru,vocabPool.filter(x=>x.id!==w.id).map(x=>x.ru),'5:'+unit.id));
  add(unit.id,6,'Как по-сербски: '+v.ru+'?',v.sr,options(v.sr,vocabPool.filter(x=>x.id!==v.id).map(x=>x.sr),'6:'+unit.id));
  add(unit.id,7,'Какой ответ был в разговоре на реплику «'+A.sr+'»?',B.sr,options(B.sr,others.map(x=>x.dialogue.turns[1].sr),'7:'+unit.id));
 }
 if(publicData[unit.id].length!==7)errors.push(unit.id);
}
if(bank.length!==1855||Object.keys(publicData).length!==265||errors.length)throw Error('Bad assessment generation');
if(new Set(bank.map(x=>x.id)).size!==1855)throw Error('Question id reuse');
// Each question has enough distinct options and a precisely known answer.
fs.writeFileSync(path.join(root,'src/content/quiz-v3-public.json'),JSON.stringify(publicData,null,2)+'\n','utf8');
let sql=`-- PRIVATE v3 ANSWERS: generated from reviewed? NO. These materials require independent Serbian QA.\n-- Never add this file to GitHub or a Vite public directory.\n-- Run on your own Supabase only AFTER the public v3 schema/RPC migration.\n-- Re-running is safe only while this SAME bank is already present; changes require separate versioning.\nbegin;\ndo $guard$ begin\n if (select count(*) from public.course_lessons)<>265 then raise exception 'STOP: Expected exactly 265 course lesson records';end if;\n if to_regclass('private.lesson_question_bank_v3') is null then raise exception 'STOP: v3 schema migration not installed';end if;\n if exists (select 1 from public.course_lessons where study_content_version<>1) then raise exception 'STOP: v3 already active, do not overwrite live answers';end if;\n if (select count(*) from private.lesson_question_bank_v3)<>0 then raise exception 'STOP: v3 answer bank is not empty, do not overwrite';end if;\nend $guard$;\n`;
for(const r of bank){sql+='insert into private.lesson_question_bank_v3(lesson_id,question_id,ordinal,answer,accepted,content_version) values('+[escapeSql(r.lessonId),escapeSql(r.id),r.ordinal,escapeSql(r.answer),'ARRAY['+r.accepted.map(escapeSql).join(',')+']::text[]',2].join(',')+');\n'}
sql+=`do $check$ begin\n if (select count(*) from private.lesson_question_bank_v3)<>1855 then raise exception 'Incomplete answer bank';end if;\n if exists (select 1 from public.course_lessons l left join private.lesson_question_bank_v3 q on q.lesson_id=l.id group by l.id having count(q.question_id)<>7) then raise exception 'Every lesson must have 7 v3 questions';end if;\nend $check$;\ncommit;\n`;
fs.writeFileSync(path.join(privatePath,'v3-answer-bank-PRIVATE.sql'),sql,'utf8');
const stats={publicLessons:Object.keys(publicData).length,privateQuestions:bank.length,questionIds:bank.length,publicContainsAnswerField:JSON.stringify(publicData).includes('"answer"'),oldQuestionIdsTouched:false};
console.log(JSON.stringify(stats));
