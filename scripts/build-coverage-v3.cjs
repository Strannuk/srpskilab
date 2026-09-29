const fs=require('node:fs');const path=require('node:path');
const passports=require('../docs/course-v3/lesson-passports.json');const dest=path.join(__dirname,'../docs/course-v3');
const csv=(a)=>`"${String(a??'').replaceAll('"','""')}"`;
let coverage='lesson_id,level,course_order,can_do,language_focus_candidate,scenario_candidate,prerequisite,review_status,spoken_checked,listening_checked,source\n';
let lex='lesson_id,level,word_id,serbian,ru_translation,role_candidate,review_status\n';
for(const p of passports){coverage+=[p.lessonId,p.level,p.order,p.canDo,p.languageFocusCandidate,p.scenarioBrief,p.prerequisites.join(','),p.draftStatus,'NO','NO','TZv3 Appendix A + existing content'].map(csv).join(',')+'\n';
for(const w of p.vocabularyFirstAppearanceCandidate)lex+=[p.lessonId,p.level,w.wordId,w.serbian,w.translation,'new_candidate','unreviewed'].map(csv).join(',')+'\n';
for(const w of p.vocabularyForReviewCandidate)lex+=[p.lessonId,p.level,w.wordId,w.serbian,w.translation,'review_candidate','unreviewed'].map(csv).join(',')+'\n';}
fs.writeFileSync(path.join(dest,'competence-matrix.csv'),coverage);fs.writeFileSync(path.join(dest,'lexical-plan.csv'),lex);console.log('COVERAGE written:',passports.length,'rows, lexical candidates:',lex.split('\n').length-2);
