-- SrpskiLab: authenticated learning reset with cross-device stale-request protection.
-- Apply on staging first. Install BEFORE the frontend release; activation of strict
-- legacy RPC revocation is a separate, later operator step.
-- No user accounts, email addresses, preferences or course/answer bank are deleted.
BEGIN;

ALTER TABLE public.profiles
 ADD COLUMN IF NOT EXISTS learning_epoch uuid NOT NULL DEFAULT gen_random_uuid(),
 ADD COLUMN IF NOT EXISTS learning_reset_at timestamptz;

-- Server-authenticated, per-account, transactional reset. No caller-controlled user_id.
-- Expects the epoch previously read from this account's profile, to avoid a stale tab
-- resetting data the user just created after a different tab already reset the course.
CREATE OR REPLACE FUNCTION public.reset_own_learning(
 p_confirmation text,
 p_expected_epoch uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public,private,pg_temp AS $$
DECLARE
 uid uuid := (SELECT auth.uid());
 before_epoch uuid;
 after_epoch uuid := gen_random_uuid();
 lesson_count integer;
 exam_count integer;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
 IF p_confirmation IS DISTINCT FROM 'СБРОСИТЬ' THEN
   RAISE EXCEPTION 'Invalid confirmation' USING ERRCODE='22023';
 END IF;
 IF p_expected_epoch IS NULL THEN
   RAISE EXCEPTION 'Missing learning epoch' USING ERRCODE='22023';
 END IF;
 -- Refuse destructive reset while unguarded legacy mutation RPCs are exposed.
 -- This prevents stale devices restoring deleted progress before strict activation.
 IF has_function_privilege('authenticated','public.submit_lesson_attempt_v3(text,uuid,jsonb)','EXECUTE')
    OR has_function_privilege('authenticated','public.submit_lesson_attempt(text,uuid,jsonb)','EXECUTE')
    OR has_function_privilege('authenticated','public.submit_exam_attempt(text,uuid,jsonb)','EXECUTE')
    OR has_function_privilege('authenticated','public.save_lesson_step(text,text)','EXECUTE')
    OR has_function_privilege('authenticated','public.mark_words_seen(text[])','EXECUTE')
    OR has_function_privilege('authenticated','public.review_word(text,text,uuid)','EXECUTE')
    OR has_function_privilege('authenticated','public.import_legacy_archive(text,jsonb)','EXECUTE') THEN
   RAISE EXCEPTION 'Learning reset is disabled until the strict RPC revocation SQL is applied' USING ERRCODE='55000';
 END IF;
 -- Same advisory lock is used by grading and review procedures in this schema.
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,0));
 SELECT learning_epoch INTO before_epoch
 FROM public.profiles WHERE user_id=uid FOR UPDATE;
 IF NOT FOUND OR before_epoch IS DISTINCT FROM p_expected_epoch THEN
   RAISE EXCEPTION 'Learning data changed on another device; reload and retry' USING ERRCODE='40001';
 END IF;
 SELECT count(*) INTO lesson_count FROM public.lesson_progress WHERE user_id=uid;
 SELECT count(*) INTO exam_count FROM public.exam_attempts WHERE user_id=uid;
 -- Preserve the profile and all non-user content. Clear both trusted and legacy
 -- progress, SRS history, and import tracking to allow a genuinely fresh start.
 DELETE FROM public.lesson_attempts WHERE user_id=uid;
 DELETE FROM public.exam_attempts WHERE user_id=uid;
 DELETE FROM public.lesson_progress WHERE user_id=uid;
 DELETE FROM public.word_review_events WHERE user_id=uid;
 DELETE FROM public.user_word_progress WHERE user_id=uid;
 DELETE FROM public.legacy_imported_progress WHERE user_id=uid;
 DELETE FROM public.legacy_exam_progress WHERE user_id=uid;
 DELETE FROM public.import_jobs WHERE user_id=uid;
 UPDATE public.profiles
 SET learning_epoch=after_epoch, learning_reset_at=clock_timestamp(), updated_at=clock_timestamp()
 WHERE user_id=uid;
 RETURN jsonb_build_object('ok',true,'cleared_lessons',lesson_count,
   'cleared_exam_attempts',exam_count,'learning_epoch',after_epoch);
END;
$$;
REVOKE ALL ON FUNCTION public.reset_own_learning(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reset_own_learning(text,uuid) TO authenticated;

-- All newly written operations use a generation token. Any offline request that
-- predates a reset is rejected even when replayed from a different device.
-- The advisory lock serializes all requests with the reset within one transaction.
CREATE OR REPLACE FUNCTION private.assert_learning_epoch(p_expected uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
DECLARE uid uuid:=(SELECT auth.uid()); actual uuid;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,0));
 SELECT learning_epoch INTO actual FROM public.profiles WHERE user_id=uid;
 IF p_expected IS NULL OR actual IS DISTINCT FROM p_expected THEN
   RAISE EXCEPTION 'The lesson was reset on another device; discard the old pending operation'
   USING ERRCODE='40001';
 END IF;
 RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION private.assert_learning_epoch(uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.submit_lesson_attempt_v4(
 p_lesson_id text,p_attempt_key uuid,p_answers jsonb,p_learning_epoch uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
BEGIN
 PERFORM private.assert_learning_epoch(p_learning_epoch);
 RETURN public.submit_lesson_attempt_v3(p_lesson_id,p_attempt_key,p_answers);
END;
$$;
REVOKE ALL ON FUNCTION public.submit_lesson_attempt_v4(text,uuid,jsonb,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_lesson_attempt_v4(text,uuid,jsonb,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_exam_attempt_v4(
 p_level text,p_attempt_key uuid,p_answers jsonb,p_learning_epoch uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
BEGIN
 PERFORM private.assert_learning_epoch(p_learning_epoch);
 RETURN public.submit_exam_attempt(p_level,p_attempt_key,p_answers);
END;
$$;
REVOKE ALL ON FUNCTION public.submit_exam_attempt_v4(text,uuid,jsonb,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_exam_attempt_v4(text,uuid,jsonb,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_lesson_step_v4(
 p_lesson_id text,p_step text,p_learning_epoch uuid
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
BEGIN
 PERFORM private.assert_learning_epoch(p_learning_epoch);
 RETURN public.save_lesson_step(p_lesson_id,p_step);
END;
$$;
REVOKE ALL ON FUNCTION public.save_lesson_step_v4(text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_lesson_step_v4(text,text,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_words_seen_v4(
 p_word_ids text[],p_learning_epoch uuid
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
BEGIN
 PERFORM private.assert_learning_epoch(p_learning_epoch);
 RETURN public.mark_words_seen(p_word_ids);
END;
$$;
REVOKE ALL ON FUNCTION public.mark_words_seen_v4(text[],uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mark_words_seen_v4(text[],uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_word_v4(
 p_word_id text,p_grade text,p_event_key uuid,p_learning_epoch uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
BEGIN
 PERFORM private.assert_learning_epoch(p_learning_epoch);
 RETURN public.review_word(p_word_id,p_grade,p_event_key);
END;
$$;
REVOKE ALL ON FUNCTION public.review_word_v4(text,text,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.review_word_v4(text,text,uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.import_legacy_archive_v4(
 p_source_hash text,p_lessons jsonb,p_learning_epoch uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private,pg_temp AS $$
BEGIN
 PERFORM private.assert_learning_epoch(p_learning_epoch);
 RETURN public.import_legacy_archive(p_source_hash,p_lessons);
END;
$$;
REVOKE ALL ON FUNCTION public.import_legacy_archive_v4(text,jsonb,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.import_legacy_archive_v4(text,jsonb,uuid) TO authenticated;

COMMIT;
