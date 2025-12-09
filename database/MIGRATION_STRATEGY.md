# Database Migration Strategy

## Overview

The TSI Manager database uses a hybrid approach with a base schema and incremental migrations. This document explains the migration strategy and how to set up the database correctly.

## Migration Files

### Base Schema: `schema.sql`
The base schema file creates the fundamental tables used by the application:
- `shared_courses` - Shared course content
- `shared_course_links` - OneDrive links for courses
- `shared_flashcards` - Shared flashcard content
- `user_events` - User events (DS, Colles, DM)
- `user_revision_progress` - User progress on courses
- `user_flashcard_stats` - User statistics per flashcard
- `chat_channels` - Chat discussion channels
- `chat_messages` - Chat messages

**Status**: ✅ Base tables - should be applied first

### Migration Files (in order)

#### 1. `add_user_flashcard_srs.sql`
**Purpose**: Adds Spaced Repetition System (SRS) support
**Tables**: `user_flashcard_srs`
**Features**: SM-2 algorithm implementation for flashcard reviews
**Status**: ✅ Implemented

#### 2. `add_flashcard_author_and_import_tracking.sql`
**Purpose**: Adds author tracking and import functionality
**Tables**: Updates to `shared_flashcards`
**Features**: Track flashcard authors and import sources
**Status**: ✅ Implemented

#### 3. `add_gamification_tables.sql`
**Purpose**: Adds gamification features
**Tables**: `badges`, `user_badges`, `user_profiles`, `user_daily_stats`
**Features**: Badges, XP, streaks, leaderboards
**Status**: ✅ Implemented

#### 4. `add_quiz_tables.sql`
**Purpose**: Adds quiz/exam mode
**Tables**: `quiz_sessions`, `quiz_answers`
**Features**: Practice tests, timed exams, score tracking
**Status**: ✅ Implemented

#### 5. `add_notification_tables.sql`
**Purpose**: Adds notification system
**Tables**: `user_notification_settings`, `scheduled_reminders`
**Features**: Customizable notifications and reminders
**Status**: ✅ Implemented

#### 6. `add_study_groups_tables.sql`
**Purpose**: Adds study groups feature
**Tables**: `study_groups`, `study_group_members`, `study_group_shared_decks`, `study_group_activities`
**Features**: Collaborative study groups with invite codes
**Status**: ✅ Implemented

#### 7. `add_missing_tables.sql` (NEW)
**Purpose**: Adds all remaining tables referenced in application code
**Tables**: 
- User personal data: `user_revision_history`, `user_schedules`, `user_exams`, `user_weekly_planning`, `user_goals`
- Shared data: `shared_revisions`
- Community features: `public_decks`, `deck_ratings`, `deck_downloads`, `deck_likes`
- Group features: `group_challenges`, `group_challenge_progress`

**Features**:
- Complete revision tracking system
- Weekly schedule management
- Exam tracking (DS/DM/Colles)
- Weekly planning tools
- User goals for gamification
- Public deck sharing with ratings
- Group challenges

**Status**: ✅ Newly created - completes the database schema

## Schema Coverage Analysis

### ✅ Tables with Migrations
All tables now have proper migrations:
- Core functionality (schema.sql)
- SRS system (migration 1)
- Gamification (migration 3)
- Quiz system (migration 4)
- Notifications (migration 5)
- Study groups (migration 6)
- Additional features (migration 7)

### ❌ Previous Gaps (NOW RESOLVED)
The following tables were referenced in `backend/server.js` but had no migrations:
- ~~`user_revision_history`~~ → ✅ Added in migration 7
- ~~`user_schedules`~~ → ✅ Added in migration 7
- ~~`user_exams`~~ → ✅ Added in migration 7
- ~~`user_weekly_planning`~~ → ✅ Added in migration 7
- ~~`shared_revisions`~~ → ✅ Added in migration 7

The following tables were documented in PUBLIC_DECKS_IMPLEMENTATION.md but not created:
- ~~`public_decks`~~ → ✅ Added in migration 7
- ~~`deck_ratings`~~ → ✅ Added in migration 7
- ~~`deck_downloads`~~ → ✅ Added in migration 7
- ~~`deck_likes`~~ → ✅ Added in migration 7

The following tables were mentioned in problem statement but not in code:
- ~~`user_goals`~~ → ✅ Added in migration 7
- ~~`group_challenges`~~ → ✅ Added in migration 7
- ~~`group_challenge_progress`~~ → ✅ Added in migration 7

## Installation Order

For a **new database**, execute files in this order:

```sql
1. schema.sql                              -- Base tables
2. add_user_flashcard_srs.sql             -- SRS system
3. add_flashcard_author_and_import_tracking.sql  -- Flashcard improvements
4. add_gamification_tables.sql            -- Gamification
5. add_quiz_tables.sql                    -- Quiz mode
6. add_notification_tables.sql            -- Notifications
7. add_study_groups_tables.sql            -- Study groups
8. add_missing_tables.sql                 -- Complete remaining features
```

For an **existing database** (upgrading), identify which migrations you've already applied and run only the missing ones.

## Verification

After running all migrations, verify the installation:

```sql
-- Count tables (should be 30+ tables)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify RLS is enabled (should return all tables)
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

## Key Features by Migration

### Personal Data Management (Migrations 1, 7)
- Flashcard review tracking with SRS
- Revision history and statistics
- Weekly schedules and planning
- Exam tracking

### Collaborative Features (Migrations 6, 7)
- Study groups with role-based access
- Shared decks within groups
- Group challenges
- Activity tracking

### Community Features (Migration 7)
- Public deck marketplace
- Ratings and reviews
- Download and like tracking
- Category-based browsing

### Gamification (Migrations 3, 7)
- Badge system with 14+ badges
- XP and leveling
- Streak tracking
- Daily statistics
- User goals

### Content Management (Base + Migrations)
- Shared courses with chapters
- OneDrive link integration
- Flashcard creation and sharing
- Revision materials

## Best Practices

1. **Always use migrations**: Don't manually create tables in production
2. **Test migrations**: Run migrations on a development database first
3. **Backup before migrating**: Always backup before applying new migrations
4. **Check for errors**: Review Supabase logs after migration
5. **Verify RLS**: Ensure RLS policies are active for all tables
6. **Enable Realtime**: Configure Realtime for tables that need it

## Troubleshooting

### Migration fails with "relation already exists"
This is safe - the migration uses `IF NOT EXISTS` clauses. The migration will skip existing tables.

### Migration fails with foreign key error
Run migrations in order - some tables depend on others being created first.

### RLS policy conflicts
If you get policy conflicts, the migration includes `DROP POLICY IF EXISTS` statements to handle this.

### Performance issues
All critical indexes are created automatically. If you notice slow queries, check:
```sql
SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';
```

## Migration Status

| Migration | Status | Tables Created | Features |
|-----------|--------|----------------|----------|
| schema.sql | ✅ Base | 8 | Core functionality |
| Migration 1 | ✅ Applied | 1 | SRS system |
| Migration 2 | ✅ Applied | 0 | Flashcard metadata |
| Migration 3 | ✅ Applied | 4 | Gamification |
| Migration 4 | ✅ Applied | 2 | Quiz mode |
| Migration 5 | ✅ Applied | 2 | Notifications |
| Migration 6 | ✅ Applied | 4 | Study groups |
| Migration 7 | ✅ NEW | 12 | Complete features |
| **TOTAL** | - | **33 tables** | **Complete** |

## Future Migrations

When adding new features:
1. Create a new migration file: `add_[feature]_tables.sql`
2. Use `IF NOT EXISTS` for idempotency
3. Include RLS policies
4. Add appropriate indexes
5. Document in this file
6. Update README.md

## References

- [Supabase Migrations Guide](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Best Practices for Database Migrations](https://supabase.com/docs/guides/database/best-practices)
