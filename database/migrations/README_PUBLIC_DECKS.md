# Public Decks Migration Guide

This migration adds support for public decks and community sharing features to the TSI Manager application.

## What's Included

This migration creates the following database tables:

1. **public_decks** - Stores published flashcard decks
2. **deck_ratings** - Stores user ratings and reviews for decks
3. **deck_downloads** - Tracks deck downloads by users
4. **deck_likes** - Tracks user likes on decks
5. **deck_flashcards** - Junction table linking flashcards to public decks

## Features

- ✅ Publish flashcard decks to the community
- ✅ Browse and search public decks by category and filters
- ✅ Download and import decks into personal collection
- ✅ Rate and review decks
- ✅ Like/unlike decks
- ✅ View deck statistics (downloads, ratings, likes)
- ✅ Automatic stat updates via database triggers
- ✅ Row Level Security (RLS) policies for data protection

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy and paste the contents of `add_public_decks_tables.sql`
6. Click **Run** to execute the migration
7. Verify the tables were created by checking the **Table Editor**

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Navigate to your project directory
cd /path/to/Tsi-manager

# Apply the migration
supabase db push --migrations database/migrations/add_public_decks_tables.sql
```

### Option 3: Using psql

If you have direct PostgreSQL access:

```bash
psql -h your-db-host -U postgres -d postgres -f database/migrations/add_public_decks_tables.sql
```

## Verification

After applying the migration, verify the tables exist:

```sql
-- Check that all tables were created
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'public_decks', 
  'deck_ratings', 
  'deck_downloads', 
  'deck_likes', 
  'deck_flashcards'
);
```

You should see all 5 tables listed.

## Security

The migration includes Row Level Security (RLS) policies that:

- Allow anyone to view active public decks
- Allow only authors to update/delete their own decks
- Allow only authenticated users to rate, like, and download decks
- Prevent duplicate ratings and likes per user

## Triggers

The migration includes automatic triggers that:

- Update deck rating statistics when ratings are added/updated/deleted
- Update likes count when users like/unlike decks
- Update downloads count when decks are downloaded

## Rollback

If you need to rollback this migration:

```sql
-- Drop all tables (this will delete all data!)
DROP TABLE IF EXISTS public.deck_flashcards CASCADE;
DROP TABLE IF EXISTS public.deck_likes CASCADE;
DROP TABLE IF EXISTS public.deck_downloads CASCADE;
DROP TABLE IF EXISTS public.deck_ratings CASCADE;
DROP TABLE IF EXISTS public.public_decks CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_deck_rating_stats ON public.deck_ratings;
DROP TRIGGER IF EXISTS trigger_update_deck_likes_count ON public.deck_likes;
DROP TRIGGER IF EXISTS trigger_update_deck_downloads_count ON public.deck_downloads;

-- Drop functions
DROP FUNCTION IF EXISTS update_deck_rating_stats();
DROP FUNCTION IF EXISTS update_deck_likes_count();
DROP FUNCTION IF EXISTS update_deck_downloads_count();
```

## Next Steps

After applying the migration:

1. Restart your application (if needed)
2. Navigate to the **🌐 Communauté** tab
3. Try publishing a deck from one of your courses
4. Browse the public library
5. Import a deck to test the full flow

## Support

If you encounter any issues:

1. Check the Supabase logs for error messages
2. Verify your Supabase project has the necessary permissions
3. Ensure your environment variables are correctly configured
4. Check that RLS policies are enabled on your tables
