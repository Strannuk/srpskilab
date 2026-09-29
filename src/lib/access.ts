import{lessons,lessonIndex,levels,levelLessons}from './catalog';
import type{Lesson,LessonProgress,ExamAttempt,Level}from './types';
export type AccessState='locked'|'available'|'in_progress'|'completed';
export function canOpenLesson(lesson:Lesson,progress:Record<string,LessonProgress>,exams:ExamAttempt[]):boolean{
 if(progress[lesson.id]?.status==='completed')return true;
 const idx=lessonIndex.get(lesson.id);
 if(idx===undefined)return false;
 if(idx===0)return true;
 const previous=lessons[idx-1];
 if(progress[previous.id]?.status!=='completed')return false;
 if(previous.level!==lesson.level && !exams.some(e=>e.level===previous.level&&e.passed))return false;
 return true;
}
export function lessonStatus(lesson:Lesson,progress:Record<string,LessonProgress>,exams:ExamAttempt[]):AccessState{
 if(progress[lesson.id]?.status==='completed')return 'completed';
 if(!canOpenLesson(lesson,progress,exams))return 'locked';
 return progress[lesson.id]?'in_progress':'available';
}
export function nextLesson(progress:Record<string,LessonProgress>,exams:ExamAttempt[]){return lessons.find(l=>lessonStatus(l,progress,exams)!=='completed')||lessons.at(-1)!;}
export function canStartExam(level:Level,progress:Record<string,LessonProgress>){return levelLessons(level).every(l=>progress[l.id]?.status==='completed');}
export function completionPercent(level:Level|undefined,progress:Record<string,LessonProgress>){const list=level?levelLessons(level):lessons;return Math.round(list.filter(l=>progress[l.id]?.status==='completed').length/list.length*100)}
export function currentLevel(progress:Record<string,LessonProgress>){return (levels.find(level=>levelLessons(level).some(l=>progress[l.id]?.status!=='completed'))||'B2') as Level}
