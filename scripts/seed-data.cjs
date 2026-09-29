const fs=require('fs'),path=require('path');
const cat=require('../src/content/catalog.json');
const esc=x=>"'"+String(x).replace(/'/g,"''")+"'";
const romanToCyr=(str)=>str.replace(/dž|lj|nj|[a-zčćđšž]/gi,t=>{const m={a:'а',b:'б',v:'в',g:'г',d:'д',đ:'ђ',e:'е',ž:'ж',z:'з',i:'и',j:'ј',k:'к',l:'л',lj:'љ',m:'м',n:'н',nj:'њ',o:'о',p:'п',r:'р',s:'с',t:'т',ć:'ћ',u:'у',f:'ф',h:'х',c:'ц',č:'ч',dž:'џ',š:'ш'};const v=m[t.toLowerCase()]||t;return t===t.toUpperCase()?v.toUpperCase():v;});
const accepted=q=>[q.answer,...(q.prompt.startsWith('Напиши по-сербски:')?[romanToCyr(q.answer)]:[])];
const dir=path.resolve(__dirname,'../supabase/migrations');
const rows=[];
rows.push('-- Generated from src/content/catalog.json; reproducible: npm run seed:generate');
rows.push('-- Server-side answer bank must NEVER be granted SELECT to regular users.');
for(const l of cat.lessons){rows.push(`insert into public.course_lessons(id,position,level,content_version,title,published) values(${esc(l.id)},${l.order},${esc(l.level)},${l.version},${esc(l.title)},true) on conflict(id) do update set title=excluded.title,content_version=excluded.content_version;`);
for(let i=0;i<l.questions.length;i++){const q=l.questions[i];rows.push(`insert into private.lesson_question_bank(lesson_id,question_id,ordinal,answer,accepted,content_version) values(${esc(l.id)},${esc(q.id)},${i+1},${esc(q.answer)},array[${accepted(q).map(esc).join(',')}]::text[],${l.version}) on conflict(question_id) do update set answer=excluded.answer,accepted=excluded.accepted,content_version=excluded.content_version;`);}}
for(const [level,qs] of Object.entries(cat.examQuestions))for(let i=0;i<qs.length;i++){const q=qs[i];rows.push(`insert into private.exam_question_bank(level,question_id,ordinal,answer,accepted) values(${esc(level)},${esc(q.id)},${i+1},${esc(q.answer)},array[${accepted(q).map(esc).join(',')}]::text[]) on conflict(question_id) do update set answer=excluded.answer,accepted=excluded.accepted;`);}
const words=new Map(cat.dictionary.map(w=>[w.id,w]));
for(const w of words.values())rows.push(`insert into public.word_registry(id,sr,ru,usage,level) values(${esc(w.id)},${esc(w.sr)},${esc(w.ru)},${esc(w.usage||'')},${esc(w.level)}) on conflict(id) do update set sr=excluded.sr,ru=excluded.ru,usage=excluded.usage;`);
fs.writeFileSync(path.join(dir,'202609290002_seed.sql'),rows.join('\n')+'\n');
console.log('Wrote SQL seed:',rows.length,'statements; words:',words.size);
