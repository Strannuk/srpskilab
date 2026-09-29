const fs=require('node:fs');const path=require('node:path');const l=require('../supabase/private/pilot-editorial-originals/m1l1.json');
let doc=`# Урок ${l.id}: ${l.title}\n\n**Версия:** ${l.contentVersion}; **уровень:** ${l.level}; **статус:** авторский черновик, не проверен специалистом по сербскому.\n\n`;
doc+=`## Наблюдаемый результат\n\n${l.canDo}\n\n${l.situation}\n\n`;doc+=`**Критерии:** ${l.successCriteria.join(' ')}\n\n`;
doc+=`## Разминка\n\n${l.warmup.instruction}\n\n${l.warmup.prompt}\n\n`;
for(const t of l.theory)doc+=`### ${t.title}\n\n${t.text}\n\n> ${t.tip}\n\n`;
doc+=`## Буквы\n\n| Латиница | Кириллица |\n|---|---|\n${l.letterPairs.map(x=>`| ${x[0]} | ${x[1]} |`).join('\n')}\n\n`;
doc+=`## Словарь\n\n| Латиница | Кириллица | Русский | Комментарий |\n|---|---|---|---|\n${l.words.map(x=>`| ${x.sr} | ${x.cyr} | ${x.ru} | ${x.note} |`).join('\n')}\n\n`;
doc+=`## Примеры\n\n${l.examples.map(x=>`- **${x.sr} → ${x.cyr}** — ${x.ru}`).join('\n')}\n\n`;
doc+=`## Диалог: ${l.dialogue.scenario}\n\n${l.dialogue.turns.map(x=>`**${x.by}:** ${x.sr} — ${x.ru}`).join('\n\n')}\n\n`;
doc+=`## Аудирование (не показывать скрипт до ответа)\n\n${l.listening.instruction}\n\n**Вопрос:** ${l.listening.question}\n\n${l.listening.options.map(o=>`- ${o}`).join('\n')}\n\n**Преподавателю:** скрипт «${l.listening.script}». Ответ: ${l.listening.answer}. Объяснение: ${l.listening.explanation}.\n\n`;
doc+=`## Управляемая практика\n\n${l.guidedPractice.map((x,i)=>`${i+1}. ${x.prompt}\n   Ответ: ${x.answer}; объяснение: ${x.explanation}`).join('\n\n')}\n\n`;
doc+=`## Самостоятельный контроль: все десять слов\n\nУченик получает только латинскую форму и пишет кириллицу **без готовых вариантов**. Для цели урока требуется 10/10. ${l.words.map(x=>x.sr).join(', ')}.\n\n`;
doc+=`## Итоговый локальный тест (семь задач, 70%)\n\n${l.quiz.map((x,i)=>`${i+1}. ${x.prompt}\n   Ответ: **${x.answer}**. Разбор: ${x.explanation}`).join('\n\n')}\n\n`;
doc+=`## Свободная задача и домашняя работа\n\n${l.freeProduction.prompt}\n\nКритерии самопроверки: ${l.freeProduction.rubric.join('; ')}.\n\n${l.homework.instructions.map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\n${l.homework.next}\n\n`;
doc+=`## Границы готовности\n\nИсходный курс и серверный банк ответов не заменены. Локальное тестирование не означает зачёт в Supabase. 23 синтетических демозаписи eSpeak не имеют языковой и лицензионной экспертизы; фразы и звуковые соответствия нужно сверить с компетентным сербоязычным специалистом. Перед публикацией обязательны согласованная SQL-миграция и пользовательское испытание.\n`;
fs.writeFileSync(path.join(__dirname,'../docs/course-v3/lesson-m1l1-manuscript.md'),doc);
const audit=require('../docs/course-v3/content-audit.json');let duplicates='# Дубли в исходной программе v2.1\n\nИсходные данные для редакторской работы. Похожие вежливые формулы сами по себе не ошибка.\n\n';
for(const [label,groups] of [['Полные совпадения диалогов',audit.dialogueGroups],['Полные совпадения массивов примеров',audit.exampleGroups],['Полные совпадения словарей',audit.identicalVocabularyGroups]]){
 duplicates+=`## ${label}\n\n`;for(const ids of groups)duplicates+=`- ${ids.join(', ')}\n`;duplicates+='\n';}
duplicates+='## Повторяющиеся формулировки проверочных вопросов\n\nНиже 25 наиболее частых групп (из '+audit.repeatedQuestionPrompts+').\n\n';
for(const a of audit.topRepeatedQuestions)duplicates+=`- **${a.prompt}**: ${a.ids.join(', ')}\n`;
fs.writeFileSync(path.join(__dirname,'../docs/course-v3/duplicate-report.md'),duplicates);
console.log(`MANUSCRIPT exported ${doc.length} chars, DUPLICATE report ${duplicates.length} chars`);
