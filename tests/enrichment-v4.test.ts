import {describe,it,expect} from 'vitest';
import catalog from '../src/content/catalog.json';
import study from '../src/content/study-program-v3.json';
import lessons from '../src/content/enriched-245-v4.json';
import audio from '../src/content/audio-index.json';

describe('v4 editorial supplementary lessons',()=>{
 it('maintains all 265 original stable IDs and adds all missing 245',()=>{
  expect(catalog.lessons.map(x=>x.id)).toEqual(study.map(x=>x.id));
  expect(lessons).toHaveLength(245);
  expect(new Set(lessons.map(x=>x.id)).size).toBe(245);
  expect(lessons.map(x=>x.id)).toEqual(study.slice(20).map(x=>x.id));
 });
 it('adds full seven-option self-checks and explicit written/spoken assignments',()=>{
  for(const x of lessons){expect(x.taskList).toHaveLength(7);expect(x.writing.prompt).toContain(study.find(s=>s.id===x.id)?.canDo);expect(x.speaking.prompt).toContain(x.title);expect(x.expertValidated).toBe(false)}
 });
 it('every read-along paragraph has a local audio index entry',()=>{
  for(const x of lessons)for(const p of x.reading.passage)expect((audio as Record<string,string>)[p.sr.trim()]).toBeTruthy();
 });
});
