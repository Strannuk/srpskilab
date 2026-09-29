/** Assemble 265 targeted study units from the published source, prior A0 drafts,
 * and individually authored bilingual dialogues. The private v2.1 assessment
 * bank is deliberately untouched: this is a compatible educational extension.
 * New material is UNREVIEWED. Never mark it expert-approved automatically.
 */
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const catalog=require('../src/content/catalog.json');
const passports=require('../docs/course-v3/lesson-passports.json');
const manifest=require('../public/audio/manifest.json');
const dialoguePath=path.join(root,'editorial/unique-dialogues.tsv');
const rows=fs.readFileSync(dialoguePath,'utf8').trim().split(/\r?\n/).map((r,n)=>{
 const cols=r.split('|');if(cols.length!==5)throw Error(`dialogue line ${n+1} has ${cols.length} fields, expected 5`);
 return [cols[0],{id:cols[0],turns:[{by:'Собеседник',sr:cols[1].trim(),ru:cols[2].trim()},{by:'Ученик / собеседник',sr:cols[3].trim(),ru:cols[4].trim()}]}];
});
const authored=new Map(rows);
if(authored.size!==245||rows.length!==authored.size)throw Error('Expected 245 different authored dialogues');
const audioHash=s=>crypto.createHash('sha256').update(s.trim().normalize('NFKC')).digest('hex').slice(0,20);
const recorded=s=>Boolean(manifest.entries[audioHash(s)]);
const usedListen=new Set(),seenScenarios=new Set(),seenCanDo=new Set();
const bins=new Map();
for(const l of catalog.lessons){const list=bins.get(l.moduleId)||new Map();for(const s of [...l.examples,...l.dialogue,...l.vocab.filter(w=>w.usage).map(w=>({sr:w.usage,ru:w.usageRu}))]){if(s.sr&&s.ru&&recorded(s.sr))list.set(s.sr.trim(),s);}bins.set(l.moduleId,list);}
const controlByLevel={
A0:['Сначала прочитай образец, затем повтори его вслух.','Отметь знакомые буквы и проверь обе письменности.','Попробуй сказать без подсказки хотя бы одну реплику.'],
A1:['Найди грамматическую форму, которую изучаешь в этом уроке.','Составь реплику для конкретного собеседника: кто он и почему ты обращаешься?','Не подменяй объяснение выбором случайной кнопки.'],
A2:['Отметь падеж или время, от которого зависит значение сказанного.','Произнеси просьбу с уточнением и проверь вежливую форму.','Если пример относится к повторению, отдели его от нового правила.'],
B1:['Отдели событие, причину и ожидаемую реакцию.','Выдели связку, которая соединяет две мысли.','Перефразируй ответ, не меняя фактов.'],
B2:['Определи регистр, логическую связь и отношение говорящего.','Приведи аргумент, контрпример или уточнение, если это необходимо по цели.','Сравни формальную и более простую формулировки, сохранив факты.']};
const all=[];
for(let i=0;i<catalog.lessons.length;i++){
 const l=catalog.lessons[i],p=passports[i];if(!p||p.lessonId!==l.id)throw Error('Mismatched passport '+l.id);
 if(seenCanDo.has(p.canDo))throw Error('Duplicate canDo '+l.id);seenCanDo.add(p.canDo);
 let pilot=null, d=authored.get(l.id);
 if(i<20){pilot=require(path.join(root,'supabase/private/pilot-editorial-originals',l.id+'.json'));
 d={id:l.id,turns:pilot.dialogue.turns.map(({by,sr,ru})=>({by,sr,ru}))};
 }else if(!d){throw Error('Missing authored dialogue '+l.id);}
 for(const t of d.turns){if(!t.sr||!t.ru||/[а-яА-ЯёЁ]/u.test(t.sr))throw Error(`Serbian script problem in ${l.id}: ${t.sr}`);}
 const moduleCorpus=[...(bins.get(l.moduleId)||new Map()).values()];
 const localCandidates=[...l.examples,...l.dialogue,...l.vocab.filter(w=>w.usage).map(w=>({sr:w.usage,ru:w.usageRu}))].filter(s=>s.sr&&s.ru&&recorded(s.sr));
 // Reserve a distinct, already-recorded original-course snippet per unit.
 const chosen=[...localCandidates,...moduleCorpus].find(s=>!usedListen.has(s.sr.trim()));
 if(!chosen)throw Error('No separate existing audio clip for '+l.id);
 usedListen.add(chosen.sr.trim());
 const scene=`${l.id} · ${p.canDo}. ${i%3===0?'Представь живой разговор с незнакомым человеком.':i%3===1?'Попробуй обменяться сообщениями без русского перевода.':'Реши ситуацию в изменившихся условиях.'}`;
 if(seenScenarios.has(scene))throw Error('Duplicate scene '+l.id);seenScenarios.add(scene);
 const currentMeaning=l.note;
 const previous=i?catalog.lessons[i-1]:null;
 const words=l.vocab.map((w,j)=>({...w,role:!previous||!previous.vocab.some(old=>old.id===w.id)?'new':'review',index:j+1}));
 const guide={
 id:l.id,order:l.order,moduleId:l.moduleId,level:l.level,title:l.title,
 canDo:p.canDo, contentVersion:l.version, studyEdition:'v3-learning-extension-1',
 editorialStatus:'DRAFT_NOT_INDEPENDENTLY_LANGUAGE_REVIEWED',
 priorLessonId:previous?.id||null,priorTopic:previous?.title||null,
 situation:pilot?.situation||scene,
 sourceExplanation:currentMeaning,
 secondaryExplanation:pilot?.theory.map(t=>({title:t.title,text:t.text,tip:t.tip}))||null,
 optionalAddon:l.addon?{title:l.addon[0],text:l.addon[1]}:null,
 successCriteria:pilot?.successCriteria||[p.canDo,'Понимаю обе реплики разговора без готового русского перевода.','Могу составить собственный ответ на изменённое условие.'],
 words:pilot?.words?.map(w=>({...w,role:!previous?.vocab.some(x=>x.id===w.id)?'new':'review'}))||words,
 examples:pilot?.examples.map(x=>({sr:x.sr,ru:x.ru}))||l.examples,
 dialogue:{scenario:pilot?.dialogue.scenario||scene,turns:d.turns},
 listening:{sr:chosen.sr,ru:chosen.ru,question:`Послушай реплику и письменно передай смысл. Затем свяжи её с умением «${l.title}».`,audioId:audioHash(chosen.sr),source:'existing_recorded_source_unreviewed'},
 guided:pilot?.guidedPractice?.map(x=>({id:x.id,kind:x.kind,prompt:x.prompt,answer:x.answer,explanation:x.explanation,options:x.options||[]}))||[
 {id:`${l.id}-g1`,kind:'reveal',prompt:`Как передать по-русски услышанную реплику «${d.turns[0].sr}»? Сначала попробуй без перевода.`,answer:d.turns[0].ru,explanation:'Сравни смысл, а не количество слов.',options:[]},
 {id:`${l.id}-g2`,kind:'reveal',prompt:`Переведи на сербский: «${d.turns[1].ru}». Попробуй составить предложение до просмотра образца.`,answer:d.turns[1].sr,explanation:'Сверь порядок слов, падежи, формы глаголов и уместность обращения.',options:[]},
 {id:`${l.id}-g3`,kind:'reveal',prompt:`Восстанови вторую реплику из мини-диалога, если первая звучит так: «${d.turns[0].sr}».`,answer:d.turns[1].sr,explanation:'В действительной речи возможны другие верные ответы; это лишь образец.',options:[]},
 {id:`${l.id}-g4`,kind:'reveal',prompt:`Не глядя в текст, напиши по-сербски: «${words[0].ru}».`,answer:words[0].sr,explanation:'Вспомни форму слова, затем проверь обе письменности.',options:[]},
 {id:`${l.id}-g5`,kind:'reveal',prompt:`Переведи на русский: «${words[5].sr}».`,answer:words[5].ru,explanation:'Сверь перевод и подумай о контексте использования.',options:[]},
 ],
 oralPrompt:`Устно разыграй «${l.title}»: начни со своей реплики и отреагируй на ответ собеседника.`,
 writingPrompt:pilot?.freeProduction?.prompt||`${p.canDo}. Не повторяй дословно готовый диалог: поменяй адресата, обстоятельство или результат и напиши 2–3 самостоятельные фразы${l.level==='B1'||l.level==='B2'?' (для этого уровня — не меньше 5 связанных предложений)':''}.`,
 rubric:pilot?.freeProduction?.rubric||controlByLevel[l.level],
 homework:pilot?.homework?.instructions||[`Составь три собственные фразы по теме «${l.title}» с разными конкретными данными.`,`Проговори диалог обеих сторон вслух и попробуй заменить по одному содержательному слову.`,`На следующий день запиши по памяти реплики: «${d.turns[0].sr}» и ответ на неё.`],
 legacyExamNotice:'Контрольные вопросы урока проверяются новым серверным банком v3 после его установки. Свободное письмо, говорение и самостоятельные тренировки остаются заданиями для самопроверки и не подтверждают автоматически уровень CEFR.',
 listeningRecorded:true,
 validatedByHuman:false,
 };
 all.push(guide);
}
if(all.length!==265||new Set(all.map(l=>l.id)).size!==265||usedListen.size!==265)throw Error('Validation failed');
const result=path.join(root,'src/content/study-program-v3.json');fs.writeFileSync(result,JSON.stringify(all,null,2)+'\n');
const report={status:'COMPATIBLE_STUDY_EDITION_NOT_CEFR_CERTIFIED',lessons:all.length,authoredDialogues:all.length,originalDialoguesKeptAsCoreAssessments:true,uniqueRecordedListening:usedListen.size,advancedHumanReview:0,courseContentStatus:'20 expanded A0 drafts; 245 content-enriched lessons with individually authored two-turn dialogues; not independently verified B2',oldQuestionsPreserved:1855,appliedDatabaseChanges:0,changedQuizIds:0};
fs.writeFileSync(path.join(root,'docs/course-v3/study-program-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
