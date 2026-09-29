#!/usr/bin/env node
/** Blocking audit of all audio played via <AudioButton>. Runs with Node only. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const load = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const catalog = load('src/content/catalog.json');
const units = load('src/content/study-program-v3.json');
const index = load('src/content/audio-index.json');
const manifest = load('public/audio/manifest.json');
const clean = (text) => text.normalize('NFKC').replace(/\s+/g, ' ').trim();
const norm = (text) => clean(text).toLocaleLowerCase('sr');
const canonical = new Map(Object.entries(index).map(([text, id]) => [norm(text), id]));
const texts = new Map();
function add(text, origin) {
  if (typeof text !== 'string' || !clean(text)) return;
  const term = clean(text);
  if (!texts.has(term)) texts.set(term, new Set());
  texts.get(term).add(origin);
}
for (const word of catalog.dictionary) {
  add(word.sr, 'dictionary'); add(word.usage, 'dictionary example');
}
for (const lesson of catalog.lessons) {
  for (const word of lesson.vocab || []) { add(word.sr, `${lesson.id} vocabulary`); add(word.usage, `${lesson.id} vocabulary example`); }
  for (const example of lesson.examples || []) add(example.sr, `${lesson.id} example`);
  for (const line of lesson.dialogue || []) add(line.sr, `${lesson.id} dialogue`);
  for (const row of lesson.addon?.[2] || []) add(row[0], `${lesson.id} additional example`);
}
for (const unit of units) {
  for (const word of unit.words || []) { add(word.sr, `${unit.id} study vocabulary`); add(word.usage, `${unit.id} study usage`); }
  for (const line of unit.dialogue.turns) add(line.sr, `${unit.id} study dialogue`);
  add(unit.listening.sr, `${unit.id} listening`);
}
add('Dobar dan!', 'settings audio test');
const problems = [];
for (const [text, origins] of texts) {
  const id = index[text] || canonical.get(norm(text));
  if (!id) { problems.push(`NO INDEX: ${JSON.stringify(text)} [${[...origins].slice(0, 3).join(', ')}]`); continue; }
  const file = path.join(root, 'public/audio', `${id}.mp3`);
  if (!manifest.entries[id]) problems.push(`NO MANIFEST: ${JSON.stringify(text)} => ${id}`);
  else if (manifest.entries[id].url !== `/audio/${id}.mp3`) problems.push(`BAD URL: ${JSON.stringify(text)} => ${id}`);
  if (!fs.existsSync(file) || fs.statSync(file).size <= 450) problems.push(`NO MP3: ${JSON.stringify(text)} => ${id}`);
}
for (const [text, id] of Object.entries(index)) {
  const file = path.join(root, 'public/audio', `${id}.mp3`);
  if (!manifest.entries[id] || !fs.existsSync(file)) problems.push(`BROKEN INDEX: ${JSON.stringify(text)} => ${id}`);
}
console.log('AudioButton text coverage:', texts.size);
console.log('Audio index entries:', Object.keys(index).length);
console.log('MP3 assets:', fs.readdirSync(path.join(root, 'public/audio')).filter(f => f.endsWith('.mp3')).length);
console.log('Broken/missing links:', problems.length);
if (problems.length) for (const issue of problems.slice(0, 30)) console.error(issue);
assert.equal(problems.length, 0, 'Not all AudioButton items have working MP3 references');
console.log('AUDIO COVERAGE PASSED — technical only; Serbian pronunciation requires human review');
