/** Public-catalog integrity. Answers are intentionally absent: server-side answer bank is private. */
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const c=require('../src/content/catalog.json');const manifest=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../public/audio/manifest.json')));
assert.equal(c.modules.length,31);assert.equal(c.lessons.length,265);
assert.deepEqual(Object.fromEntries(['A0','A1','A2','B1','B2'].map(l=>[l,c.lessons.filter(x=>x.level===l).length])),{A0:20,A1:42,A2:63,B1:70,B2:70});
assert.equal(c.dictionary.length,714);
const ids=new Set(),questionIds=new Set(),validLevel=new Set(['A0','A1','A2','B1','B2']);
let totalQuestions=0;
for(let i=0;i<c.lessons.length;i++){
 const l=c.lessons[i];assert.ok(validLevel.has(l.level));assert.equal(l.order,i+1);assert.ok(/^m\d+l\d+$/.test(l.id));assert.ok(!ids.has(l.id));ids.add(l.id);
 assert.ok(l.vocab.length>=8&&l.vocab.length<=15);assert.ok(l.note.length>25);assert.ok(l.examples.length>0);assert.ok(l.dialogue.length>0);
 assert.equal(l.questions.length,7);
 for(const q of l.questions){assert.ok(!questionIds.has(q.id));questionIds.add(q.id);totalQuestions++;
  assert.ok(typeof q.prompt==='string'&&q.prompt.trim().length>1,`invalid prompt ${q.id}`);
  assert.ok(['input','choice'].includes(q.kind),`invalid kind ${q.id}`);
  assert.ok(Array.isArray(q.options));
  if(q.kind==='choice')assert.ok(q.options.length>=2&&new Set(q.options).size===q.options.length,`invalid choice options ${q.id}`);
  else assert.equal(q.options.length,0,`input with choices ${q.id}`);
  assert.ok(!Object.hasOwn(q,'answer'),`secret answer exposed in public catalog: ${q.id}`);
 }
 for(const t of [...l.vocab.map(w=>w.sr),...l.vocab.map(w=>w.usage).filter(Boolean),...l.examples.map(x=>x.sr),...l.dialogue.map(x=>x.sr)]){
  const norm=t.replace(/\s+/g,' ').trim();const hash=crypto.createHash('sha256').update(norm.normalize('NFKC')).digest('hex').slice(0,20);
  assert.ok(manifest.entries[hash]&&fs.existsSync(path.resolve(__dirname,'../public/audio',hash+'.mp3')),'missing audio: '+norm);
 }
}
let examCount=0;
for(const level of validLevel){const qs=c.examQuestions[level];assert.equal(qs.length,20);for(const q of qs){assert.ok(!questionIds.has(q.id));questionIds.add(q.id);examCount++;
 assert.ok(q.options.length>=2&&q.kind==='choice'&&q.prompt.trim().length>1);
 assert.ok(!Object.hasOwn(q,'answer'),`secret exam answer exposed: ${q.id}`);
}}
console.log(`PASS: ${c.modules.length} modules, ${c.lessons.length} lessons, ${c.dictionary.length} dictionary items, ${examCount} public exam questions, ${totalQuestions} public lesson questions; mandatory original audio links complete. Private server answer bank not inspected.`);
