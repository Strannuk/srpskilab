-- SrpskiLab 2.1 — run in Supabase SQL Editor on a NEW project or via Supabase migrations.
-- This script is designed for PostgreSQL 15+ / Supabase. No service-role key in frontend.
create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Ученик' check (char_length(display_name) between 1 and 60),
  script text not null default 'latin' check (script in ('latin','cyrillic')),
  theme text not null default 'light' check (theme in ('light','dark','system')),
  daily_goal integer not null default 1 check (daily_goal between 1 and 10),
  timezone text not null default 'Europe/Belgrade',
  created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.course_lessons (
 id text primary key, position integer unique not null check(position>0), level text not null check(level in ('A0','A1','A2','B1','B2')),
 content_version integer not null default 1, title text not null, published boolean not null default true
);
create table if not exists private.lesson_question_bank (
 lesson_id text not null references public.course_lessons(id) on delete cascade,
 question_id text primary key, ordinal int not null, answer text not null, accepted text[] not null,content_version int not null default 1,
 unique(lesson_id,ordinal)
);
create table if not exists private.exam_question_bank (
 level text not null, question_id text primary key, ordinal int not null, answer text not null, accepted text[] not null,
 unique(level,ordinal)
);
create table if not exists public.lesson_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 lesson_id text not null references public.course_lessons(id),
 status text not null default 'in_progress' check(status in ('in_progress','completed')),
 first_score int check(first_score between 0 and 100),last_score int check(last_score between 0 and 100),
 best_score int not null default 0 check(best_score between 0 and 100),attempts_count int not null default 0,
 last_step text not null default 'theory' check(last_step in ('theory','vocabulary','dialogue','practice','quiz','result')),
 started_at timestamptz not null default now(),completed_at timestamptz,updated_at timestamptz not null default now(),
 content_version int not null default 1, primary key(user_id,lesson_id)
);
create table if not exists public.lesson_attempts (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 lesson_id text not null references public.course_lessons(id),attempt_key uuid not null,
 score int not null check(score between 0 and 100),passed boolean not null,
 answers_json jsonb not null,feedback_json jsonb not null,
 content_version int not null,submitted_at timestamptz not null default now(),unique(user_id,attempt_key)
);
create table if not exists public.exam_attempts (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 level text not null check(level in ('A0','A1','A2','B1','B2')),
 attempt_key uuid not null,score int not null check(score between 0 and 100),passed boolean not null,
 answers_json jsonb not null,feedback_json jsonb not null,submitted_at timestamptz not null default now(),unique(user_id,attempt_key)
);
create table if not exists public.word_registry (
 id text primary key, sr text not null, ru text not null, usage text not null default '',level text not null
);
create table if not exists public.user_word_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 word_id text not null references public.word_registry(id),stage int not null default 0 check(stage between 0 and 5),
 correct_count int not null default 0,incorrect_count int not null default 0,
 due_at timestamptz not null default now(),last_reviewed_at timestamptz,updated_at timestamptz not null default now(),
 primary key(user_id,word_id)
);
create table if not exists public.word_review_events (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 word_id text not null references public.word_registry(id),event_key uuid not null,
 grade text not null check(grade in ('again','hard','good','easy')),
 received_at timestamptz not null default now(),unique(user_id,event_key)
);
create table if not exists public.import_jobs (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 source_hash text not null,summary_json jsonb not null default '{}'::jsonb,snapshot_json jsonb not null default '{}'::jsonb,created_at timestamptz not null default now(),
 unique(user_id,source_hash)
);
create table if not exists public.legacy_imported_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 lesson_id text not null references public.course_lessons(id),legacy_score int not null,
 legacy_done boolean not null default false,
 imported_at timestamptz not null default now(),verified boolean not null default false,
 primary key(user_id,lesson_id)
);

create table if not exists public.legacy_exam_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 level text not null check (level in ('A0','A1','A2','B1','B2')),
 legacy_score int not null check (legacy_score between 0 and 100),
 legacy_passed boolean not null default false,imported_at timestamptz not null default now(),
 verified boolean not null default false,primary key(user_id,level)
);

-- Default: user has read access only to own rows; writes to course/progress/attempts via trusted RPCs.
DO $$DECLARE t text;BEGIN
 FOR t IN SELECT unnest(array['profiles','lesson_progress','lesson_attempts','exam_attempts','user_word_progress','word_review_events','import_jobs','legacy_imported_progress','legacy_exam_progress']) LOOP
 EXECUTE format('alter table public.%I enable row level security',t);
 EXECUTE format('revoke all on public.%I from anon, authenticated',t);
 EXECUTE format('grant select on public.%I to authenticated',t);
 EXECUTE format('drop policy if exists read_own on public.%I',t);
 EXECUTE format('create policy read_own on public.%I for select to authenticated using (user_id=(select auth.uid()))',t);
 END LOOP;
END $$;
alter table public.course_lessons enable row level security;
alter table public.word_registry enable row level security;
grant select on public.course_lessons,public.word_registry to anon,authenticated;
drop policy if exists public_read_lessons on public.course_lessons;
create policy public_read_lessons on public.course_lessons for select to anon,authenticated using (published);
drop policy if exists public_read_words on public.word_registry;
create policy public_read_words on public.word_registry for select to anon,authenticated using (true);

create or replace function public.on_signup_profile() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.profiles(user_id,display_name)
 values(new.id,left(coalesce(nullif(btrim(new.raw_user_meta_data->>'display_name'),''),'Ученик'),60))
 on conflict (user_id) do nothing;
 return new;
end$$;
drop trigger if exists create_profile on auth.users;
create trigger create_profile after insert on auth.users for each row execute procedure public.on_signup_profile();

create or replace function private.normalize_answer(input text) returns text language sql immutable set search_path=pg_catalog as $$
 select btrim(regexp_replace(regexp_replace(lower(coalesce(input,'')), '[!?.,:;«»„“"''()—–]', '', 'g'), '\s+', ' ', 'g'))
$$;
-- Trusted helper; uses the progress rows as the only source of truth.
create or replace function private.lesson_access(uid uuid,lid text) returns boolean language plpgsql stable security definer set search_path=public,private,pg_temp as $$
declare rec record; prev record;first_pos int; exam_needed boolean;
begin
 select * into rec from public.course_lessons where id=lid and published;
 if not found then return false;end if;
 if exists(select 1 from public.lesson_progress p where p.user_id=uid and p.lesson_id=lid and p.status='completed') then return true;end if;
 select min(position) into first_pos from public.course_lessons where published;
 if rec.position=first_pos then return true;end if;
 select * into prev from public.course_lessons where published and position<rec.position order by position desc limit 1;
 if prev.id is null or not exists(select 1 from public.lesson_progress p where p.user_id=uid and p.lesson_id=prev.id and p.status='completed') then return false;end if;
 if prev.level<>rec.level then
    select exists(select 1 from public.exam_attempts e where e.user_id=uid and e.level=prev.level and e.passed) into exam_needed;
    if not exam_needed then return false;end if;
 end if;
 return true;
end$$;

create or replace function public.can_open_lesson(p_lesson_id text) returns boolean language sql stable security definer set search_path=public,private,pg_temp as $$
 select (select auth.uid()) is not null and private.lesson_access((select auth.uid()),p_lesson_id)
$$;
revoke all on function public.can_open_lesson(text) from public;
grant execute on function public.can_open_lesson(text) to authenticated;

create or replace function public.save_profile(p_display_name text,p_script text,p_theme text,p_goal int)
returns public.profiles language plpgsql security definer set search_path=public,private,pg_temp as $$
declare uid uuid:=(select auth.uid()); p public.profiles;
begin
 if uid is null then raise exception 'not authenticated';end if;
 if length(trim(p_display_name)) not between 1 and 60 or p_script not in ('latin','cyrillic') or p_theme not in ('light','dark','system') or p_goal not between 1 and 10 then raise exception 'invalid profile';end if;
 update public.profiles set display_name=trim(p_display_name),script=p_script,theme=p_theme,daily_goal=p_goal,updated_at=now() where user_id=uid returning * into p;
 if not found then
 insert into public.profiles(user_id,display_name,script,theme,daily_goal) values(uid,trim(p_display_name),p_script,p_theme,p_goal) returning * into p;
 end if;
 return p;
end$$;
revoke all on function public.save_profile(text,text,text,int) from public;
grant execute on function public.save_profile(text,text,text,int) to authenticated;

create or replace function public.save_lesson_step(p_lesson_id text,p_step text)
returns boolean language plpgsql security definer set search_path=public,private,pg_temp as $$
declare uid uuid:=(select auth.uid());
begin
 if uid is null then raise exception 'not authenticated';end if;
 if p_step not in ('theory','vocabulary','dialogue','practice','quiz','result') then raise exception 'bad step';end if;
 if not private.lesson_access(uid,p_lesson_id) then raise exception 'lesson locked';end if;
 insert into public.lesson_progress(user_id,lesson_id,last_step) values(uid,p_lesson_id,p_step)
 on conflict(user_id,lesson_id) do update set last_step=excluded.last_step,updated_at=now();
 return true;
end$$;
revoke all on function public.save_lesson_step(text,text) from public;
grant execute on function public.save_lesson_step(text,text) to authenticated;

create or replace function public.submit_lesson_attempt(p_lesson_id text,p_attempt_key uuid,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare uid uuid:=(select auth.uid());rec record;bank record;n int:=0;hits int:=0;percent int;passed boolean;
 feedback jsonb:='[]'::jsonb;received text;valid boolean;existing record;ver int;
begin
 if uid is null then raise exception 'not authenticated';end if;
 if p_answers is null or jsonb_typeof(p_answers)<>'object' or octet_length(p_answers::text)>18000 then raise exception 'invalid answers';end if;
 select * into existing from public.lesson_attempts where user_id=uid and attempt_key=p_attempt_key;
 if found then return jsonb_build_object('score',existing.score,'passed',existing.passed,'feedback',existing.feedback_json,'duplicate',true);end if;
 -- Obtain row-level locks serializing concurrent attempts for the same account.
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 if not private.lesson_access(uid,p_lesson_id) then raise exception 'lesson locked';end if;
 select content_version into ver from public.course_lessons where id=p_lesson_id;
 for bank in select * from private.lesson_question_bank where lesson_id=p_lesson_id order by ordinal loop
    n:=n+1; received:=p_answers->>bank.question_id;
    if received is null or length(received)>350 then raise exception 'missing or oversized answer %',bank.question_id;end if;
    select exists(select 1 from unnest(bank.accepted) accepted where private.normalize_answer(accepted)=private.normalize_answer(received)) into valid;
    if valid then hits:=hits+1;end if;
    feedback:=feedback||jsonb_build_array(jsonb_build_object('id',bank.question_id,'correct',valid,'yourAnswer',received,'answer',bank.answer));
 end loop;
 if n<7 or (select count(*) from jsonb_object_keys(p_answers))<>n then raise exception 'invalid question set';end if;
 percent:=round(hits*100.0/n);passed:=percent>=70;
 insert into public.lesson_attempts(user_id,lesson_id,attempt_key,score,passed,answers_json,feedback_json,content_version)
 values(uid,p_lesson_id,p_attempt_key,percent,passed,p_answers,feedback,ver);
 insert into public.lesson_progress(user_id,lesson_id,status,first_score,last_score,best_score,attempts_count,completed_at,last_step,content_version)
 values(uid,p_lesson_id,case when passed then 'completed' else 'in_progress' end,percent,percent,percent,1,case when passed then now() else null end,'result',ver)
 on conflict(user_id,lesson_id) do update set
  status=case when public.lesson_progress.status='completed' or passed then 'completed' else 'in_progress' end,
  first_score=coalesce(public.lesson_progress.first_score,percent),last_score=percent,
  best_score=greatest(public.lesson_progress.best_score,percent),attempts_count=public.lesson_progress.attempts_count+1,
  completed_at=coalesce(public.lesson_progress.completed_at,case when passed then now() else null end),
  last_step='result',content_version=ver,updated_at=now();
 return jsonb_build_object('score',percent,'passed',passed,'feedback',feedback,'duplicate',false);
end$$;
revoke all on function public.submit_lesson_attempt(text,uuid,jsonb) from public;
grant execute on function public.submit_lesson_attempt(text,uuid,jsonb) to authenticated;

create or replace function public.submit_exam_attempt(p_level text,p_attempt_key uuid,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare uid uuid:=(select auth.uid()); bank record;last_pos int;n int:=0;hits int:=0;percent int;passed boolean;
 feedback jsonb:='[]'::jsonb;received text;valid boolean;existing record;
begin
 if uid is null then raise exception 'not authenticated';end if;
 if p_level not in ('A0','A1','A2','B1','B2') or p_answers is null or jsonb_typeof(p_answers)<>'object' or octet_length(p_answers::text)>40000 then raise exception 'invalid exam';end if;
 select * into existing from public.exam_attempts where user_id=uid and attempt_key=p_attempt_key;
 if found then return jsonb_build_object('score',existing.score,'passed',existing.passed,'feedback',existing.feedback_json,'duplicate',true);end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 if exists(select 1 from public.course_lessons l where l.level=p_level and l.published and not exists(select 1 from public.lesson_progress p where p.user_id=uid and p.lesson_id=l.id and p.status='completed')) then raise exception 'finish all lessons in this level';end if;
 for bank in select * from private.exam_question_bank where level=p_level order by ordinal loop
  n:=n+1;received:=p_answers->>bank.question_id;
  if received is null or length(received)>350 then raise exception 'missing answer';end if;
  select exists(select 1 from unnest(bank.accepted) accepted where private.normalize_answer(accepted)=private.normalize_answer(received)) into valid;
  if valid then hits:=hits+1;end if;
  feedback:=feedback||jsonb_build_array(jsonb_build_object('id',bank.question_id,'correct',valid,'yourAnswer',received,'answer',bank.answer));
 end loop;
 if n<>20 or (select count(*) from jsonb_object_keys(p_answers))<>n then raise exception 'invalid question set';end if;
 percent:=round(hits*100.0/n);passed:=percent>=80;
 insert into public.exam_attempts(user_id,level,attempt_key,score,passed,answers_json,feedback_json)
 values(uid,p_level,p_attempt_key,percent,passed,p_answers,feedback);
 return jsonb_build_object('score',percent,'passed',passed,'feedback',feedback,'duplicate',false);
end$$;
revoke all on function public.submit_exam_attempt(text,uuid,jsonb) from public;
grant execute on function public.submit_exam_attempt(text,uuid,jsonb) to authenticated;

create or replace function public.mark_words_seen(p_word_ids text[]) returns boolean language plpgsql security definer set search_path=public,private,pg_temp as $$
declare uid uuid:=(select auth.uid());
begin
 if uid is null then raise exception 'not authenticated';end if;
 if coalesce(array_length(p_word_ids,1),0)>50 then raise exception 'too many words';end if;
 insert into public.user_word_progress(user_id,word_id)
 select uid,w.id from public.word_registry w where w.id=any(p_word_ids) on conflict do nothing;
 return true;
end$$;
revoke all on function public.mark_words_seen(text[]) from public;
grant execute on function public.mark_words_seen(text[]) to authenticated;

create or replace function public.review_word(p_word_id text,p_grade text,p_event_key uuid) returns jsonb
language plpgsql security definer set search_path=public,private,pg_temp as $$
declare uid uuid:=(select auth.uid());old public.user_word_progress;next_stage int;days int;
begin
 if uid is null then raise exception 'not authenticated';end if;
 if p_grade not in ('again','hard','good','easy') or not exists(select 1 from public.word_registry where id=p_word_id) then raise exception 'invalid review';end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 if exists(select 1 from public.word_review_events where user_id=uid and event_key=p_event_key) then
  select * into old from public.user_word_progress where user_id=uid and word_id=p_word_id;
  return jsonb_build_object('stage',old.stage,'due_at',old.due_at,'duplicate',true);
 end if;
 insert into public.word_review_events(user_id,word_id,event_key,grade) values(uid,p_word_id,p_event_key,p_grade);
 select * into old from public.user_word_progress where user_id=uid and word_id=p_word_id;
 next_stage:=case when p_grade='again' then 0 when p_grade='hard' then greatest(1,coalesce(old.stage,0)) when p_grade='easy' then least(5,coalesce(old.stage,0)+2) else least(5,coalesce(old.stage,0)+1) end;
 days:=case next_stage when 0 then 0 when 1 then 1 when 2 then 3 when 3 then 7 when 4 then 14 else 30 end;
 insert into public.user_word_progress(user_id,word_id,stage,correct_count,incorrect_count,due_at,last_reviewed_at)
 values(uid,p_word_id,next_stage,case when p_grade='again' then 0 else 1 end,case when p_grade='again' then 1 else 0 end,
 now()+case when next_stage=0 then interval '5 minutes' else make_interval(days=>days) end,now())
 on conflict(user_id,word_id) do update set stage=next_stage,correct_count=public.user_word_progress.correct_count+case when p_grade='again' then 0 else 1 end,
 incorrect_count=public.user_word_progress.incorrect_count+case when p_grade='again' then 1 else 0 end,
 due_at=excluded.due_at,last_reviewed_at=now(),updated_at=now();
 select * into old from public.user_word_progress where user_id=uid and word_id=p_word_id;
 return jsonb_build_object('stage',old.stage,'due_at',old.due_at,'duplicate',false);
end$$;
revoke all on function public.review_word(text,text,uuid) from public;
grant execute on function public.review_word(text,text,uuid) to authenticated;

-- Old JSON does not have a cryptographic signature: legacy certificates and lessons never unlock protected course steps.
-- However, personal vocabulary reviews can be merged into the SRS because those data grant no lesson permissions.
create or replace function public.import_legacy_archive(p_source_hash text,p_lessons jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare uid uuid:=(select auth.uid());rec record;old_data jsonb;imported int:=0;words_imported int:=0;exams_imported int:=0;stage_value int;due_millis numeric;due_date timestamptz;legacy_score int;legacy_passed boolean;
begin
 if uid is null then raise exception 'not authenticated';end if;
 if p_source_hash !~ '^[a-f0-9]{64}$' or jsonb_typeof(p_lessons)<>'object' or p_lessons->>'version'<>'1' or octet_length(p_lessons::text)>750000 then raise exception 'invalid import';end if;
 if jsonb_typeof(p_lessons->'lessons')<>'object' or jsonb_typeof(p_lessons->'reviews')<>'object' or jsonb_typeof(p_lessons->'seen')<>'object' then raise exception 'invalid legacy structure';end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 if exists(select 1 from public.import_jobs where user_id=uid and source_hash=p_source_hash) then return jsonb_build_object('duplicate',true,'count',0,'words',0,'exams',0);end if;
 for rec in select key,value from jsonb_each(p_lessons->'lessons') loop
  if exists(select 1 from public.course_lessons where id=rec.key) and jsonb_typeof(rec.value)='object' then
   legacy_score:=case when (rec.value->>'best')~'^\d{1,3}$' then least(100,(rec.value->>'best')::int) else 0 end;
   legacy_passed:=case when jsonb_typeof(rec.value->'done')='boolean' then (rec.value->>'done')::boolean else false end;
   insert into public.legacy_imported_progress(user_id,lesson_id,legacy_score,legacy_done)
    values(uid,rec.key,legacy_score,legacy_passed)
    on conflict(user_id,lesson_id) do update set legacy_score=greatest(public.legacy_imported_progress.legacy_score,excluded.legacy_score),legacy_done=public.legacy_imported_progress.legacy_done or excluded.legacy_done;
   imported:=imported+1;
  end if;
 end loop;
 if jsonb_typeof(p_lessons->'exams')='object' then
 for rec in select key,value from jsonb_each(p_lessons->'exams') loop
  if rec.key in ('A0','A1','A2','B1','B2') and jsonb_typeof(rec.value)='object' then
    legacy_score:=case when (rec.value->>'best')~'^\d{1,3}$' then least(100,(rec.value->>'best')::int) else 0 end;
    legacy_passed:=case when jsonb_typeof(rec.value->'passed')='boolean' then (rec.value->>'passed')::boolean else false end;
    insert into public.legacy_exam_progress(user_id,level,legacy_score,legacy_passed) values(uid,rec.key,legacy_score,legacy_passed)
    on conflict(user_id,level) do update set legacy_score=greatest(public.legacy_exam_progress.legacy_score,excluded.legacy_score),legacy_passed=public.legacy_exam_progress.legacy_passed or excluded.legacy_passed;
    exams_imported:=exams_imported+1;
  end if;
 end loop;end if;
 for rec in select key,value from jsonb_each(p_lessons->'seen') loop
  if exists(select 1 from public.word_registry where id=rec.key) then
   insert into public.user_word_progress(user_id,word_id) values(uid,rec.key) on conflict do nothing;
   words_imported:=words_imported+1;
  end if;
 end loop;
 for rec in select key,value from jsonb_each(p_lessons->'reviews') loop
  if exists(select 1 from public.word_registry where id=rec.key) and jsonb_typeof(rec.value)='object' then
   stage_value:=case when (rec.value->>'stage')~'^\d$' then least(5,(rec.value->>'stage')::int) else 0 end;
   due_millis:=case when (rec.value->>'due')~'^\d{12,14}$' then (rec.value->>'due')::numeric else 0 end;
   due_date:=case when due_millis between 946684800000 and 4102444800000 then to_timestamp(due_millis/1000) else now() end;
   insert into public.user_word_progress(user_id,word_id,stage,due_at) values(uid,rec.key,stage_value,due_date)
   on conflict(user_id,word_id) do update set stage=greatest(public.user_word_progress.stage,excluded.stage),
     due_at=case when excluded.stage>public.user_word_progress.stage then excluded.due_at else public.user_word_progress.due_at end,updated_at=now();
  end if;
 end loop;
 insert into public.import_jobs(user_id,source_hash,summary_json,snapshot_json)
 values(uid,p_source_hash,jsonb_build_object('imported',imported,'words',words_imported,'exams',exams_imported),p_lessons);
 return jsonb_build_object('duplicate',false,'count',imported,'words',words_imported,'exams',exams_imported,'verification','legacy_unverified');
end$$;
revoke all on function public.import_legacy_archive(text,jsonb) from public;
grant execute on function public.import_legacy_archive(text,jsonb) to authenticated;

-- Destructive action is explicitly authenticated; Supabase Auth user removal requires an admin function (see function folder).
create index if not exists idx_progress_latest on public.lesson_progress(user_id,updated_at desc);
create index if not exists idx_words_due on public.user_word_progress(user_id,due_at);
create index if not exists idx_attempts_latest on public.lesson_attempts(user_id,submitted_at desc);
create index if not exists idx_exam_attempts on public.exam_attempts(user_id,level,submitted_at desc);
