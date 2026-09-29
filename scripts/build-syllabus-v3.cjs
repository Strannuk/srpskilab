/** Derive a non-destructive 265-lesson editorial planning register from the attached TZ + current catalog. */
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../src/content/catalog.json');
const source=fs.readFileSync(path.join(__dirname,'../docs/course-v3/content-spec.md'),'utf8');
const rows=[...source.matchAll(/\|\s*`(m\d+l\d+)`\s*\|([^|\r\n]+)\|([^|\r\n]+)\|/g)].map(x=>({id:x[1],title:x[2].trim(),canDo:x[3].trim()}));
if(rows.length!==265)throw Error('Cannot locate exactly 265 individually described skills in appendix: '+rows.length);
const seen=new Set(); const introducedWords=new Set();const pass=[];
const focusById={
 m1l1:'Соответствие 10 базовых слов сербской латиницы и кириллицы (J→Ј, V→В, C→Ц, S→С), без контроля букв из следующих уроков.',
 m1l2:'Связь фонем с буквами и чтение гласных и простых согласных в двухсложных словах.',
 m1l3:'Различать на слух/письме Č и Ć, Š и Ž, не заменять одну букву другой.',
 m1l4:'Lj→Љ, Nj→Њ, Dž→Џ, Đ→Ђ: соответствия диграфов и отдельных букв.',
 m1l5:'Объединение выученных букв в самостоятельное чтение коротких новых фраз.'};
for(let i=0;i<rows.length;i++){
 const r=rows[i],l=catalog.lessons[i];
 if(!l||l.id!==r.id)throw Error('Lesson ID mismatch at '+i+': '+(l?.id||'missing')+' vs '+r.id);
 if(seen.has(r.id))throw Error('Duplicate '+r.id);seen.add(r.id);
 const previous=catalog.lessons[i-1],next=catalog.lessons[i+1],intro=[],reuse=[];
 for(const word of l.vocab){const item={wordId:word.id,serbian:word.sr,translation:word.ru}; if(introducedWords.has(word.id))reuse.push(item);else{intro.push(item);introducedWords.add(word.id)}}
 pass.push({lessonId:r.id,order:l.order,level:l.level,moduleId:l.moduleId,title:r.title,
  canDo:r.canDo,
  languageFocusCandidate:focusById[r.id]||`Уточнить языковое средство для действия «${r.canDo}»; текущая заметка: ${l.note}`,
  prerequisites:previous?[previous.id]:[],
  vocabularyFirstAppearanceCandidate:intro,
  vocabularyForReviewCandidate:reuse,
  scenarioBrief:`Построить отдельную коммуникативную ситуацию, в которой ученик сможет: ${r.canDo.toLowerCase()}`,
  assessmentBrief:`Создать независимую проверку действия: ${r.canDo.toLowerCase()}; добавить новую ситуацию без готовой подсказки.`,
  audioRequirement:'Оригинальные записи каждой новой единицы, примеров, реплик и независимое задание на слух; лицензия и фонетическая проверка обязательны.',
  nextLesson:next?.id??null,
  draftStatus:'editorial_planning_only',
  reviewedBySerbianSpecialist:false,
  publishedV3:false,
  source:'ТЗ v3 приложение А + текущий src/content/catalog.json; кандидаты лексики НЕ выверенный словарный план.'
 });
}
const levels=['A0','A1','A2','B1','B2'];
let out='# SrpskiLab 3.0 — паспортный реестр 265 уроков\n\n';
out+='> **Стадия: редакторские черновики.** У каждого урока индивидуальная цель из Приложения А ТЗ; остальные поля ниже — кандидаты, полученные из старого каталога. Это НЕ написанные или проверенные уроки. Ни одна строка сама по себе не даёт разрешения `published`.\n\n';
for(const level of levels){out+=`## Уровень ${level}\n\n`;
 for(const m of catalog.modules.filter(x=>x.level===level)){
  out+=`### Модуль ${m.id}. ${m.name}\n\n`;
  for(const p of pass.filter(x=>x.moduleId===m.id)){
   out+=`#### ${p.lessonId} — ${p.title}\n\n**Проверяемый навык:** ${p.canDo}.\n\n`;
   out+=`**Новый фокус (черновик):** ${p.languageFocusCandidate}\n\n`;
   out+=`**Предпосылка:** ${p.prerequisites.join(', ')||'отсутствует — старт программы'}. **Дальше:** ${p.nextLesson||'конец программы'}.\n\n`;
   out+=`**Словарь, первоначальная оценка по первому появлению в старом каталоге:** ${p.vocabularyFirstAppearanceCandidate.map(w=>`${w.serbian} (${w.wordId})`).join(', ')||'пока новых единиц не определено'}.\n\n`;
   out+=`**Для повторения:** ${p.vocabularyForReviewCandidate.map(w=>w.serbian).join(', ')||'не выявлено автоматически'}.\n\n`;
   out+=`**Практический сценарий:** ${p.scenarioBrief}.\n\n`;
   out+=`**Оценка:** ${p.assessmentBrief}. **Аудио:** требует отдельного лицензированного файла и QA. **Статус:** план, нужна педагогическая и языковая редактура.\n\n`;
  }
 }
}
fs.writeFileSync(path.join(__dirname,'../docs/course-v3/syllabus-265.md'),out);
fs.writeFileSync(path.join(__dirname,'../docs/course-v3/lesson-passports.json'),JSON.stringify(pass,null,2)+'\n');
console.log(`GENERATED: ${pass.length} aligned lesson planning passports, ${seen.size} stable IDs; new-vocabulary classification provisional`);
