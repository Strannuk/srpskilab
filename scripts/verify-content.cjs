const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const c=require('../src/content/catalog.json');const manifest=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../public/audio/manifest.json')));
assert.equal(c.modules.length,31);assert.equal(c.lessons.length,265);
assert.deepEqual(Object.fromEntries(['A0','A1','A2','B1','B2'].map(l=>[l,c.lessons.filter(x=>x.level===l).length])),{A0:20,A1:42,A2:63,B1:70,B2:70});
assert.equal(c.dictionary.length,714);
let id=new Set();const validLevel=new Set(['A0','A1','A2','B1','B2']);let bank=new Set();
for(let i=0;i<c.lessons.length;i++){
 const l=c.lessons[i];assert.ok(validLevel.has(l.level));assert.equal(l.order,i+1);assert.ok(/^m\d+l\d+$/.test(l.id));assert.ok(!id.has(l.id));id.add(l.id);
 assert.ok(l.vocab.length>=8&&l.vocab.length<=15);assert.ok(l.note.length>25);assert.ok(l.examples.length>0);assert.ok(l.dialogue.length>0);
 assert.equal(l.questions.length,7);
 for(const q of l.questions){assert.ok(!bank.has(q.id));bank.add(q.id);assert.ok(q.answer&&q.prompt&&(!q.options.length||q.options.includes(q.answer)));}
 for(const t of [...l.vocab.map(w=>w.sr),...l.vocab.map(w=>w.usage).filter(Boolean),...l.examples.map(x=>x.sr),...l.dialogue.map(x=>x.sr)]){
  const norm=t.replace(/\s+/g,' ').trim();const hash=crypto.createHash('sha256').update(norm.normalize('NFKC')).digest('hex').slice(0,20);
  assert.ok(manifest.entries[hash]&&fs.existsSync(path.resolve(__dirname,'../public/audio',hash+'.mp3')),'missing audio: '+norm);
 }
}
for(const level of validLevel){const qs=c.examQuestions[level];assert.equal(qs.length,20);for(const q of qs){assert.ok(q.options.includes(q.answer));assert.equal(q.kind,'choice')}}
console.log('PASS: 31 modules, 265 lessons, 714 dictionary items, 100 exam questions, 1855 lesson questions and complete mandatory audio coverage');
