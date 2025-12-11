# Fix for Private Groups Visibility Issue

## Problem Description

Private groups were being created in the database but were not being displayed in the user interface. This issue was caused by a combination of:
1. Row-Level Security (RLS) policies that didn't properly handle private group visibility
2. Split RLS policies that made it harder to maintain and debug

## Solution

### 1. Database Migration

Apply the `fix_private_groups_visibility.sql` migration to consolidate the RLS policies into a single, comprehensive policy.

**To apply the migration:**

#### Using Supabase Dashboard
1. Log in to your Supabase project dashboard at https://supabase.com
2. Navigate to the **SQL Editor** section
3. Open the file `database/migrations/fix_private_groups_visibility.sql`
4. Copy the entire contents of the file
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration
7. Verify in the Table Editor that the policies were updated correctly

#### Using Supabase CLI
If you have the Supabase CLI installed:
```bash
# From the project root
supabase db push

# Or run the specific migration
psql -h your-project-host -U postgres -d postgres -f database/migrations/fix_private_groups_visibility.sql
```

### 2. What the Migration Does

The migration consolidates two separate RLS policies into one comprehensive policy:

**Old policies (removed):**
- `"Public groups are viewable by everyone"` - Only handled public groups
- `"Members can view their private groups"` - Only handled private groups for members

**New policy (created):**
- `"Allow group visibility"` - Handles all cases:
  - Public groups visible to everyone
  - Private groups visible to their creator
  - Private groups visible to their members

### 3. Frontend Changes

Enhanced logging has been added to the `useStudyGroups.js` hook to help debug group visibility:
- Logs when groups are fetched
- Logs the number of public vs private groups
- Logs group creation process
- Logs membership data

These logs are only visible in development mode.

### 4. How It Works

When a private group is created:
1. The group is inserted into the `study_groups` table with `is_public = false`
2. A database trigger automatically adds the creator as an admin member in `study_group_members`
3. The RLS policy allows the group to be visible because:
   - The user is the creator (`created_by = auth.uid()`), OR
   - The user is a member (exists in `study_group_members`)

### 5. Verification Steps

After applying the migration:

1. **Create a private group:**
   - Go to the Groups section
   - Click "Créer un groupe"
   - Select "Privé" visibility
   - Create the group

2. **Verify visibility:**
   - The group should appear immediately in your "Mes Groupes" section
   - Other users should NOT see the group unless invited
   - The creator should see the group without any issues

3. **Test invitations:**
   - Generate an invite code
   - Have another user join with the code
   - Both users should now see the group in "Mes Groupes"

4. **Check logs (development mode):**
   - Open browser console
   - Look for logs prefixed with `[useStudyGroups]`
   - Verify that private groups are being fetched and displayed

### 6. Troubleshooting

If private groups are still not visible:

1. **Check RLS policies:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM pg_policies WHERE tablename = 'study_groups';
   ```
   You should see the "Allow group visibility" policy.

2. **Verify trigger is active:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT tgname, tgrelid::regclass 
   FROM pg_trigger 
   WHERE tgrelid = 'public.study_groups'::regclass;
   ```
   You should see `add_creator_as_admin_trigger`.

3. **Check membership was created:**
   ```sql
   -- Replace YOUR_USER_ID with actual user ID
   SELECT * FROM study_group_members 
   WHERE user_id = 'YOUR_USER_ID' 
   AND role = 'admin';
   ```

4. **Verify group exists:**
   ```sql
   -- Replace YOUR_USER_ID with actual user ID
   SELECT * FROM study_groups 
   WHERE created_by = 'YOUR_USER_ID';
   ```

### 7. Security Considerations

The new RLS policy maintains proper security:
- Public groups are visible to everyone (as intended)
- Private groups are ONLY visible to:
  - The creator
  - Invited members
- No unauthorized access is possible

### 8. Additional Notes

- The trigger `add_creator_as_admin_trigger` was already in place and working correctly
- The main issue was the RLS policies being too restrictive
- No changes to application logic were needed, only policy updates
- Enhanced logging will help identify any future issues quickly
