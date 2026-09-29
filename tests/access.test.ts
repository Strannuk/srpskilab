import{describe,it,expect}from 'vitest';
import{canOpenLesson,lessonStatus,canStartExam}from '../src/lib/access';
import{lessons,levelLessons}from '../src/lib/catalog';
import type{LessonProgress,ExamAttempt}from '../src/lib/types';
const done=(l:string):LessonProgress=>({lesson_id:l,status:'completed',best_score:71,last_score:71,first_score:71,attempts_count:1,last_step:'result',completed_at:'2026-09-29T00:00:00Z',updated_at:'2026-09-29T00:00:00Z'});
describe('sequential lesson locks',()=>{
 it('opens only the first lesson to new learners',()=>{expect(canOpenLesson(lessons[0],{},[])).toBe(true);expect(canOpenLesson(lessons[1],{},[])).toBe(false);expect(lessonStatus(lessons[1],{},[])).toBe('locked')});
 it('opens N+1 only after N is completed',()=>{const p={[lessons[0].id]:done(lessons[0].id)};expect(canOpenLesson(lessons[1],p,[])).toBe(true);expect(canOpenLesson(lessons[2],p,[])).toBe(false)});
 it('preserves older completion when newer attempts are unsuccessful',()=>{const p={[lessons[0].id]:{...done(lessons[0].id),last_score:14}};expect(canOpenLesson(lessons[1],p,[])).toBe(true)});
 it('requires passed level exam to unlock the next level',()=>{const ls=levelLessons('A0');const p=Object.fromEntries(ls.map(l=>[l.id,done(l.id)]));const firstA1=levelLessons('A1')[0];expect(canStartExam('A0',p)).toBe(true);expect(canOpenLesson(firstA1,p,[])).toBe(false);expect(canOpenLesson(firstA1,p,[{level:'A0',score:80,passed:true,submitted_at:'2026-09-29'} as ExamAttempt])).toBe(true)});
 it('does not allow skipping intermediate lessons',()=>{const p={[lessons[0].id]:done(lessons[0].id),[lessons[3].id]:done(lessons[3].id)};expect(canOpenLesson(lessons[2],p,[])).toBe(false)});
});
