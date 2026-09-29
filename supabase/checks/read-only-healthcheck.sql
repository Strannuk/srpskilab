-- SrpskiLab: READ-ONLY status check for Supabase SQL Editor.
-- No INSERT, UPDATE, DELETE, ALTER or account/answer disclosure.
-- Run on the intended Supabase project with admin SQL Editor access.
SELECT count(*) AS existing_lessons FROM public.course_lessons; -- expected 265 original IDs
SELECT count(*) AS existing_words FROM public.word_registry; -- expected 714 original words
SELECT count(*) AS private_lesson_question_rows FROM private.lesson_question_bank; -- expected 1855 when complete
SELECT count(*) AS private_exam_question_rows FROM private.exam_question_bank; -- expected 100 when complete
SELECT count(*) AS saved_user_attempts FROM public.lesson_attempts;
SELECT count(*) AS saved_user_progress_rows FROM public.lesson_progress;
SELECT count(*) AS lessons_not_on_original_version FROM public.course_lessons WHERE content_version <> 1;
-- For a full bank, this must return zero rows:
SELECT lesson_id, count(*) AS question_count FROM private.lesson_question_bank GROUP BY lesson_id HAVING count(*) <> 7 ORDER BY lesson_id;
-- This must return five records of 20 questions when the exam bank is complete:
SELECT level, count(*) AS question_count FROM private.exam_question_bank GROUP BY level ORDER BY level;
