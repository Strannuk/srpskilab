/** Editorial tasks, NOT 265 full authored lessons. Uses stable can-do map & original source corpus. */
const fs=require('node:fs');const crypto=require('node:crypto');const path=require('node:path');
const catalog=require('../src/content/catalog.json');const passports=require('../docs/course-v3/lesson-passports.json');
const manifest=require('../public/audio/manifest.json');
const used=new Set();const workbooks=[];
const ctx={
 A0:{instruction:'Прочитай или произнеси короткую фразу, затем запиши свой ответ без подсказки.', rubric:['Узнаю нужные буквы и формы','Могу воспроизвести фразу сам','Понимаю бытовую цель']},
 A1:{instruction:'Построй ответ для новой бытовой ситуации своими словами, не копируя образец.',rubric:['Смысл понятен собеседнику','Нужные слова употреблены уместно','Форма соответствует изученному правилу']},
 A2:{instruction:'Разреши бытовую ситуацию: сформулируй просьбу и добавь уточнение.',rubric:['Правильно выбраны падежи/времена','Есть вежливая формулировка','Есть ответ на возможный встречный вопрос']},
 B1:{instruction:'Подготовь самостоятельное связное высказывание и объясни выбор конструкции.',rubric:['Есть связные причины и детали','Примеры не механически скопированы','Форма соответствует контексту и регистру']},
 B2:{instruction:'Разверни позицию, приведи пример, допусти возражение и выбери регистр.',rubric:['Есть логика и структура','Формулировка естественна для ситуации','Можешь перефразировать и уточнить смысл']},
};
const contextModes=[
 'Сообщение знакомому: тебе нужно решить задачу на сербском без готового образца.',
 'Короткий разговор с работником учреждения: уточни непонятное и добейся ответа.',
 'Небольшой телефонный разговор: собеседник просит пояснить одну деталь.',
 'Практика в Нови-Саде: представь, что собеседник не понимает русского.',
 'Сообщение в чате: исправь ситуацию вежливо и без канцеляризмов.',
 'Разговор с новым соседом: выбери подходящий уровень вежливости.',
 'Объяснение члену семьи: передай смысл сербского сообщения своими словами.',
 'Встреча по записи: измени условие и уточни время, место или причину.',
 'Ролевая игра: другая сторона задаёт неожиданный, но допустимый вопрос.',
 'Самопроверка: новый контекст отличается от примера, но цель та же.',
];
const norm=s=>s.replace(/\s+/gu,' ').trim();
for(let i=0;i<passports.length;i++){
 const p=passports[i],l=catalog.lessons[i],moduleLessons=catalog.lessons.filter(x=>x.moduleId===l.moduleId);
 if(p.lessonId!==l.id)throw Error('ID mismatch '+i);
 const phrases=[...moduleLessons.flatMap(x=>[...x.examples,...x.dialogue])].filter(x=>x.sr&&x.ru);
 const unique=[...new Map(phrases.map(x=>[norm(x.sr),x])).values()];
 const audioCandidates=unique.filter(x=>{const hash=crypto.createHash('sha256').update(norm(x.sr).normalize('NFKC')).digest('hex').slice(0,20);return manifest.entries[hash];});
 const choose=audioCandidates.find(x=>!used.has(norm(x.sr)))||audioCandidates[0];
 if(!choose)throw Error('No audio for '+p.lessonId);
 used.add(norm(choose.sr));
 const scene=contextModes[(l.order+l.moduleId)%contextModes.length];
 const words=p.vocabularyFirstAppearanceCandidate.length?p.vocabularyFirstAppearanceCandidate.slice(0,8):p.vocabularyForReviewCandidate.slice(0,8);
 const sourceWords=(words.length?words:l.vocab.slice(0,5)).map(x=>({sr:x.serbian||x.sr,ru:x.translation||x.ru,id:x.wordId||x.id}));
 const prev=l.order>1?catalog.lessons[l.order-2]:null;
 const instr=ctx[l.level];
 const sourceSnippets=[...new Map(l.examples.map(x=>[x.sr,x])).values()].slice(0,4);
 const workload=l.level==='A0'?['Назови две знакомые буквы или формулы.','Выполни цель без словаря на новом материале.','Произнеси ответ вслух и отметь место сомнения.']:l.level==='A1'?['Выдели изучаемую форму в двух репликах.','Составь собственный ответ без вариантов выбора.','Измени одну деталь ситуации и повтори ответ.']:l.level==='A2'?['Выдели форму, от которой зависит значение.','Выбери подходящий регистр обращения.','Составь ответ с дополнительным уточнением.']:l.level==='B1'?['Сформулируй тезис или последовательность действий.','Подкрепи его фактами на сербском.','Перескажи содержание по-другому, сохранив смысл.']:['Сформулируй основной аргумент.','Приведи пример и возможное возражение.','Перефразируй высказывание для другого адресата.'];
 workbooks.push({id:l.id,order:l.order,level:l.level,moduleId:l.moduleId,title:l.title,
  editorialStatus:'outline_only_not_published',contentVersion:l.version,canDo:p.canDo,
  previousLesson:prev?.id??null,languageFocusNote:l.note,extendedSourceNote:l.addon?.[1]??null,
  scenario:`${scene} Твоя конкретная задача: ${p.canDo.charAt(0).toLowerCase()+p.canDo.slice(1)}.`,
  newVocabulary:sourceWords,reviewVocabulary:p.vocabularyForReviewCandidate.slice(0,5),
  sourceExamples:sourceSnippets,
  independentListening:{sr:choose.sr,ru:choose.ru,audioId:crypto.createHash('sha256').update(norm(choose.sr).normalize('NFKC')).digest('hex').slice(0,20),
   question:`Прослушай фразу, не открывая перевод. Назови ключевую информацию и объясни, как она связана с навыком «${l.title}».`,source:'original_course_audio_unreviewed'},
  controlledTasks:workload.map((x,j)=>({id:`${l.id}-w${j+1}`,instruction:x,focus:p.canDo,wordHint:sourceWords[j%sourceWords.length]?.sr||null})),
  production:{instruction:instr.instruction,assignment:`${p.canDo}. ${scene}`,rubric:instr.rubric,autoGraded:false},
  nextStep:p.nextLesson,
  editorNotes:'СОСТОЯНИЕ: индивидуальный учебный КАРКАС, а не готовый 30–45-минутный урок. Для публикации нужны авторская теория, самостоятельный диалог, проверенный звук, задания и экспертная редактура.'});
}
if(workbooks.length!==265||new Set(workbooks.map(w=>w.canDo)).size!==265)throw Error('missing goals');
const out=path.join(__dirname,'../src/content/editorial');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'workbooks-265.json'),JSON.stringify(workbooks,null,2)+'\n');
console.log('EDITORIAL WORKBOOKS:',workbooks.length,'distinct lesson objectives,',used.size,'unique audio source phrases; CONTENT NOT PUBLISHED');
