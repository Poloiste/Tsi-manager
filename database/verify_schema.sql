-- =========================================
-- TSI Manager - Schema Verification Script
-- =========================================
-- Run this script after applying all migrations to verify the schema is complete
-- This script only reads data and does not modify anything
--
-- MAINTENANCE NOTES:
-- When adding new migrations, update these hardcoded values:
-- - Line ~16: Expected table count (currently 33)
-- - Line ~105: Expected index count (currently 50+)
-- - Line ~237: Expected chat_channels count (currently 8)
-- - Line ~245: Expected badges count (currently 14)
-- Also update the table list in Section 2 and Section 4

-- ==========================================
-- SECTION 1: TABLE COUNT
-- ==========================================
-- NOTE: Expected count should be updated when new tables are added
-- Current expected: 33 tables (as of add_missing_tables.sql migration)
SELECT 
  '1. TABLE COUNT' as check_name,
  COUNT(*) as actual_count,
  33 as expected_count,
  CASE WHEN COUNT(*) >= 33 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.tables 
WHERE table_schema = 'public';

-- ==========================================
-- SECTION 2: LIST ALL TABLES
-- ==========================================
SELECT 
  '2. ALL TABLES' as check_name,
  table_name,
  CASE 
    WHEN table_name IN (
      -- Base schema tables
      'shared_courses', 'shared_course_links', 'shared_flashcards',
      'user_events', 'user_revision_progress', 'user_flashcard_stats',
      'chat_channels', 'chat_messages',
      -- SRS
      'user_flashcard_srs',
      -- Gamification
      'badges', 'user_badges', 'user_profiles', 'user_daily_stats',
      -- Quiz
      'quiz_sessions', 'quiz_answers',
      -- Notifications
      'user_notification_settings', 'scheduled_reminders',
      -- Study Groups
      'study_groups', 'study_group_members', 'study_group_shared_decks', 'study_group_activities',
      -- NEW: Missing tables
      'user_revision_history', 'user_schedules', 'user_exams', 'user_weekly_planning', 'user_goals',
      'shared_revisions',
      'public_decks', 'deck_ratings', 'deck_downloads', 'deck_likes',
      'group_challenges', 'group_challenge_progress'
    ) THEN '✅ Expected'
    ELSE '⚠️ Extra'
  END as table_status
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ==========================================
-- SECTION 3: RLS ENABLED CHECK
-- ==========================================
SELECT 
  '3. RLS ENABLED' as check_name,
  COUNT(*) as tables_with_rls,
  33 as expected_count,
  CASE WHEN COUNT(*) >= 33 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- ==========================================
-- SECTION 4: MISSING EXPECTED TABLES
-- ==========================================
WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'shared_courses', 'shared_course_links', 'shared_flashcards',
    'user_events', 'user_revision_progress', 'user_flashcard_stats',
    'chat_channels', 'chat_messages',
    'user_flashcard_srs',
    'badges', 'user_badges', 'user_profiles', 'user_daily_stats',
    'quiz_sessions', 'quiz_answers',
    'user_notification_settings', 'scheduled_reminders',
    'study_groups', 'study_group_members', 'study_group_shared_decks', 'study_group_activities',
    'user_revision_history', 'user_schedules', 'user_exams', 'user_weekly_planning', 'user_goals',
    'shared_revisions',
    'public_decks', 'deck_ratings', 'deck_downloads', 'deck_likes',
    'group_challenges', 'group_challenge_progress'
  ]) AS table_name
)
SELECT 
  '4. MISSING TABLES' as check_name,
  et.table_name,
  '❌ MISSING' as status
FROM expected_tables et
LEFT JOIN information_schema.tables t 
  ON et.table_name = t.table_name AND t.table_schema = 'public'
WHERE t.table_name IS NULL;

-- ==========================================
-- SECTION 5: INDEX COUNT
-- ==========================================
-- NOTE: Expected count (50+) is approximate based on current migrations
-- Includes: 35 explicit indexes + system indexes on PKs and unique constraints
SELECT 
  '5. INDEX COUNT' as check_name,
  COUNT(*) as total_indexes,
  CASE WHEN COUNT(*) >= 50 THEN '✅ PASS' ELSE '⚠️ LOW' END as status,
  'Expected 50+ indexes across all tables' as note
FROM pg_indexes 
WHERE schemaname = 'public';

-- ==========================================
-- SECTION 6: FUNCTION COUNT
-- ==========================================
SELECT 
  '6. FUNCTION COUNT' as check_name,
  COUNT(*) as total_functions,
  CASE WHEN COUNT(*) >= 5 THEN '✅ PASS' ELSE '❌ FAIL' END as status,
  'Expected at least 5 functions' as note
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';

-- ==========================================
-- SECTION 7: TRIGGER COUNT
-- ==========================================
SELECT 
  '7. TRIGGER COUNT' as check_name,
  COUNT(*) as total_triggers,
  CASE WHEN COUNT(*) >= 15 THEN '✅ PASS' ELSE '❌ FAIL' END as status,
  'Expected at least 15 triggers' as note
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- ==========================================
-- SECTION 8: FOREIGN KEY RELATIONSHIPS
-- ==========================================
SELECT 
  '8. FOREIGN KEYS' as check_name,
  COUNT(*) as total_foreign_keys,
  CASE WHEN COUNT(*) >= 20 THEN '✅ PASS' ELSE '⚠️ LOW' END as status,
  'Expected 20+ foreign key constraints' as note
FROM information_schema.table_constraints 
WHERE constraint_schema = 'public' 
AND constraint_type = 'FOREIGN KEY';

-- ==========================================
-- SECTION 9: POLICY COUNT
-- ==========================================
SELECT 
  '9. RLS POLICIES' as check_name,
  COUNT(*) as total_policies,
  CASE WHEN COUNT(*) >= 50 THEN '✅ PASS' ELSE '⚠️ LOW' END as status,
  'Expected 50+ RLS policies' as note
FROM pg_policies 
WHERE schemaname = 'public';

-- ==========================================
-- SECTION 10: SPECIFIC NEW TABLES CHECK
-- ==========================================
SELECT 
  '10. NEW TABLES CHECK' as check_name,
  t.table_name,
  '✅ EXISTS' as status
FROM information_schema.tables t
WHERE t.table_schema = 'public'
AND t.table_name IN (
  'user_revision_history',
  'user_schedules',
  'user_exams',
  'user_weekly_planning',
  'user_goals',
  'shared_revisions',
  'public_decks',
  'deck_ratings',
  'deck_downloads',
  'deck_likes',
  'group_challenges',
  'group_challenge_progress'
)
ORDER BY t.table_name;

-- ==========================================
-- SECTION 11: SUMMARY
-- ==========================================
WITH verification_summary AS (
  SELECT 
    'Tables' as category,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as actual,
    33 as expected
  UNION ALL
  SELECT 
    'RLS Enabled Tables',
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true),
    33
  UNION ALL
  SELECT 
    'Indexes',
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'),
    50
  UNION ALL
  SELECT 
    'Functions',
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'),
    5
  UNION ALL
  SELECT 
    'Triggers',
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public'),
    15
  UNION ALL
  SELECT 
    'RLS Policies',
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'),
    50
)
SELECT 
  '11. SUMMARY' as check_name,
  category,
  actual,
  expected,
  CASE 
    WHEN actual >= expected THEN '✅ PASS'
    WHEN actual >= expected * 0.8 THEN '⚠️ ALMOST'
    ELSE '❌ FAIL'
  END as status
FROM verification_summary;

-- ==========================================
-- SECTION 12: SAMPLE DATA CHECK (OPTIONAL)
-- ==========================================
-- Check if default data exists
-- NOTE: These counts should be updated if default data is modified in migrations

-- Expected: 8 default chat channels (see schema.sql INSERT statement)
-- Général, Maths, Physique, Méca, Elec, Anglais, Français, Informatique
SELECT 
  '12. DEFAULT DATA' as check_name,
  'chat_channels' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) >= 8 THEN '✅ PASS' ELSE '⚠️ RUN schema.sql' END as status
FROM chat_channels;

-- Expected: 14 default badges (see add_gamification_tables.sql INSERT statement)
-- 4 streak badges + 4 mastery badges + 2 creation badges + 4 session badges
SELECT 
  '12. DEFAULT DATA' as check_name,
  'badges' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) >= 14 THEN '✅ PASS' ELSE '⚠️ RUN gamification migration' END as status
FROM badges;

-- ==========================================
-- COMPLETION MESSAGE
-- ==========================================
SELECT 
  '✅ VERIFICATION COMPLETE' as message,
  NOW() as checked_at,
  current_database() as database_name,
  current_user as checked_by;
