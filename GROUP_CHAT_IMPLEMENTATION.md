# Group Chat Implementation Guide

## Overview
This guide explains the group chat functionality implementation for study groups in TSI Manager.

## Database Schema

### Table: `group_chats`
Stores chat messages for study groups with the following structure:

```sql
CREATE TABLE public.group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes
- `idx_group_chats_group` - Optimizes queries by group_id
- `idx_group_chats_created` - Optimizes queries by creation timestamp

### Row-Level Security (RLS) Policies

1. **Read Policy**: "Group members can read group messages"
   - Members can only read messages from groups they belong to
   - Verified through `study_group_members` table

2. **Insert Policy**: "Group members can send messages"
   - Members can only send messages to groups they belong to
   - Must be authenticated (`auth.uid()`)

3. **Delete Policy**: "Users can delete their own group messages"
   - Users can only delete their own messages
   - Verified by matching `user_id` with `auth.uid()`

## React Implementation

### Hook: `useGroupChat`
Location: `frontend/src/hooks/useGroupChat.js`

**Purpose**: Manages group chat state and operations

**Parameters**:
- `groupId` (string): ID of the group
- `userId` (string): ID of the authenticated user

**Returns**:
- `messages` (array): List of chat messages
- `isLoading` (boolean): Loading state
- `error` (string): Error message if any
- `sendMessage` (function): Send a new message
- `deleteMessage` (function): Delete a message
- `loadMessages` (function): Manually reload messages

**Features**:
- Automatic message loading on mount
- Real-time message updates via Supabase Realtime
- Automatic cleanup on unmount
- Duplicate message prevention
- Message limit (100 most recent messages)

### Component: `GroupChat`
Location: `frontend/src/components/GroupChat.js`

**Purpose**: UI component for group chat interface

**Props**:
- `groupId` (string): ID of the group
- `userId` (string): ID of the authenticated user
- `isDark` (boolean): Dark mode toggle

**Features**:
- Message display with timestamp formatting
- Auto-scroll to newest messages
- Send message form with validation
- Delete own messages
- Loading and error states
- Responsive design
- Dark mode support

### Integration: `GroupDetail`
Location: `frontend/src/components/GroupDetail.js`

**Changes**:
- Added "Chat" tab as the first section
- Imported `GroupChat` component
- Added `MessageCircle` icon from lucide-react
- Access control: Only group members can view chat
- Non-members see a locked state message

## Security Features

1. **Database Level**:
   - RLS policies ensure only group members can access messages
   - CASCADE deletion removes messages when group or user is deleted
   - User can only delete their own messages

2. **Client Level**:
   - Hook verifies `userId` before operations
   - Component checks membership before rendering chat
   - Input validation prevents empty messages
   - Message length limit (1000 characters)

3. **Real-time Security**:
   - Realtime subscriptions filtered by `group_id`
   - Duplicate prevention on client side
   - Automatic cleanup prevents memory leaks

## Testing Checklist

- [ ] Group members can read messages from their group
- [ ] Group members can send messages to their group
- [ ] Non-members cannot access group chat
- [ ] Users can delete only their own messages
- [ ] Real-time updates work correctly (new messages appear instantly)
- [ ] Message timestamps display correctly
- [ ] Auto-scroll works when new messages arrive
- [ ] Dark mode styling works correctly
- [ ] Empty state displays correctly
- [ ] Error handling works properly
- [ ] Performance with 100+ messages

## Migration Instructions

**IMPORTANT NOTE**: The main `schema.sql` file contains an older `groupes` table definition that has been superseded by the `study_groups` table defined in `database/migrations/add_study_groups_tables.sql`. The group chat functionality uses `study_groups` which is the correct, up-to-date table.

### For New Installations

1. **Apply the study groups migration first**:
   ```sql
   -- Execute database/migrations/add_study_groups_tables.sql
   ```

2. **Then apply the group chats migration**:
   ```sql
   -- Execute database/migrations/add_group_chats_table.sql
   ```

### For Existing Installations

1. **If you have the `study_groups` table already**:
   ```sql
   -- Just execute the group chats migration
   -- database/migrations/add_group_chats_table.sql
   ```

2. **If you only have the `groupes` table**:
   ```sql
   -- You need to migrate from groupes to study_groups first
   -- Execute database/migrations/add_study_groups_tables.sql
   -- Then execute database/migrations/add_group_chats_table.sql
   ```

### Updating from Main Schema

The main `schema.sql` now includes the `group_chats` table definition. However, note that it references `study_groups`, not `groupes`. If running the full schema on a fresh database:

1. First apply `add_study_groups_tables.sql` migration
2. Then run the main `schema.sql` (which will create `group_chats`)

Or simply run all migrations in order before running the main schema.

3. **Verify Installation**:
   ```sql
   -- Check table exists
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'group_chats';
   
   -- Check policies
   SELECT * FROM pg_policies 
   WHERE tablename = 'group_chats';
   ```

## Usage Example

```javascript
import { GroupChat } from './components/GroupChat';

function MyGroupPage({ groupId, userId, isDark }) {
  return (
    <div className="h-screen">
      <GroupChat 
        groupId={groupId}
        userId={userId}
        isDark={isDark}
      />
    </div>
  );
}
```

## Performance Considerations

- Messages are limited to 100 most recent per group
- Real-time subscription is group-specific (not global)
- Auto-scroll uses smooth behavior for better UX
- Duplicate detection uses O(n) complexity (acceptable for n=100)

## Future Enhancements

Possible improvements for future versions:

1. **Pagination**: Load older messages on scroll
2. **User Names**: Display user names instead of IDs
3. **Rich Text**: Support for formatting, links, mentions
4. **File Attachments**: Share images and files
5. **Message Reactions**: Add emoji reactions
6. **Read Receipts**: Track who has read messages
7. **Notifications**: Push notifications for new messages
8. **Search**: Search within chat history
9. **Message Editing**: Allow editing sent messages
10. **Typing Indicators**: Show when someone is typing

## Troubleshooting

### Messages not appearing in real-time
- Check Supabase Realtime is enabled for `group_chats` table
- Verify browser console for WebSocket errors
- Ensure user is authenticated

### "Permission denied" errors
- Verify user is a member of the group in `study_group_members`
- Check RLS policies are properly configured
- Ensure `auth.uid()` returns the correct user ID

### Build errors
- Verify all imports are correct
- Check `useGroupChat` hook is exported correctly
- Ensure `GroupChat` component is imported in `GroupDetail`
