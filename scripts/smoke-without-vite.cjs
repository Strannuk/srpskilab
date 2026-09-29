/** Offline smoke tests of real TypeScript modules (does not require Vite/Rollup). */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// Transpile the app's own TypeScript modules without mocking their business logic.
require.extensions['.ts'] = (mod, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
    resolveJsonModule: true,
  }}).outputText;
  mod._compile(compiled, filename);
};
const {audioUrl, normalizeAudioText} = require('../src/lib/audio.ts');
const {lessons, dictionary, toCyr, levelLessons} = require('../src/lib/catalog.ts');
const {canOpenLesson, canStartExam} = require('../src/lib/access.ts');
const done = id => ({lesson_id: id, status: 'completed', best_score: 72, last_score: 72});
const first = lessons[0], second = lessons[1], third = lessons[2];
assert.equal(canOpenLesson(first, {}, []), true);
assert.equal(canOpenLesson(second, {}, []), false);
assert.equal(canOpenLesson(second, {[first.id]: done(first.id)}, []), true);
assert.equal(canOpenLesson(third, {[first.id]: done(first.id)}, []), false);
const allA0 = Object.fromEntries(levelLessons('A0').map(l => [l.id, done(l.id)]));
assert.equal(canStartExam('A0', allA0), true);
assert.equal(canOpenLesson(levelLessons('A1')[0], allA0, []), false);
assert.equal(canOpenLesson(levelLessons('A1')[0], allA0, [{level:'A0', passed:true}]), true);
assert.equal(normalizeAudioText('  Вода  '), 'Voda');
assert.equal(audioUrl('voda'), audioUrl('Voda'));
assert.equal(audioUrl('Вода'), audioUrl('Voda'));
assert.equal(audioUrl(toCyr('Dobro jutro')), audioUrl('Dobro jutro'));
assert.equal(dictionary.length, 769);
assert(dictionary.every(word => audioUrl(word.sr)), 'All dictionary words must have MP3');
assert.equal(lessons.length, 265);
console.log('PASS: TypeScript audio URL normalisation, Cyrillic/Latin, all 769 dictionary words, sequential access and exams');
