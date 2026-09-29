/** Automated structural/audio QA only. Human Serbian-editor review not represented here. */
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');const cp=require('node:child_process');
const c=require('../src/content/catalog.json');const passports=require('../docs/course-v3/lesson-passports.json');
const outlines=require('../src/content/editorial/workbooks-265.json');
const lessons=[1,2,3,4].flatMap(m=>[1,2,3,4,5].map(l=>require(`../supabase/private/pilot-editorial-originals/m${m}l${l}.json`)));
const a=require('../editorial/pilot-audio/manifest.json');
assert.equal(passports.length,265);assert.deepEqual(passports.map(x=>x.lessonId),c.lessons.map(x=>x.id));
assert.equal(outlines.length,265);assert.deepEqual(outlines.map(x=>x.id),c.lessons.map(x=>x.id));
assert.equal(new Set(outlines.map(x=>x.canDo)).size,265);
assert.equal(new Set(outlines.map(x=>x.independentListening.sr)).size,265);
for(const x of outlines){assert.equal(x.editorialStatus,'outline_only_not_published');assert.ok(x.controlledTasks.length===3);assert.ok(x.canDo.length>25);const audio=path.join(__dirname,'../public/audio',x.independentListening.audioId+'.mp3');assert.ok(fs.existsSync(audio),x.id+' missing source audio');}
const allPhrases=new Set(), allQIds=new Set(),allDialogueHashes=new Set();
const accentMap={a:'а',b:'б',c:'ц',č:'ч',ć:'ћ',d:'д',đ:'ђ',e:'е',f:'ф',g:'г',h:'х',i:'и',j:'ј',k:'к',l:'л',m:'м',n:'н',o:'о',p:'п',r:'р',s:'с',š:'ш',t:'т',u:'у',v:'в',z:'з',ž:'ж',lj:'љ',nj:'њ',dž:'џ'};
function transliterate(s){s=s.toLowerCase();let out='';for(let i=0;i<s.length;){let pair=s.slice(i,i+2);const key=['lj','nj','dž'].includes(pair)?pair:s[i];out+=accentMap[key]||key;i+=key.length;}return out;}
for(const l of lessons){
 assert.equal(l.contentVersion,2);assert.ok(l.editorialStatus.includes('draft'));assert.equal(l.words.length,10);
 assert.equal(new Set(l.words.map(x=>x.id)).size,10);assert.equal(l.quiz.length,7);assert.equal(l.guidedPractice.length,5);
 assert.ok(l.theory.length>=3);assert.ok(l.examples.length>=4);assert.ok(l.dialogue.turns.length>=4);
 const h=crypto.createHash('sha256').update(l.dialogue.turns.map(x=>x.sr).join('|')).digest('hex');
 assert.ok(!allDialogueHashes.has(h),'Duplicated pilot dialogue '+l.id);allDialogueHashes.add(h);
 for(const w of l.words){assert.equal(transliterate(w.sr),w.cyr.toLocaleLowerCase('sr'),`Bad Cyrillic for ${l.id}: ${w.sr}`);assert.ok(/^[\p{Script=Cyrillic}\s.,!?…:'"()\d-]+$/u.test(w.cyr),w.cyr);}
 const qs=[...l.quiz,...l.guidedPractice];for(const q of qs){assert.ok(q.prompt.length>10,q.id);assert.ok(q.answer,q.id);assert.ok(!allQIds.has(q.id),q.id);allQIds.add(q.id);if(q.kind==='choice')assert.ok(q.options.includes(q.answer),q.id);}
 for(const text of [...l.words.map(w=>w.sr),...l.examples.map(x=>x.sr),...l.dialogue.turns.map(x=>x.sr),l.listening.script])allPhrases.add(text);
 assert.notDeepEqual(l.dialogue.turns.map(x=>x.sr),c.lessons[l.order-1].dialogue.map(x=>x.sr));
 assert.equal(c.lessons[l.order-1].version,1,'do not change production score version');
}
assert.deepEqual(new Set(a.lessonIds),new Set(lessons.map(x=>x.id)));
assert.equal(a.reviewStatus,'UNREVIEWED_DEMO_ONLY');assert.equal(a.licensingStatus,'PENDING_REVIEW_DO_NOT_PUBLISH');
assert.deepEqual(new Set(Object.keys(a.entries)),allPhrases);
const probeAvailable=cp.spawnSync('ffprobe',['-version'],{encoding:'utf8',timeout:6000}).status===0;
for(const phrase of allPhrases){const ent=a.entries[phrase];assert.ok(ent?.file?.startsWith('/__pilot_audio/'),phrase);const file=path.join(__dirname,'../editorial/pilot-audio',path.basename(ent.file));assert.ok(fs.existsSync(file)&&fs.statSync(file).size>500,phrase);if(probeAvailable){const probe=cp.spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file],{encoding:'utf8',timeout:6000});assert.equal(probe.status,0,'ffprobe '+phrase);assert.ok(Number(probe.stdout.trim())>0.1,phrase);}}
if(!probeAvailable)console.warn('WARNING: ffprobe not installed; audio file presence checked but decodability NOT VERIFIED. Install FFmpeg and rerun.');
const main=fs.readFileSync(path.join(__dirname,'../src/main.tsx'),'utf8');assert.ok(main.includes("import.meta.env.DEV"));assert.ok(main.includes("import('./pages/CurriculumWorkshop')"));
console.log(`PASS: ${outlines.length} course OUTLINES (not lessons); ${lessons.length} manually authored draft pilots; ${lessons.length*10} checked Cyrillic pairs; ${lessons.length*7} local test items; ${allPhrases.size} technical audio samples (${probeAvailable?'ffprobe checked':'existence only'}). Production unchanged. No human/production verification.`);
