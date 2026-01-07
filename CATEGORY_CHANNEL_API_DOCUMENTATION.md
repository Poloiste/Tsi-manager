# Category and Channel System API Documentation

## Overview

This document describes the API endpoints for the new category and channel system, which provides a Discord-like hierarchical structure for organizing chat channels.

## Key Concepts

### Channel Types
- **`category`**: A container for organizing channels (like Discord categories)
- **`text`**: A text-based chat channel
- **`voice`**: A voice chat channel

### Visibility
- **`public`**: Accessible to all authenticated users
- **`private`**: Only accessible to members with explicit permissions

### Roles
- **`owner`**: Full control over the channel (can delete, modify, add/remove members)
- **`moderator`**: Can moderate messages and add/remove members
- **`member`**: Can send messages and view channel content

### Hierarchy
- Categories are top-level containers (no parent)
- Text and voice channels can belong to a category via `parent_id`
- Channels can also be standalone (no parent)

---

## API Endpoints

### 1. Create a Category or Channel

**Endpoint:** `POST /api/channels`

**Description:** Creates a new category, text channel, or voice channel.

**Request Body:**
```json
{
  "name": "Category Name or Channel Name",
  "type": "category | text | voice",
  "parent_id": "uuid | null",
  "visibility": "public | private",
  "created_by": "user-uuid"
}
```

**Example - Create a Category:**
```json
POST /api/channels
{
  "name": "Study Resources",
  "type": "category",
  "visibility": "public",
  "created_by": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Example - Create a Text Channel under a Category:**
```json
POST /api/channels
{
  "name": "General Discussion",
  "type": "text",
  "parent_id": "category-uuid-here",
  "visibility": "public",
  "created_by": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Example - Create a Private Voice Channel:**
```json
POST /api/channels
{
  "name": "Study Group Voice",
  "type": "voice",
  "parent_id": "category-uuid-here",
  "visibility": "private",
  "created_by": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:** `201 Created`
```json
{
  "id": "channel-uuid",
  "name": "General Discussion",
  "channel_type": "text",
  "parent_id": "category-uuid",
  "visibility": "public",
  "created_by": "user-uuid",
  "created_at": "2026-01-07T15:30:00Z",
  "updated_at": "2026-01-07T15:30:00Z",
  "position": 0
}
```

**Validation Rules:**
- Categories cannot have a `parent_id`
- If `parent_id` is provided, it must reference a category
- Name must be 1-100 characters
- `type` must be one of: `category`, `text`, `voice`
- `visibility` must be one of: `public`, `private`

---

### 2. List All Accessible Channels

**Endpoint:** `GET /api/channels?user_id=USER_ID&include_children=true`

**Description:** Returns all channels the user can access, optionally organized by hierarchy.

**Query Parameters:**
- `user_id` (required): The authenticated user's ID
- `include_children` (optional): If `true`, returns hierarchical structure

**Response (with `include_children=true`):**
```json
{
  "categories": [
    {
      "id": "category-uuid-1",
      "name": "Study Resources",
      "channel_type": "category",
      "visibility": "public",
      "created_at": "2026-01-07T15:00:00Z",
      "children": [
        {
          "id": "channel-uuid-1",
          "name": "General Discussion",
          "channel_type": "text",
          "visibility": "public",
          "parent_id": "category-uuid-1"
        },
        {
          "id": "channel-uuid-2",
          "name": "Study Voice",
          "channel_type": "voice",
          "visibility": "private",
          "parent_id": "category-uuid-1"
        }
      ]
    }
  ],
  "orphan_channels": [
    {
      "id": "channel-uuid-3",
      "name": "Random Chat",
      "channel_type": "text",
      "visibility": "public",
      "parent_id": null
    }
  ]
}
```

**Response (without `include_children`):**
```json
[
  {
    "id": "category-uuid-1",
    "name": "Study Resources",
    "channel_type": "category",
    "visibility": "public"
  },
  {
    "id": "channel-uuid-1",
    "name": "General Discussion",
    "channel_type": "text",
    "parent_id": "category-uuid-1",
    "visibility": "public"
  }
]
```

---

### 3. Get Channel Details

**Endpoint:** `GET /api/channels/:id?user_id=USER_ID`

**Description:** Returns details for a specific channel.

**Response:**
```json
{
  "id": "channel-uuid",
  "name": "General Discussion",
  "channel_type": "text",
  "parent_id": "category-uuid",
  "visibility": "public",
  "created_by": "user-uuid",
  "created_at": "2026-01-07T15:30:00Z",
  "updated_at": "2026-01-07T15:30:00Z",
  "position": 0,
  "user_role": "owner"
}
```

**Note:** `user_role` is included for private channels where the user is a member.

---

### 4. Get Child Channels of a Category

**Endpoint:** `GET /api/channels/:id/children?user_id=USER_ID`

**Description:** Returns all channels that belong to a specific category.

**Response:**
```json
[
  {
    "id": "channel-uuid-1",
    "name": "General Discussion",
    "channel_type": "text",
    "visibility": "public",
    "parent_id": "category-uuid"
  },
  {
    "id": "channel-uuid-2",
    "name": "Study Voice",
    "channel_type": "voice",
    "visibility": "private",
    "parent_id": "category-uuid"
  }
]
```

---

### 5. Update a Channel

**Endpoint:** `PUT /api/channels/:id`

**Description:** Updates channel properties. Only owners and moderators can update.

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "name": "New Channel Name",
  "visibility": "private",
  "position": 5
}
```

**Response:** `200 OK`
```json
{
  "id": "channel-uuid",
  "name": "New Channel Name",
  "channel_type": "text",
  "visibility": "private",
  "position": 5,
  "updated_at": "2026-01-07T16:00:00Z"
}
```

---

### 6. Delete a Channel

**Endpoint:** `DELETE /api/channels/:id?user_id=USER_ID`

**Description:** Deletes a channel or category. Only owners can delete.

**Response:** `200 OK`
```json
{
  "message": "Channel deleted successfully"
}
```

**Note:** Categories with child channels cannot be deleted. Delete children first.

---

### 7. Add Member to Channel

**Endpoint:** `POST /api/channels/:id/memberships`

**Description:** Adds a user to a private channel with a specific role.

**Request Body:**
```json
{
  "user_id": "requesting-user-uuid",
  "target_user_id": "user-to-add-uuid",
  "role": "member | moderator | owner"
}
```

**Response:** `201 Created`
```json
{
  "id": "membership-uuid",
  "channel_id": "channel-uuid",
  "user_id": "user-uuid",
  "role": "member",
  "joined_at": "2026-01-07T16:30:00Z"
}
```

**Validation:**
- Only owners and moderators can add members
- Can only add members to private channels (not categories or public channels)
- Role must be one of: `owner`, `moderator`, `member`

---

### 8. List Channel Members

**Endpoint:** `GET /api/channels/:id/memberships?user_id=USER_ID`

**Description:** Returns all members of a channel.

**Response:**
```json
[
  {
    "id": "membership-uuid-1",
    "channel_id": "channel-uuid",
    "user_id": "user-uuid-1",
    "role": "owner",
    "joined_at": "2026-01-07T15:30:00Z"
  },
  {
    "id": "membership-uuid-2",
    "channel_id": "channel-uuid",
    "user_id": "user-uuid-2",
    "role": "member",
    "joined_at": "2026-01-07T16:00:00Z"
  }
]
```

---

### 9. Remove Member from Channel

**Endpoint:** `DELETE /api/channels/:id/memberships/:targetUserId?user_id=USER_ID`

**Description:** Removes a user from a channel. Users can remove themselves, or owners/moderators can remove others.

**Response:** `200 OK`
```json
{
  "message": "User removed from channel successfully"
}
```

**Validation:**
- Users can always remove themselves
- Only owners and moderators can remove others
- Moderators cannot remove owners

---

## Usage Examples

### Complete Workflow: Creating a Study Category with Channels

```javascript
// 1. Create a category
const category = await fetch('http://localhost:3000/api/channels', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Study Group',
    type: 'category',
    visibility: 'public',
    created_by: userId
  })
}).then(r => r.json());

// 2. Create a public text channel
const textChannel = await fetch('http://localhost:3000/api/channels', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'General Chat',
    type: 'text',
    parent_id: category.id,
    visibility: 'public',
    created_by: userId
  })
}).then(r => r.json());

// 3. Create a private voice channel
const voiceChannel = await fetch('http://localhost:3000/api/channels', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Private Study Session',
    type: 'voice',
    parent_id: category.id,
    visibility: 'private',
    created_by: userId
  })
}).then(r => r.json());

// 4. Add a member to the private voice channel
await fetch(`http://localhost:3000/api/channels/${voiceChannel.id}/memberships`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: userId,
    target_user_id: friendUserId,
    role: 'member'
  })
});

// 5. List all channels with hierarchy
const channels = await fetch(
  `http://localhost:3000/api/channels?user_id=${userId}&include_children=true`
).then(r => r.json());
```

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "error": "Missing required fields: name, type, created_by"
}
```

**401 Unauthorized:**
```json
{
  "error": "User authentication required"
}
```

**403 Forbidden:**
```json
{
  "error": "You do not have permission to update this channel"
}
```

**404 Not Found:**
```json
{
  "error": "Channel not found"
}
```

**409 Conflict:**
```json
{
  "error": "User is already a member of this channel"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Database error message"
}
```

---

## Security Notes

1. **Authentication:** All endpoints require `user_id` parameter. In production, this should be derived from an authenticated session, not from request parameters.

2. **Row-Level Security (RLS):** Database policies enforce:
   - Public channels are visible to everyone
   - Private channels are only visible to members
   - Only owners can delete channels
   - Only owners and moderators can modify channels

3. **Input Validation:** All inputs are validated for:
   - Type correctness
   - Length limits
   - Referential integrity
   - Business logic constraints

4. **Cascading Deletes:** Deleting a channel automatically removes:
   - All messages in that channel
   - All memberships for that channel
   - Child channels (if category)

---

## Database Schema

### `chat_channels` Table
```sql
- id: UUID (primary key)
- name: TEXT
- type: TEXT (legacy field)
- channel_type: TEXT ('category', 'text', 'voice')
- parent_id: UUID (references chat_channels.id)
- visibility: TEXT ('public', 'private')
- group_id: UUID (for group-linked channels)
- created_by: UUID
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- position: INTEGER
```

### `channel_memberships` Table
```sql
- id: UUID (primary key)
- channel_id: UUID (references chat_channels.id)
- user_id: UUID (references auth.users.id)
- role: TEXT ('owner', 'moderator', 'member')
- joined_at: TIMESTAMP
```

---

## Migration Guide

To apply the database migration:

1. Run the migration script:
```sql
-- Run database/migrations/add_category_and_channel_system.sql
```

2. The migration will:
   - Add new columns to `chat_channels`
   - Create `channel_memberships` table
   - Update RLS policies
   - Add helper functions and triggers
   - Migrate existing data

3. Verify the migration:
```bash
node backend/test-category-channel-system.js
```

---

## Future Enhancements

Potential future improvements:
- Channel permissions (read/write separately)
- Channel templates
- Bulk member operations
- Channel archiving
- Activity logging
- Notifications for channel events
