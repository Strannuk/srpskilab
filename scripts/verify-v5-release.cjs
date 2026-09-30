#!/usr/bin/env node
/** Offline contract checks. These are NOT a substitute for Supabase integration tests. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const get = p=>fs.readFileSync(path.join(root,p),'utf8');
const json = p=>JSON.parse(get(p));
const catalog=json('src/content/catalog.json');
const units=json('src/content/capstones-b1-b2-v5.json');
const audio=json('src/content/audio-index.json');
const manifest=json('public/audio/manifest.json');
const migration=get('supabase/migrations/202609300003_reset_learning.sql');
const strict=get('supabase/manual/202609300004_reset_strict_rpc.sql');
const context=get('src/lib/session.tsx');
const settings=get('src/pages/Settings.tsx');
const queue=get('src/lib/offline.ts');
assert.equal(catalog.lessons.length,265);
assert.equal(units.length,14);
assert.equal(new Set(units.map(v=>v.id)).size,14);
assert(units.every(v=>catalog.lessons.some(x=>x.id===v.id)));
assert(units.every(v=>v.passage.trim().split(/\s+/).length>=105));
assert(units.every(v=>v.questions.length===4 && v.questions.every(q=>q.model.trim() && q.question.trim())));
assert.equal(new Set(units.map(v=>v.passage)).size,14);
for(const v of units){
 const id=audio[v.passage];assert(id,`no audio index for ${v.id}`);
 assert.equal(manifest.entries[id]?.url,`/audio/${id}.mp3`);
 assert(fs.statSync(path.join(root,`public/audio/${id}.mp3`)).size>5000);
}
for (const table of ['lesson_attempts','lesson_progress','exam_attempts','user_word_progress','word_review_events','legacy_imported_progress','legacy_exam_progress','import_jobs']){
 assert(migration.includes(`DELETE FROM public.${table} WHERE user_id=uid;`),`Reset does not clear ${table}`);
}
assert(migration.includes('SELECT auth.uid()'));
assert(migration.includes('FOR UPDATE'));
assert(migration.includes('pg_advisory_xact_lock'));
assert(migration.includes('learning_epoch=after_epoch'));
assert(migration.includes('Learning reset is disabled until the strict RPC revocation SQL is applied'));

assert(migration.includes("p_confirmation IS DISTINCT FROM 'СБРОСИТЬ'"));
assert(migration.includes('WHERE user_id=uid'));
assert(!migration.includes('DELETE FROM auth.users'));
assert(strict.includes('REVOKE EXECUTE ON FUNCTION public.submit_lesson_attempt_v3'));
assert(strict.includes('REVOKE EXECUTE ON FUNCTION public.submit_exam_attempt'));
assert(context.includes('reset_own_learning'));
assert(context.includes('clearQueueForUser(uid)'));
assert(context.includes('learningEpoch:requireEpoch()'));
assert(queue.includes('srpskilab-v5-capstone'));
assert(settings.includes('Сбросить результаты обучения'));
console.log(`PASS: ${catalog.lessons.length} stable lessons, ${units.length} new B1/B2 capstone workshops, ${units.length*4} new comprehension questions, all optional audio linked.`);
console.log('PASS: SQL reset contract: own auth.uid only; transaction; version-guard; known user tables; stale client mutations blocked by v4 RPCs + strict activation step.');
console.log('NOTE: PostgreSQL migrations not executed here. Real two-user RLS/reset test required on staging Supabase.');
