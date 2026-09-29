-- SrpskiLab v3 stage 1: prepare a NEW versioned answer bank and grading RPC.
-- Safe to stage before deploying the new React app; do not run seed/reset scripts here.
-- IMPORTANT: Deploy on a staging Supabase project first and back up the production DB.
BEGIN;
ALTER TABLE public.course_lessons
 ADD COLUMN IF NOT EXISTS study_content_version integer NOT NULL DEFAULT 1
 CHECK (study_content_version BETWEEN 1 AND 2);

CREATE TABLE IF NOT EXISTS private.lesson_question_bank_v3 (
 lesson_id text NOT NULL REFERENCES public.course_lessons(id),
 question_id text PRIMARY KEY,
 ordinal integer NOT NULL CHECK (ordinal BETWEEN 1 AND 7),
 answer text NOT NULL,
 accepted text[] NOT NULL,
 content_version integer NOT NULL DEFAULT 2 CHECK (content_version=2),
 UNIQUE(lesson_id,ordinal)
);
REVOKE ALL ON private.lesson_question_bank_v3 FROM PUBLIC, anon, authenticated;
-- Add A0 pilot-specific words without deleting or renaming existing 714 entries.
INSERT INTO public.word_registry(id,sr,ru,usage,level) VALUES
 ('v3-m1l1-dan','dan','день','','A0'),
 ('v3-m1l1-more','more','море','','A0'),
 ('v3-m1l2-beba','beba','младенец','','A0'),
 ('v3-m1l3-noć','noć','ночь','','A0'),
 ('v3-m1l4-ljudi','ljudi','люди','','A0'),
 ('v3-m1l4-konj','konj','конь','','A0'),
 ('v3-m1l4-njena','njena','её','','A0'),
 ('v3-m1l4-džem','džem','джем','','A0'),
 ('v3-m1l4-džak','džak','мешок','','A0'),
 ('v3-m2l1-w7','Kako si?','Как ты?','','A0'),
 ('v3-m2l1-w8','Kako ste?','Как вы?','','A0'),
 ('v3-m2l1-w9','Dobro','Хорошо','','A0'),
 ('v3-m2l2-w3','Kako se zoveš?','Как тебя зовут?','','A0'),
 ('v3-m2l2-w4','Kako se zovete?','Как вас зовут?','','A0'),
 ('v3-m2l2-w9','I meni','Мне тоже','','A0'),
 ('v3-m2l3-w5','Ono','Оно','','A0'),
 ('v3-m2l3-w9','One','Они (женская группа)','','A0'),
 ('v3-m2l4-w4','Smo','(мы) есть','','A0'),
 ('v3-m2l4-w5','Ste','(вы) есть','','A0'),
 ('v3-m2l4-w6','Su','(они) есть','','A0'),
 ('v3-m2l4-w8','Nisi','(ты) не есть','','A0'),
 ('v3-m2l4-w9','Nije','(он/она) не есть','','A0'),
 ('v3-m2l4-w10','Nisu','(они) не есть','','A0'),
 ('v3-m2l5-w3','Da li','Ли (начало общего вопроса)','','A0'),
 ('v3-m2l5-w9','Jeste','Является / верно','','A0'),
 ('v3-m3l2-w2','Dvanaest','Двенадцать','','A0'),
 ('v3-m3l2-w3','Trinaest','Тринадцать','','A0'),
 ('v3-m3l2-w4','Petnaest','Пятнадцать','','A0'),
 ('v3-m3l2-w5','Sedamnaest','Семнадцать','','A0'),
 ('v3-m3l2-w8','Četrdeset','Сорок','','A0'),
 ('v3-m3l2-w9','Pedeset','Пятьдесят','','A0'),
 ('v3-m3l4-w1','Januar','Январь','','A0'),
 ('v3-m3l4-w2','Februar','Февраль','','A0'),
 ('v3-m3l4-w3','Mart','Март','','A0'),
 ('v3-m3l4-w4','April','Апрель','','A0'),
 ('v3-m3l4-w5','Maj','Май','','A0'),
 ('v3-m3l4-w6','Jun','Июнь','','A0'),
 ('v3-m3l4-w7','Jul','Июль','','A0'),
 ('v3-m3l4-w8','Avgust','Август','','A0'),
 ('v3-m3l4-w9','Septembar','Сентябрь','','A0'),
 ('v3-m3l4-w10','Oktobar','Октябрь','','A0'),
 ('v3-m3l5-w1','Koliko je sati?','Который час?','','A0'),
 ('v3-m3l5-w2','U koliko sati?','Во сколько?','','A0'),
 ('v3-m3l5-w8','Pola','Половина','','A0'),
 ('v3-m3l5-w9','Sat','Час','','A0'),
 ('v3-m3l5-w10','Minut','Минута','','A0'),
 ('v3-m4l1-w7','Dajte mi','Дайте мне','','A0'),
 ('v3-m4l1-w8','Koliko košta?','Сколько стоит?','','A0'),
 ('v3-m4l2-w4','Da, hvala.','Да, спасибо','','A0'),
 ('v3-m4l2-w5','Ne, hvala.','Нет, спасибо','','A0'),
 ('v3-m4l2-w7','Samo','Только','','A0'),
 ('v3-m4l2-w9','Ne treba mi','Мне не нужно','','A0'),
 ('v3-m4l3-w2','Gde je…?','Где находится…?','','A0'),
 ('v3-m4l4-w2','Kasnim','Опаздываю','','A0'),
 ('v3-m4l4-w3','Stižem','Подхожу / скоро буду','','A0')
ON CONFLICT(id) DO NOTHING;


CREATE OR REPLACE FUNCTION public.submit_lesson_attempt_v3(
 p_lesson_id text,p_attempt_key uuid,p_answers jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE
 uid uuid:=(SELECT auth.uid());
 bank record; existing public.lesson_attempts%ROWTYPE;
 n int:=0; hits int:=0; percent int; passed boolean; received text; valid boolean;
 feedback jsonb:='[]'::jsonb; current_version int;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
 IF p_attempt_key IS NULL OR p_answers IS NULL OR jsonb_typeof(p_answers)<>'object'
    OR octet_length(p_answers::text)>18000 THEN RAISE EXCEPTION 'invalid answers'; END IF;
 -- Lock all concurrent grade requests for this account to preserve history and idempotency.
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,0));
 SELECT * INTO existing FROM public.lesson_attempts
   WHERE user_id=uid AND attempt_key=p_attempt_key;
 IF FOUND THEN
   IF existing.lesson_id<>p_lesson_id OR existing.content_version<>2 THEN
     RAISE EXCEPTION 'attempt key used for another lesson or version';
   END IF;
   RETURN jsonb_build_object('score',existing.score,'passed',existing.passed,
     'feedback',existing.feedback_json,'duplicate',true);
 END IF;
 IF NOT private.lesson_access(uid,p_lesson_id) THEN RAISE EXCEPTION 'lesson locked'; END IF;
 SELECT study_content_version INTO current_version FROM public.course_lessons
   WHERE id=p_lesson_id AND published;
 IF current_version IS DISTINCT FROM 2 THEN
   RAISE EXCEPTION 'new study bank not activated for this lesson';
 END IF;
 FOR bank IN SELECT * FROM private.lesson_question_bank_v3
             WHERE lesson_id=p_lesson_id ORDER BY ordinal LOOP
   n:=n+1;
   received:=p_answers->>bank.question_id;
   IF received IS NULL OR length(received)>350 THEN
     RAISE EXCEPTION 'missing or oversized answer %',bank.question_id;
   END IF;
   SELECT EXISTS(SELECT 1 FROM unnest(bank.accepted) accepted
      WHERE private.normalize_answer(accepted)=private.normalize_answer(received)) INTO valid;
   IF valid THEN hits:=hits+1; END IF;
   feedback:=feedback||jsonb_build_array(jsonb_build_object('id',bank.question_id,
     'correct',valid,'yourAnswer',received,'answer',bank.answer));
 END LOOP;
 IF n<>7 OR (SELECT count(*) FROM jsonb_object_keys(p_answers))<>n THEN
   RAISE EXCEPTION 'invalid v3 question set';
 END IF;
 percent:=round(hits*100.0/n);
 passed:=percent>=70;
 INSERT INTO public.lesson_attempts
   (user_id,lesson_id,attempt_key,score,passed,answers_json,feedback_json,content_version)
 VALUES(uid,p_lesson_id,p_attempt_key,percent,passed,p_answers,feedback,2);
 INSERT INTO public.lesson_progress
   (user_id,lesson_id,status,first_score,last_score,best_score,
     attempts_count,completed_at,last_step,content_version)
 VALUES(uid,p_lesson_id,CASE WHEN passed THEN 'completed' ELSE 'in_progress' END,
   percent,percent,percent,1,CASE WHEN passed THEN now() ELSE null END,'result',2)
 ON CONFLICT(user_id,lesson_id) DO UPDATE SET
  status=CASE WHEN public.lesson_progress.status='completed' OR passed
      THEN 'completed' ELSE 'in_progress' END,
  first_score=coalesce(public.lesson_progress.first_score,percent),
  last_score=percent,
  best_score=greatest(public.lesson_progress.best_score,percent),
  attempts_count=public.lesson_progress.attempts_count+1,
  completed_at=coalesce(public.lesson_progress.completed_at,
    CASE WHEN passed THEN now() ELSE null END),
  last_step='result', content_version=2, updated_at=now();
 RETURN jsonb_build_object('score',percent,'passed',passed,'feedback',feedback,'duplicate',false);
END $$;
REVOKE ALL ON FUNCTION public.submit_lesson_attempt_v3(text,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_lesson_attempt_v3(text,uuid,jsonb) TO authenticated;
COMMIT;
