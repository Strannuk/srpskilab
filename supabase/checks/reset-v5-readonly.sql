-- READ-ONLY diagnostic. Safe to run BEFORE/AFTER migration as SQL Editor administrator.
-- Does not clear, insert or update anything.
SELECT
  to_regprocedure('public.reset_own_learning(text,uuid)') IS NOT NULL AS reset_rpc_installed,
  to_regprocedure('public.submit_lesson_attempt_v4(text,uuid,jsonb,uuid)') IS NOT NULL AS lessons_v4_rpc_installed,
  to_regprocedure('public.submit_exam_attempt_v4(text,uuid,jsonb,uuid)') IS NOT NULL AS exams_v4_rpc_installed,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='learning_epoch'
  ) AS profiles_epoch_column_installed;

SELECT
  has_function_privilege('authenticated', 'public.reset_own_learning(text,uuid)', 'EXECUTE') AS authenticated_can_reset_self,
  has_function_privilege('anon', 'public.reset_own_learning(text,uuid)', 'EXECUTE') AS anonymous_cannot_reset_self;
-- The second column must be FALSE. The name is explicit in the title only;
-- function returns the actual grant boolean, not its negation.

SELECT
  has_function_privilege('authenticated','public.submit_lesson_attempt_v3(text,uuid,jsonb)','EXECUTE') AS old_lesson_rpc_still_available,
  has_function_privilege('authenticated','public.submit_exam_attempt(text,uuid,jsonb)','EXECUTE') AS old_exam_rpc_still_available;
-- After the strict activation SQL both values must become FALSE.
