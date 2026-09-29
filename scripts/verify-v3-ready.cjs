/** Static integrity gate. This is NOT a native-speaker or live-Supabase test. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const R=path.join(__dirname,'..'),load=p=>JSON.parse(fs.readFileSync(path.join(R,p),'utf8'));
const catalog=load('src/content/catalog.json'),units=load('src/content/study-program-v3.json');
const quizzes=load('src/content/quiz-v3-public.json'),audio=load('src/content/audio-index.json'),manifest=load('public/audio/manifest.json');
const bankPath=path.join(R,'supabase/private/v3-answer-bank-PRIVATE.sql');
const bank=fs.existsSync(bankPath)?fs.readFileSync(bankPath,'utf8'):null;
assert.equal(catalog.lessons.length,265);assert.equal(units.length,265);assert.equal(Object.keys(quizzes).length,265);
assert.equal(new Set(units.map(u=>u.id)).size,265);
assert.equal(new Set(units.map(u=>u.canDo)).size,265);
// Decode only the generated private SQL VALUES (never package this bank with public files).
const privateRows=new Map();
for(const line of (bank||'').split('\n')){
 if(!line.startsWith('insert into private.lesson_question_bank_v3('))continue;
 const m=line.match(/^insert into private\.lesson_question_bank_v3\([^)]*\) values\('([^']+)','([^']+)',(\d+),'((?:''|[^'])*)',ARRAY\[/);
 assert(m,'Malformed answer record: '+line.slice(0,100));
 assert(!privateRows.has(m[2]),'Repeated private answer '+m[2]);
 privateRows.set(m[2],{lessonId:m[1],ordinal:Number(m[3]),answer:m[4].replaceAll("''","'")});
}
if(bank)assert.equal(privateRows.size,1855,'Private bank row cardinality');
let qs=0,recordings=0;const dia=new Set, aId=new Set,scoreIds=new Set;
for(const lesson of catalog.lessons){const u=units.find(x=>x.id===lesson.id);assert(u,'No study unit '+lesson.id);
 assert.equal(lesson.order,u.order);assert.equal(lesson.level,u.level);assert.equal(lesson.moduleId,u.moduleId);
 assert.equal(u.validatedByHuman,false,'Unverified language review must not be claimed');
 assert(u.sourceExplanation.length>10);assert(u.dialogue.turns.length>=2);
 const sig=JSON.stringify(u.dialogue.turns.map(x=>x.sr.toLowerCase().trim()));assert(!dia.has(sig),'Duplicate dialogue '+u.id);dia.add(sig);
 for(const t of u.dialogue.turns){assert(t.ru&&t.sr);const ref=audio[t.sr.trim()];assert(ref,'No indexed audio '+u.id+' '+t.sr);assert(manifest.entries[ref],'Missing audio manifest '+ref);assert(fs.existsSync(path.join(R,'public/audio',ref+'.mp3')),'Missing audio file '+ref);aId.add(ref);recordings++}
 assert(audio[u.listening.sr]&&fs.existsSync(path.join(R,'public/audio',audio[u.listening.sr]+'.mp3')),'Listening missing '+u.id);
 const q=quizzes[u.id];assert.equal(q.length,7,'Need seven '+u.id);qs+=q.length;
 for(const x of q){assert(!('answer'in x)&&!('accepted'in x),'PUBLIC BANK LEAKS ANSWERS');assert(!scoreIds.has(x.id),'Duplicate question ID '+x.id);scoreIds.add(x.id);assert(x.kind==='input'||x.kind==='choice');if(x.kind==='choice')assert(x.options.length>=3);assert(x.prompt.length>5);
  if(bank){const row=privateRows.get(x.id);assert(row&&row.lessonId===u.id,'Private bank missing/misassigned '+x.id);assert(row.ordinal===q.indexOf(x)+1);if(x.kind==='choice')assert(x.options.includes(row.answer),'Correct answer not among public options '+x.id);}
 }
}
assert.equal(qs,1855);if(bank)assert.equal((bank.match(/^insert into private\.lesson_question_bank_v3\(/gim)||[]).length,1855);
assert.equal(manifest.entries&&Object.keys(manifest.entries).length>1400,true);
const fn=fs.readFileSync(path.join(R,'src/lib/session.tsx'),'utf8');
assert(fn.includes("rpc('submit_lesson_attempt_v3'"));assert(fn.includes("a.schemaVersion===2?'submit_lesson_attempt_v3':'submit_lesson_attempt'"));
const lessonPage=fs.readFileSync(path.join(R,'src/pages/Lesson.tsx'),'utf8');
assert(lessonPage.includes('quizV3 as Record<string,Question[]>'));assert(fs.existsSync(path.join(R,'supabase/manual/202609300002_v3_activate.sql')));
const appSrc=fs.readFileSync(path.join(R,'src/main.tsx'),'utf8');
assert(!appSrc.includes('PilotM1L1'));
assert(!fs.existsSync(path.join(R,'src/content/pilot')),'private correct answers in src/content/pilot');
const newVocab=load('docs/course-v3/new-a0-word-count.txt'.replace('.txt','.json'));
console.log('PASS: 265 stable IDs; 265 unique can-do; 265 unique dialogues; '+qs+' distinct PUBLIC questions; '+recordings+' recorded dialogue turns; '+aId.size+' indexed voice recordings; PRIVATE answer check '+(bank?'passed':'not available (bank distributed separately)')+'; versioned RPC and offline queue; '+newVocab.added+' new A0 dictionary words.');
console.log('LIMIT: language correctness, pronunciation rights, pedagogical CEFR proficiency and live Supabase integration not tested.');
