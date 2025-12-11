# Manual Test Plan for Private Groups Fix

## Prerequisites
- Apply the `fix_private_groups_visibility.sql` migration to your Supabase database
- Have at least 2 test user accounts ready

## Test Scenario 1: Create Private Group

### Steps:
1. Log in as User A
2. Navigate to the "Discussions" tab
3. Click on "Groupes" subtab
4. Click "Créer un groupe" button
5. Fill in the form:
   - Name: "Test Private Group"
   - Description: "This is a test private group"
   - Visibility: Select "Privé" (Private)
   - Max Members: 10
6. Click "Créer le groupe"

### Expected Results:
- ✅ Success message appears: "Groupe 'Test Private Group' créé avec succès !"
- ✅ The new private group appears immediately in "Mes Groupes" section
- ✅ The group shows a lock icon (🔒) indicating it's private
- ✅ An invite code is automatically generated
- ✅ Member count shows "1"

### In Browser Console (Development Mode):
```
[useStudyGroups] createGroup called with data: {name: "Test Private Group", ...}
[useStudyGroups] Inserting group with data: {name: "Test Private Group", is_public: false, ...}
[useStudyGroups] Group created successfully: {id: "...", name: "Test Private Group", ...}
[useStudyGroups] Group is_public: false
[useStudyGroups] Reloading my groups after creation...
[useStudyGroups] loadMyGroups called for userId: ...
[useStudyGroups] Raw memberships data: [{...}]
[useStudyGroups] Private groups found: 1
```

## Test Scenario 2: Private Group Not Visible to Other Users

### Steps:
1. Remain logged in as User A (who created the private group)
2. Note the group name
3. Log out
4. Log in as User B (different user)
5. Navigate to "Discussions" > "Groupes"
6. Look in both "Mes Groupes" and "Groupes Publics" sections

### Expected Results:
- ✅ User B does NOT see "Test Private Group" in "Mes Groupes"
- ✅ User B does NOT see "Test Private Group" in "Groupes Publics"
- ✅ The private group is completely hidden from non-members

## Test Scenario 3: Invite User to Private Group

### Steps:
1. Log in as User A (group creator)
2. Navigate to "Discussions" > "Groupes"
3. Click "Voir" on the "Test Private Group"
4. Copy the invite code from the group details modal
5. Log out
6. Log in as User B
7. Navigate to "Discussions" > "Groupes"
8. Click "Rejoindre par code" button
9. Enter the invite code
10. Click to join

### Expected Results:
- ✅ Success message: "Vous avez rejoint le groupe 'Test Private Group' !"
- ✅ The private group now appears in User B's "Mes Groupes" section
- ✅ User B can see all group details
- ✅ Member count in the group shows "2"

## Test Scenario 4: Public Group Still Works

### Steps:
1. Log in as User A
2. Navigate to "Discussions" > "Groupes"
3. Click "Créer un groupe"
4. Fill in the form:
   - Name: "Test Public Group"
   - Description: "This is a test public group"
   - Visibility: Select "Public"
   - Max Members: 20
5. Click "Créer le groupe"
6. Log out
7. Log in as User B
8. Navigate to "Discussions" > "Groupes"

### Expected Results:
- ✅ User A sees "Test Public Group" in "Mes Groupes"
- ✅ User B sees "Test Public Group" in "Groupes Publics"
- ✅ User B can click "Rejoindre" to join the public group
- ✅ After joining, the group moves to User B's "Mes Groupes"

## Test Scenario 5: Creator Can Always See Their Groups

### Steps:
1. Log in as User A
2. Note all private and public groups created by User A
3. Navigate to "Discussions" > "Groupes"
4. Check "Mes Groupes" section

### Expected Results:
- ✅ All groups created by User A appear in "Mes Groupes"
- ✅ Both private and public groups are visible
- ✅ Creator role is indicated for groups created by User A

## Database Verification Queries

Run these in Supabase SQL Editor to verify the fix:

### Check RLS Policies:
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'study_groups';
```

**Expected:** Should see "Allow group visibility" policy

### Check Group Creator Membership:
```sql
-- Replace 'YOUR_GROUP_ID' with actual group ID
SELECT 
  sg.id,
  sg.name,
  sg.is_public,
  sg.created_by,
  sgm.user_id,
  sgm.role
FROM study_groups sg
LEFT JOIN study_group_members sgm ON sg.id = sgm.group_id
WHERE sg.id = 'YOUR_GROUP_ID';
```

**Expected:** Creator should appear as a member with role 'admin'

### Check Private Groups for User:
```sql
-- Replace 'YOUR_USER_ID' with actual user ID
SELECT 
  sg.*,
  sgm.role
FROM study_groups sg
INNER JOIN study_group_members sgm ON sg.id = sgm.group_id
WHERE sgm.user_id = 'YOUR_USER_ID' 
  AND sg.is_public = false;
```

**Expected:** Shows all private groups the user is a member of

## Troubleshooting

### Issue: Private group not appearing after creation
**Solution:** 
1. Check browser console for errors
2. Verify the trigger `add_creator_as_admin_trigger` is active
3. Run: `SELECT * FROM study_group_members WHERE group_id = 'YOUR_GROUP_ID';`

### Issue: User can't see groups they created
**Solution:**
1. Verify the RLS policy was applied correctly
2. Check that auth.uid() matches the created_by field
3. Check membership table for the user

### Issue: Invited user can't see private group
**Solution:**
1. Verify the user successfully joined (check study_group_members)
2. Ensure RLS policy includes the EXISTS clause for members
3. Refresh the page or reload groups

## Success Criteria

All tests pass if:
- ✅ Private groups appear for creators immediately after creation
- ✅ Private groups do NOT appear for non-members
- ✅ Private groups appear for invited members after joining
- ✅ Public groups remain visible to everyone
- ✅ No console errors during group operations
- ✅ Proper logging appears in development mode
