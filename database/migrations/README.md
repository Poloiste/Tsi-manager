# Database Migrations

This directory contains SQL migration scripts for the TSI Manager database.

## How to Apply Migrations

### Using Supabase Dashboard

1. Log in to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the migration file
4. Execute the SQL script
5. Verify the changes in the Table Editor

### Using Supabase CLI

```bash
supabase db push
```

## Migration Files

- `add_flashcard_author_and_import_tracking.sql` - Adds columns to track flashcard authors and import sources
- `add_gamification_tables.sql` - Adds tables for gamification features
- `add_notification_tables.sql` - Adds tables for notification system
- `add_quiz_tables.sql` - Adds tables for quiz functionality
- `add_study_groups_tables.sql` - Adds tables for study groups feature
- `add_user_flashcard_srs.sql` - Adds SRS (Spaced Repetition System) for flashcards
- `add_group_chats_table.sql` - Adds group chat functionality for study groups

## Notes

- Always backup your database before applying migrations
- Test migrations in a development environment first
- Some migrations may require elevated privileges (service role key)
- The `add_group_chats_table.sql` migration is already included in the main `schema.sql` file (version controlled)
