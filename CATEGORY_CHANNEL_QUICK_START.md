# Quick Start Guide - Category and Channel System

## 🚀 Get Started in 5 Minutes

This guide will help you quickly set up and test the new category and channel system.

---

## Prerequisites

- Node.js installed
- Access to Supabase database
- Backend dependencies installed
- User authentication configured

---

## Step 1: Run the Database Migration

**Option A: Using Supabase Dashboard**

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Open the migration file: `database/migrations/add_category_and_channel_system.sql`
4. Copy and paste the entire content
5. Click "Run"
6. Wait for success message

**Option B: Using Command Line**

```bash
# If you have Supabase CLI installed
cd /home/runner/work/Tsi-manager/Tsi-manager
supabase db push database/migrations/add_category_and_channel_system.sql

# Or using psql
psql -h your-db-host -U your-user -d your-db \
     -f database/migrations/add_category_and_channel_system.sql
```

**Verify migration:**

```sql
-- Check new columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'chat_channels';

-- Expected: parent_id, channel_type, visibility, created_by, updated_at, position

-- Check new table exists
SELECT * FROM channel_memberships LIMIT 0;
```

---

## Step 2: Start the Backend Server

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already installed)
npm install

# Start the server
npm start
```

Expected output:
```
✅ Server running on port 3000
🗄️  Connected to Supabase at https://your-project.supabase.co
📡 API available at http://localhost:3000/api
🔌 WebSocket server ready
```

---

## Step 3: Test with cURL

Get a user ID from your Supabase auth users table first, then run these tests:

```bash
# Set your user ID
export USER_ID="your-user-uuid-here"

# Test 1: Create a category
curl -X POST http://localhost:3000/api/channels \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Study Group",
    "type": "category",
    "visibility": "public",
    "created_by": "'$USER_ID'"
  }'

# Save the returned category ID
export CATEGORY_ID="category-uuid-from-response"

# Test 2: Create a text channel under the category
curl -X POST http://localhost:3000/api/channels \
  -H "Content-Type: application/json" \
  -d '{
    "name": "General Chat",
    "type": "text",
    "parent_id": "'$CATEGORY_ID'",
    "visibility": "public",
    "created_by": "'$USER_ID'"
  }'

# Test 3: Create a private voice channel
curl -X POST http://localhost:3000/api/channels \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Private Voice",
    "type": "voice",
    "parent_id": "'$CATEGORY_ID'",
    "visibility": "private",
    "created_by": "'$USER_ID'"
  }'

# Save the voice channel ID
export VOICE_ID="voice-channel-uuid-from-response"

# Test 4: List all channels with hierarchy
curl "http://localhost:3000/api/channels?user_id=$USER_ID&include_children=true"

# Test 5: Add a member to the private voice channel
export FRIEND_ID="another-user-uuid"
curl -X POST http://localhost:3000/api/channels/$VOICE_ID/memberships \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'$USER_ID'",
    "target_user_id": "'$FRIEND_ID'",
    "role": "member"
  }'

# Test 6: List channel members
curl "http://localhost:3000/api/channels/$VOICE_ID/memberships?user_id=$USER_ID"
```

---

## Step 4: Run Automated Tests

```bash
# Navigate to backend directory
cd backend

# Set your test user ID
export TEST_USER_ID="your-user-uuid-here"

# Run the test script
node test-category-channel-system.js
```

Expected output:
```
========================================
Category and Channel System Tests
========================================

ℹ️  Test 1: Creating a category...
✅ Category created: Test Category (ID: ...)

ℹ️  Test 2: Creating a text channel under category...
✅ Text channel created: General Chat (ID: ...)

ℹ️  Test 3: Creating a private voice channel...
✅ Private voice channel created: Private Voice (ID: ...)

ℹ️  Test 4: Verifying auto-membership for private channel...
✅ Auto-membership verified: Role = owner

...

========================================
All tests completed!
========================================
```

---

## Step 5: Integration with Frontend

### Example React Component

```javascript
import React, { useState, useEffect } from 'react';

function ChannelList({ userId }) {
  const [channels, setChannels] = useState({ categories: [], orphan_channels: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, [userId]);

  const fetchChannels = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/channels?user_id=${userId}&include_children=true`
      );
      const data = await response.json();
      setChannels(data);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (name) => {
    try {
      const response = await fetch('http://localhost:3000/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type: 'category',
          visibility: 'public',
          created_by: userId
        })
      });
      const newCategory = await response.json();
      fetchChannels(); // Refresh list
      return newCategory;
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const createChannel = async (name, type, parentId, visibility = 'public') => {
    try {
      const response = await fetch('http://localhost:3000/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          parent_id: parentId,
          visibility,
          created_by: userId
        })
      });
      const newChannel = await response.json();
      fetchChannels(); // Refresh list
      return newChannel;
    } catch (error) {
      console.error('Failed to create channel:', error);
    }
  };

  if (loading) return <div>Loading channels...</div>;

  return (
    <div className="channel-list">
      <h2>Channels</h2>
      
      <button onClick={() => createCategory('New Category')}>
        + New Category
      </button>

      {channels.categories.map(category => (
        <div key={category.id} className="category">
          <h3>📁 {category.name}</h3>
          
          <button onClick={() => createChannel('New Channel', 'text', category.id)}>
            + Add Channel
          </button>

          {category.children.map(channel => (
            <div key={channel.id} className="channel">
              {channel.channel_type === 'text' ? '💬' : '🔊'}
              {channel.visibility === 'private' && '🔒'}
              <span>{channel.name}</span>
            </div>
          ))}
        </div>
      ))}

      {channels.orphan_channels.length > 0 && (
        <div className="orphans">
          <h3>Other Channels</h3>
          {channels.orphan_channels.map(channel => (
            <div key={channel.id} className="channel">
              {channel.channel_type === 'text' ? '💬' : '🔊'}
              <span>{channel.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChannelList;
```

---

## Common Use Cases

### Use Case 1: Create a Study Category

```javascript
// Create category
const category = await fetch('http://localhost:3000/api/channels', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Mathematics Study',
    type: 'category',
    visibility: 'public',
    created_by: userId
  })
}).then(r => r.json());

// Create text channel
const textChannel = await fetch('http://localhost:3000/api/channels', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Algebra Help',
    type: 'text',
    parent_id: category.id,
    visibility: 'public',
    created_by: userId
  })
}).then(r => r.json());

// Create private voice channel
const voiceChannel = await fetch('http://localhost:3000/api/channels', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Study Session',
    type: 'voice',
    parent_id: category.id,
    visibility: 'private',
    created_by: userId
  })
}).then(r => r.json());

// You're automatically the owner of the voice channel!
```

### Use Case 2: Manage Private Channel Members

```javascript
// Add a member
await fetch(`http://localhost:3000/api/channels/${channelId}/memberships`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: myUserId,
    target_user_id: friendUserId,
    role: 'member'
  })
});

// List all members
const members = await fetch(
  `http://localhost:3000/api/channels/${channelId}/memberships?user_id=${myUserId}`
).then(r => r.json());

// Remove a member
await fetch(
  `http://localhost:3000/api/channels/${channelId}/memberships/${memberUserId}?user_id=${myUserId}`,
  { method: 'DELETE' }
);
```

### Use Case 3: Update Channel Properties

```javascript
// Rename a channel
await fetch(`http://localhost:3000/api/channels/${channelId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: myUserId,
    name: 'New Channel Name'
  })
});

// Change visibility
await fetch(`http://localhost:3000/api/channels/${channelId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: myUserId,
    visibility: 'private'
  })
});

// Change position (for sorting)
await fetch(`http://localhost:3000/api/channels/${channelId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: myUserId,
    position: 5
  })
});
```

---

## Troubleshooting

### Error: "User authentication required"

**Problem:** `user_id` is missing from request

**Solution:** 
```javascript
// Always include user_id in query parameters or body
fetch(`/api/channels?user_id=${userId}`)
```

### Error: "Parent must be a category"

**Problem:** Trying to create a channel with a non-category parent

**Solution:**
```javascript
// First, verify the parent is a category
const parent = await fetch(`/api/channels/${parentId}?user_id=${userId}`)
  .then(r => r.json());

if (parent.channel_type !== 'category') {
  console.error('Parent must be a category');
}
```

### Error: "Cannot delete category with channels"

**Problem:** Trying to delete a category that has child channels

**Solution:**
```javascript
// First, get all children
const children = await fetch(
  `/api/channels/${categoryId}/children?user_id=${userId}`
).then(r => r.json());

// Delete all children first
for (const child of children) {
  await fetch(
    `/api/channels/${child.id}?user_id=${userId}`,
    { method: 'DELETE' }
  );
}

// Now delete the category
await fetch(
  `/api/channels/${categoryId}?user_id=${userId}`,
  { method: 'DELETE' }
);
```

### Error: "You do not have access to this channel"

**Problem:** Trying to access a private channel without membership

**Solution:**
```javascript
// Check if you're a member first
const members = await fetch(
  `/api/channels/${channelId}/memberships?user_id=${userId}`
).then(r => r.json()).catch(() => []);

const isMember = members.some(m => m.user_id === userId);
if (!isMember) {
  console.log('You need to be added to this channel');
}
```

---

## Next Steps

1. **Read the documentation:**
   - `CATEGORY_CHANNEL_API_DOCUMENTATION.md` - Complete API reference
   - `CATEGORY_CHANNEL_VISUAL_GUIDE.md` - Visual diagrams
   - `CATEGORY_CHANNEL_IMPLEMENTATION_SUMMARY.md` - Full details

2. **Test the system:**
   - Run `backend/test-category-channel-system.js`
   - Try the cURL examples above
   - Test with your frontend application

3. **Integrate with frontend:**
   - Use the React example above
   - Adapt to your component structure
   - Add real-time updates with Socket.IO

4. **Deploy to production:**
   - Run the migration on production database
   - Deploy the updated backend
   - Monitor for issues

---

## Support

If you encounter issues:

1. Check the logs in your terminal
2. Review the API documentation
3. Run the test script to verify the system
4. Check the troubleshooting section above

---

## Quick Links

- 📚 [Full API Documentation](CATEGORY_CHANNEL_API_DOCUMENTATION.md)
- 📊 [Visual Guide](CATEGORY_CHANNEL_VISUAL_GUIDE.md)
- 📝 [Implementation Summary](CATEGORY_CHANNEL_IMPLEMENTATION_SUMMARY.md)
- 🧪 [Test Script](backend/test-category-channel-system.js)
- 🗄️ [Migration File](database/migrations/add_category_and_channel_system.sql)

---

**Happy coding! 🚀**
