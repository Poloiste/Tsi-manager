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

## Notes

- Always backup your database before applying migrations
- Test migrations in a development environment first
- Some migrations may require elevated privileges (service role key)
