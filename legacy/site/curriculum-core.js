/* SrpskiLab — учебная программа. Редактируй данные в curriculum-*.js. */
window.SR_MODULES = [];
window.addSrModule = function addSrModule(level, name, desc, lessonLines, vocabLines, exampleLines, dialogueLines, extra={}) {
  const parse = s => s.trim().split('\n').map(l=>l.trim()).filter(Boolean);
  const lessons = parse(lessonLines).map(s=>{const p=s.split('::');return {title:p[0].trim(),note:(p.slice(1).join('::')||'Разбери лексику и примеры, затем выполни практические задания.').trim()};});
  const vocab = parse(vocabLines).map(s=>{const p=s.split(' = ');return {sr:p[0]?.trim(),ru:p[1]?.trim(),usage:p[2]?.trim()||'',usageRu:p[3]?.trim()||''};}).filter(w=>w.sr&&w.ru);
  const examples = parse(exampleLines).map(s=>{const p=s.split(' = ');return {sr:p[0]?.trim(),ru:p.slice(1).join(' = ').trim()};}).filter(x=>x.sr&&x.ru);
  const dialogue = parse(dialogueLines).map(s=>{const p=s.split(' = ');return {by:p[0]?.trim(),sr:p[1]?.trim(),ru:p.slice(2).join(' = ').trim()};}).filter(x=>x.by&&x.sr&&x.ru);
  const id=window.SR_MODULES.length+1;
  window.SR_MODULES.push({id,level,name,desc,lessons,vocab,examples,dialogue,...extra});
};
