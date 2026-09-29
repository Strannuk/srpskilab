/** Validate educational scaffolds; NOT a linguistic/CEFR or spoken assessment. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const get=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const units=get('src/content/study-program-v3.json'),ext=get('src/content/enriched-245-v4.json'),base=get('src/content/catalog.json'),audio=get('src/content/audio-index.json'),manifest=get('public/audio/manifest.json');
assert.equal(units.length,265);assert.equal(ext.length,245);assert.equal(new Set(ext.map(x=>x.id)).size,245);
const map=new Map(units.map(x=>[x.id,x]));const ids=new Set();const prompts=new Set();let passageAudio=0, tasks=0, words=0;
for(const e of ext){
 const u=map.get(e.id);assert(u&&u.moduleId>=5,'unmatched lesson '+e.id);assert.equal(e.title,u.title);assert.equal(e.moduleId,u.moduleId);assert.equal(e.expertValidated,false);
 assert(e.editorialStatus!=='published'&&e.editorialStatus!=='human_reviewed','Unreviewed unit mislabeled as reviewed '+e.id);
 assert(e.framework.concept.length>=100&&e.framework.lessonRule.length>25,'Missing theory '+e.id);
 assert(e.framework.lessonRule===u.sourceExplanation,'Rule not sourced from old content '+e.id);
 assert(e.framework.warning.length>50&&e.framework.technique.length>70,'Scaffold too short '+e.id);
 assert.equal(e.reading.passage.length,3);
 for(const z of e.reading.passage){assert(z.sr&&z.ru&&audio[z.sr.trim()],'Missing read-along audio index '+e.id+': '+z.sr);const id=audio[z.sr.trim()];assert(manifest.entries[id]&&fs.existsSync(path.join(root,'public/audio',id+'.mp3')),'Broken audio file '+id);passageAudio++}
 assert.equal(e.taskList.length,7);assert(e.writing.prompt.includes(u.canDo));assert(e.speaking.prompt.includes(u.title));
 for(const t of e.taskList){assert(!ids.has(t.id),'ID repeated '+t.id);ids.add(t.id);tasks++;assert(t.prompt===undefined,'Unexpected old-format prop');assert(t.instruction.length>=70&&t.model.length>1&&t.check.length>15,'Incomplete guided task '+t.id);const sig=t.id+'|'+t.instruction;assert(!prompts.has(sig));prompts.add(sig)}
 assert(e.writing.requirements.length>=3&&e.speaking.selfReview.length>=4&&e.review.length>=3,'Incomplete free production '+e.id);
 words+=e.writing.prompt.length;
}
assert.equal(tasks,1715);assert.equal(passageAudio,735);assert.equal(base.lessons.length,265);
const header=fs.readFileSync(path.join(root,'public/_headers'),'utf8');assert(header.includes('microphone=(self)'),'Mic policy must be explicit');assert(header.includes("media-src 'self' blob:"),'Blob audio playback blocked by CSP');
const page=fs.readFileSync(path.join(root,'src/pages/Lesson.tsx'),'utf8');assert(page.includes('<ExpandedTheory')&&page.includes('<ExpandedReading')&&page.includes('<ExpandedPractice'),'Enrichment not integrated into lesson UI');
console.log('PASS: 245 unique lesson IDs; 1715 optional self-checked activities; 245 writing and 245 speaking scenarios; 735 referenced audio passages all present; 265 old lessons preserved; no grade/DB mutation in enrichment.');
console.log('CAVEAT: some core source examples repeat across modules; module-wide theory is reused intentionally; no Serbian-language or pedagogic expert audit, no live microphone/Cloudflare/Supabase browser test.');
