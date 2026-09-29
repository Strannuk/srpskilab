-- SrpskiLab v3 stage 3 (AFTER stage 1 schema & stage 2 PRIVATE bank are loaded).
-- Makes v3 RPC available. No deletion of accounts, past answers, or completion.
BEGIN;
DO $guard$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.course_lessons;
 IF n<>265 THEN RAISE EXCEPTION 'STOP: expected 265 lessons, found %',n; END IF;
 SELECT count(*) INTO n FROM private.lesson_question_bank_v3;
 IF n<>1855 THEN RAISE EXCEPTION 'STOP: expected 1855 v3 answers, found %',n; END IF;
 IF EXISTS(
   SELECT 1 FROM public.course_lessons l
   LEFT JOIN private.lesson_question_bank_v3 b ON b.lesson_id=l.id
   GROUP BY l.id HAVING count(b.question_id)<>7
 ) THEN RAISE EXCEPTION 'STOP: every lesson must have precisely seven new answers'; END IF;
 IF EXISTS (SELECT 1 FROM private.lesson_question_bank_v3 WHERE content_version<>2)
 THEN RAISE EXCEPTION 'STOP: bank version mismatch'; END IF;
 IF EXISTS(SELECT 1 FROM public.course_lessons WHERE study_content_version<>1)
 THEN RAISE EXCEPTION 'STOP: study content already activated; do not run activation again'; END IF;
END $guard$;
UPDATE public.course_lessons SET study_content_version=2 WHERE study_content_version=1;
COMMIT;
