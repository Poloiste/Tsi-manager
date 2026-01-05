# Group Chat API Documentation

This document describes the REST API endpoints and WebSocket events for the group chat system with channels.

## Table of Contents
- [REST API Endpoints](#rest-api-endpoints)
  - [Channel Management](#channel-management)
  - [Message Management](#message-management)
- [WebSocket Events](#websocket-events)
  - [Client Events](#client-events)
  - [Server Events](#server-events)
- [Authentication](#authentication)
- [Error Handling](#error-handling)

---

## REST API Endpoints

### Channel Management

#### Get Channels for a Group
```
GET /api/groups/:groupId/channels
```

**Description**: Retrieve all channels in a group.

**Parameters**:
- `groupId` (path) - UUID of the group
- `user_id` (query) - UUID of the authenticated user

**Response**:
```json
[
  {
    "id": "uuid",
    "group_id": "uuid",
    "name": "General",
    "type": "group",
    "created_at": "2026-01-05T19:00:00.000Z"
  }
]
```

**Status Codes**:
- `200 OK` - Success
- `401 Unauthorized` - Missing authentication
- `403 Forbidden` - User is not a member of the group
- `500 Internal Server Error` - Server error

---

#### Create a Channel
```
POST /api/groups/:groupId/channels
```

**Description**: Create a new channel in a group. Only group admins can create channels.

**Parameters**:
- `groupId` (path) - UUID of the group

**Request Body**:
```json
{
  "user_id": "uuid",
  "name": "General Discussion",
  "type": "group"
}
```

**Response**:
```json
{
  "id": "uuid",
  "group_id": "uuid",
  "name": "General Discussion",
  "type": "group",
  "created_at": "2026-01-05T19:00:00.000Z"
}
```

**Status Codes**:
- `201 Created` - Channel created successfully
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing authentication
- `403 Forbidden` - User is not an admin or not a member
- `500 Internal Server Error` - Server error

---

### Message Management

#### Get Messages in a Channel
```
GET /api/channels/:channelId/messages
```

**Description**: Retrieve messages from a channel with pagination support.

**Parameters**:
- `channelId` (path) - UUID of the channel
- `user_id` (query) - UUID of the authenticated user
- `limit` (query, optional) - Number of messages to return (default: 50, max: 100)
- `offset` (query, optional) - Offset for pagination (default: 0)

**Response**:
```json
{
  "messages": [
    {
      "id": "uuid",
      "channel_id": "uuid",
      "user_id": "uuid",
      "user_name": "John Doe",
      "content": "Hello everyone!",
      "created_at": "2026-01-05T19:00:00.000Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

**Status Codes**:
- `200 OK` - Success
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Missing authentication
- `403 Forbidden` - User doesn't have access to the channel
- `404 Not Found` - Channel not found
- `500 Internal Server Error` - Server error

---

#### Send a Message
```
POST /api/channels/:channelId/messages
```

**Description**: Send a message to a channel.

**Parameters**:
- `channelId` (path) - UUID of the channel

**Request Body**:
```json
{
  "user_id": "uuid",
  "user_name": "John Doe",
  "content": "Hello everyone!"
}
```

**Response**:
```json
{
  "id": "uuid",
  "channel_id": "uuid",
  "user_id": "uuid",
  "user_name": "John Doe",
  "content": "Hello everyone!",
  "created_at": "2026-01-05T19:00:00.000Z"
}
```

**Status Codes**:
- `201 Created` - Message sent successfully
- `400 Bad Request` - Invalid input (empty content, too long, etc.)
- `401 Unauthorized` - Missing authentication
- `403 Forbidden` - User doesn't have access to the channel
- `404 Not Found` - Channel not found
- `500 Internal Server Error` - Server error

---

#### Delete a Message
```
DELETE /api/channels/:channelId/messages/:messageId
```

**Description**: Delete a message. Users can only delete their own messages.

**Parameters**:
- `channelId` (path) - UUID of the channel
- `messageId` (path) - UUID of the message
- `user_id` (query) - UUID of the authenticated user

**Response**:
```json
{
  "message": "Message deleted successfully"
}
```

**Status Codes**:
- `200 OK` - Message deleted successfully
- `401 Unauthorized` - Missing authentication
- `403 Forbidden` - User can only delete their own messages
- `404 Not Found` - Message not found
- `500 Internal Server Error` - Server error

---

## WebSocket Events

The WebSocket connection is established at the same URL as the API server.

### Client Events

#### join_channel
Join a channel to start receiving real-time updates.

**Payload**:
```json
{
  "channelId": "uuid",
  "userId": "uuid",
  "userName": "John Doe"
}
```

**Response Events**:
- `error` - If user doesn't have access
- `user_joined` - Broadcast to other users in the channel

---

#### leave_channel
Leave a channel.

**Payload**:
```json
{
  "channelId": "uuid"
}
```

**Response Events**:
- `user_left` - Broadcast to other users in the channel

---

#### send_message
Send a message via WebSocket for real-time delivery.

**Payload**:
```json
{
  "channelId": "uuid",
  "content": "Hello everyone!"
}
```

**Response Events**:
- `new_message` - Broadcast to all users in the channel (including sender)
- `error` - If message couldn't be sent

---

#### typing
Send a typing indicator.

**Payload**:
```json
{
  "channelId": "uuid",
  "isTyping": true
}
```

**Response Events**:
- `user_typing` - Broadcast to other users in the channel

---

### Server Events

#### new_message
Received when a new message is posted to the channel.

**Payload**:
```json
{
  "id": "uuid",
  "channel_id": "uuid",
  "user_id": "uuid",
  "user_name": "John Doe",
  "content": "Hello everyone!",
  "created_at": "2026-01-05T19:00:00.000Z"
}
```

---

#### user_joined
Received when a user joins the channel.

**Payload**:
```json
{
  "userId": "uuid",
  "userName": "John Doe"
}
```

---

#### user_left
Received when a user leaves the channel.

**Payload**:
```json
{
  "userId": "uuid",
  "userName": "John Doe"
}
```

---

#### user_typing
Received when another user is typing.

**Payload**:
```json
{
  "userId": "uuid",
  "userName": "John Doe",
  "isTyping": true
}
```

---

#### error
Received when an error occurs.

**Payload**:
```json
{
  "message": "Error description"
}
```

---

## Authentication

**Current Implementation**: The API uses `user_id` passed as a query parameter or in the request body. This is a temporary solution for development.

**⚠️ Security Warning**: In production, authentication should be handled via:
- Session tokens
- JWT tokens
- OAuth tokens

The `user_id` should be extracted from the authenticated session, not from the request.

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Error Codes

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - User doesn't have permission
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Input Validation

**Channel Names**:
- Must be non-empty strings
- Maximum length: 100 characters

**Message Content**:
- Must be non-empty strings
- Maximum length: 5,000 characters

**Pagination**:
- `limit`: Integer between 1 and 100
- `offset`: Non-negative integer

---

## Usage Examples

### REST API Examples

#### Getting channels
```javascript
const response = await fetch(
  `${API_URL}/groups/${groupId}/channels?user_id=${userId}`
);
const channels = await response.json();
```

#### Creating a channel
```javascript
const response = await fetch(
  `${API_URL}/groups/${groupId}/channels`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      name: 'General Discussion',
      type: 'group'
    })
  }
);
const newChannel = await response.json();
```

#### Sending a message
```javascript
const response = await fetch(
  `${API_URL}/channels/${channelId}/messages`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      user_name: userName,
      content: 'Hello!'
    })
  }
);
const message = await response.json();
```

### WebSocket Examples

#### Connecting and joining a channel
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  socket.emit('join_channel', {
    channelId: 'channel-uuid',
    userId: 'user-uuid',
    userName: 'John Doe'
  });
});

socket.on('new_message', (message) => {
  console.log('New message:', message);
});
```

#### Sending a message
```javascript
socket.emit('send_message', {
  channelId: 'channel-uuid',
  content: 'Hello everyone!'
});
```

#### Typing indicator
```javascript
// Start typing
socket.emit('typing', {
  channelId: 'channel-uuid',
  isTyping: true
});

// Stop typing
socket.emit('typing', {
  channelId: 'channel-uuid',
  isTyping: false
});
```

---

## Performance Considerations

1. **Message Pagination**: Use `limit` and `offset` parameters to load messages in chunks
2. **Infinite Scroll**: Load older messages as the user scrolls up
3. **WebSocket Connection**: Reuse a single WebSocket connection for all channels
4. **Typing Indicators**: Debounce typing events to avoid excessive traffic
5. **Channel Switching**: Leave old channel before joining new one to reduce server load

---

## Security Best Practices

1. ✅ **Input Validation**: All inputs are validated on the server
2. ✅ **Access Control**: Users must be group members to access channels
3. ✅ **Rate Limiting**: Consider adding rate limiting in production
4. ⚠️ **Authentication**: Replace query parameter authentication with proper tokens
5. ✅ **SQL Injection**: Using parameterized queries via Supabase
6. ✅ **XSS Prevention**: Content is sanitized on display
