const fs = require('fs');
const path = require('path');
const cat = require('../src/content/catalog.json');

const esc = (x) => `'${String(x).replace(/'/g, "''")}'`;
const dir = path.resolve(__dirname, '../supabase/migrations');
const rows = [
  '-- Generated from src/content/catalog.json; reproducible: npm run seed:generate',
  '-- Public seed only. The private answer bank must be loaded from a non-repository source.',
];

for (const lesson of cat.lessons) {
  rows.push(
    `insert into public.course_lessons(id,position,level,content_version,title,published) values(${esc(lesson.id)},${lesson.order},${esc(lesson.level)},${lesson.version},${esc(lesson.title)},true) on conflict(id) do update set title=excluded.title,content_version=excluded.content_version;`,
  );
}

const words = new Map(cat.dictionary.map((word) => [word.id, word]));
for (const word of words.values()) {
  rows.push(
    `insert into public.word_registry(id,sr,ru,usage,level) values(${esc(word.id)},${esc(word.sr)},${esc(word.ru)},${esc(word.usage || '')},${esc(word.level)}) on conflict(id) do update set sr=excluded.sr,ru=excluded.ru,usage=excluded.usage;`,
  );
}

fs.writeFileSync(path.join(dir, '202609290002_seed.sql'), `${rows.join('\n')}\n`);
console.log('Wrote public SQL seed:', rows.length, 'statements; words:', words.size);
