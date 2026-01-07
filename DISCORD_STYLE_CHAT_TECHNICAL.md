# Discord-Style Category and Channel System - Technical Implementation

## Overview

This document describes the technical implementation of the Discord-style category and channel system in TSI Manager. The system provides a hierarchical structure for organizing chat channels with real-time updates, role-based permissions, and support for public/private visibility.

## Architecture

### Component Hierarchy

```
App.js (Main Application)
└── DiscordStyleChat
    ├── CategoryChannelSidebar
    │   ├── Category Headers (collapsible)
    │   ├── Channel List (per category)
    │   └── CreateCategoryChannelModal (triggered)
    └── ChannelChat
        ├── Channel Header
        ├── Message List (real-time)
        └── Message Input
```

## Database Schema

### chat_channels Table

```sql
CREATE TABLE chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    channel_type TEXT CHECK (channel_type IN ('category', 'text', 'voice')) NOT NULL,
    parent_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
    visibility TEXT CHECK (visibility IN ('public', 'private')) DEFAULT 'public',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Columns:**
- `channel_type`: Defines if this is a 'category', 'text', or 'voice' channel
- `parent_id`: Links channels to their parent category
- `visibility`: Controls access ('public' or 'private')
- `group_id`: Links to study groups (NULL for standalone channels)

### channel_memberships Table

```sql
CREATE TABLE channel_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(channel_id, user_id)
);
```

**Key Columns:**
- `role`: Defines user permissions ('owner', 'moderator', 'member')
- `UNIQUE(channel_id, user_id)`: Ensures a user can only have one role per channel

## Backend API

### Endpoints

All endpoints are already implemented in `backend/server.js`:

#### Channel Management

1. **POST /api/channels**
   - Create a new category or channel
   - Request body:
     ```json
     {
       "name": "string",
       "type": "category|text|voice",
       "parent_id": "uuid (optional)",
       "visibility": "public|private",
       "created_by": "uuid"
     }
     ```

2. **GET /api/channels**
   - List all accessible channels with hierarchy
   - Query params:
     - `user_id`: Required for permission filtering
     - `include_children`: Boolean to include child channels

3. **GET /api/channels/:id**
   - Get specific channel details

4. **PUT /api/channels/:id**
   - Update channel properties
   - Requires owner/moderator role

5. **DELETE /api/channels/:id**
   - Delete channel
   - Requires owner role

#### Membership Management

6. **POST /api/channels/:id/memberships**
   - Add member to private channel
   - Requires owner/moderator role

7. **GET /api/channels/:id/memberships**
   - List channel members

8. **DELETE /api/channels/:id/memberships/:userId**
   - Remove member from channel
   - Requires owner/moderator role or self-removal

## Frontend Implementation

### Components

#### 1. CategoryChannelSidebar

**Purpose**: Display hierarchical list of categories and channels with collapsible categories.

**Key Features:**
- Collapsible categories with expand/collapse state
- Visual indicators for channel types (Hash for text, Speaker for voice)
- Lock icon for private channels
- Create buttons for admins
- Active channel highlighting

**Props:**
```typescript
{
  categories: Category[],
  orphanChannels: Channel[],
  activeChannelId: string,
  onChannelSelect: (channel) => void,
  onCreateChannel: (categoryId) => void,
  onCreateCategory: () => void,
  isAdmin: boolean,
  isDark: boolean
}
```

#### 2. CreateCategoryChannelModal

**Purpose**: Modal dialog for creating categories and channels.

**Key Features:**
- Dynamic form based on mode ('category' or 'channel')
- Channel type selection (text/voice)
- Visibility selection (public/private)
- Visual feedback with icons
- Input validation

**Props:**
```typescript
{
  show: boolean,
  onClose: () => void,
  onCreate: (data) => Promise<void>,
  mode: 'category' | 'channel',
  parentCategoryId: string | null,
  isDark: boolean
}
```

#### 3. DiscordStyleChat

**Purpose**: Main container component integrating sidebar and chat area.

**Key Features:**
- Layout management (sidebar + chat area)
- Auto-selection of first available channel
- Modal state management
- Integration with useCategoryChannels hook

**Props:**
```typescript
{
  userId: string,
  userName: string,
  isAdmin: boolean,
  isDark: boolean
}
```

#### 4. ChannelChat

**Purpose**: Display and manage messages in a specific channel.

**Note**: This component was already implemented and is reused.

### Hooks

#### useCategoryChannels

**Purpose**: Manage categories and channels with real-time updates.

**Features:**
- Fetch and organize channels hierarchically
- Create categories and channels
- Delete channels
- Subscribe to real-time Supabase updates
- Automatic data reorganization

**API:**
```typescript
{
  categories: Category[],
  orphanChannels: Channel[],
  isLoading: boolean,
  error: string | null,
  loadChannels: () => Promise<void>,
  createCategory: (name, visibility) => Promise<Channel>,
  createChannel: (name, type, parentId, visibility) => Promise<Channel>,
  deleteChannel: (channelId) => Promise<void>
}
```

**Data Organization:**
1. Fetch all channels from API
2. Separate categories from regular channels
3. Group channels by parent_id
4. Sort by position
5. Return organized structure

## Real-time Updates

### Supabase Subscriptions

The system uses Supabase real-time subscriptions to monitor changes:

```javascript
supabase
  .channel('category-channels-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'chat_channels',
    filter: 'group_id=is.null'
  }, (payload) => {
    // Reload channels on any change
    loadChannels();
  })
  .subscribe();
```

**Events Monitored:**
- INSERT: New category/channel created
- UPDATE: Category/channel updated
- DELETE: Category/channel deleted

## Database Triggers

### Auto-Generate "General" Channel

When a new category is created, a trigger automatically creates a "General" text channel:

```sql
CREATE OR REPLACE FUNCTION create_channel_for_category()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.channel_type = 'category' THEN
    INSERT INTO public.chat_channels (
      id, name, channel_type, parent_id, visibility, created_by, created_at
    )
    VALUES (
      gen_random_uuid(), 'General', 'text', NEW.id, 
      NEW.visibility, NEW.created_by, NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_channel_on_category
AFTER INSERT ON public.chat_channels
FOR EACH ROW
WHEN (NEW.channel_type = 'category')
EXECUTE FUNCTION create_channel_for_category();
```

## Security

### Row Level Security (RLS)

The system uses Supabase RLS policies to enforce permissions:

#### Public Channels
```sql
CREATE POLICY "Public channels are viewable by everyone"
ON public.chat_channels FOR SELECT
USING (visibility = 'public' AND group_id IS NULL);
```

#### Private Channels
```sql
CREATE POLICY "Private channel members can view their channels"
ON public.chat_channels FOR SELECT
USING (
  visibility = 'private' AND group_id IS NULL AND
  EXISTS (
    SELECT 1 FROM public.channel_memberships
    WHERE channel_memberships.channel_id = chat_channels.id
    AND channel_memberships.user_id = auth.uid()
  )
);
```

### Input Validation

All user inputs are validated:
- **Channel names**: 2-100 characters, trimmed
- **Types**: Must be 'category', 'text', or 'voice'
- **Visibility**: Must be 'public' or 'private'
- **Parent references**: Validated to exist and be a category

## Performance Optimizations

### Efficient Data Loading

1. **Single API Call**: Fetch all channels with hierarchy in one request
2. **Client-side Organization**: Organize data structure in memory
3. **Memoization**: Use React hooks to prevent unnecessary re-renders

### Real-time Optimization

1. **Filtered Subscriptions**: Only subscribe to relevant channels (group_id IS NULL)
2. **Debounced Updates**: Prevent excessive reloads on rapid changes
3. **Selective Reloading**: Only reload when data actually changes

## Error Handling

### Network Errors
```javascript
try {
  const data = await fetchJson(...);
  // Success
} catch (error) {
  console.error('Error:', error);
  setError(error.message || 'Failed to load channels');
}
```

### Validation Errors
- Empty names: "Channel name is required"
- Invalid types: "Invalid channel type"
- Missing parent: "Category not found"

### Permission Errors
- Unauthorized: "Access denied"
- Insufficient role: "Requires owner or moderator role"

## Testing Considerations

### Unit Tests

Test individual components:
- CategoryChannelSidebar: Rendering, click handlers, collapse state
- CreateCategoryChannelModal: Form validation, submission
- useCategoryChannels: Data fetching, organization, real-time updates

### Integration Tests

Test component interactions:
- Creating a category auto-generates "General" channel
- Selecting a channel updates active state
- Real-time updates reflect in UI

### E2E Tests

Test complete user flows:
- Login → Create category → Create channel → Send message
- Private channel: Create → Invite member → Verify access

## Future Enhancements

### Planned Features

1. **Voice Channel Functionality**
   - WebRTC integration
   - Audio streaming
   - Push-to-talk

2. **Advanced Permissions**
   - Custom role creation
   - Per-channel permission overrides
   - Role hierarchy

3. **Channel Management**
   - Drag-and-drop reordering
   - Move channels between categories
   - Bulk operations

4. **Enhanced UI**
   - Channel icons
   - Custom emojis
   - Rich text formatting

5. **Mobile Optimization**
   - Responsive sidebar
   - Touch gestures
   - Native app integration

## Maintenance

### Regular Tasks

1. **Monitor Real-time Performance**
   - Check subscription count
   - Monitor latency
   - Optimize queries if needed

2. **Database Maintenance**
   - Clean up orphaned channels
   - Archive old messages
   - Optimize indexes

3. **User Feedback**
   - Collect usage statistics
   - Monitor error rates
   - Gather feature requests

### Troubleshooting

**Issue**: Channels not updating in real-time
- Check Supabase connection
- Verify subscription is active
- Check RLS policies

**Issue**: Permission denied errors
- Verify user authentication
- Check channel_memberships entries
- Review RLS policies

**Issue**: Slow channel loading
- Check API response time
- Optimize database queries
- Add caching if needed

## Contributing

When contributing to this feature:

1. Follow existing code patterns
2. Add JSDoc comments to components
3. Include PropTypes or TypeScript types
4. Write tests for new functionality
5. Update documentation

## References

- [Supabase Real-time Documentation](https://supabase.com/docs/guides/realtime)
- [React Hooks Best Practices](https://react.dev/reference/react)
- [Discord UI/UX Patterns](https://discord.com)

---

**Last Updated**: January 2026  
**Version**: 1.0  
**Maintainer**: TSI Manager Development Team
