-- SECOND STEP: run only AFTER the v4 frontend has been published and tested.
-- Blocks bypassing reset epochs via direct, legacy frontend RPC calls.
-- WARNING: older deployed clients will need to refresh to use the new API.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.submit_lesson_attempt(text,uuid,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_lesson_attempt_v3(text,uuid,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_exam_attempt(text,uuid,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.save_lesson_step(text,text) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_words_seen(text[]) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.review_word(text,text,uuid) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.import_legacy_archive(text,jsonb) FROM PUBLIC,anon,authenticated;
COMMIT;
