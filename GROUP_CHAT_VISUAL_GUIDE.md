# Group Chat Visual Guide

## Feature Overview

The group chat feature allows members of study groups to communicate in real-time. Only group members can view and participate in their group's chat.

## UI Components

### 1. GroupDetail - Chat Tab

The Chat tab is the first tab in the GroupDetail component:

```
┌─────────────────────────────────────────────────────────────┐
│  📚 Test Study Group                                    [X] │
│  A group for collaborative learning                         │
│  Code: ABC123 [📋]                                          │
├─────────────────────────────────────────────────────────────┤
│  [💬 Chat] [👥 Membres] [🏆 Classement] [📚 Decks]        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Chat Content Area (see below)                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Chat Interface - Empty State

When no messages exist:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                          💬                                 │
│                                                             │
│                   Aucun message                            │
│     Soyez le premier à envoyer un message dans ce groupe!  │
│                                                             │
│                                                             │
│  ┌──────────────────────────────────────┐  ┌──────────┐  │
│  │ Écrivez un message...                │  │  Envoyer │  │
│  └──────────────────────────────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3. Chat Interface - With Messages

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────┐                           │
│  │ Bonjour tout le monde!      │                           │
│  │ 14:30                       │                           │
│  └─────────────────────────────┘                           │
│                                                             │
│                          ┌─────────────────────────────┐   │
│                          │ Salut! Comment ça va? [🗑]  │   │
│                          │ 14:32                       │   │
│                          └─────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────┐                           │
│  │ Très bien, merci!           │                           │
│  │ Hier 20:15                  │                           │
│  └─────────────────────────────┘                           │
│                                                             │
│  ┌──────────────────────────────────────┐  ┌──────────┐  │
│  │ Écrivez un message...                │  │  Envoyer │  │
│  └──────────────────────────────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Notes**:
- Messages from current user appear on the RIGHT with indigo background
- Messages from other users appear on the LEFT with gray/slate background
- Delete button (🗑) only appears on YOUR messages when hovering
- Timestamps show relative time (HH:MM for today, "Hier HH:MM" for yesterday, DD/MM HH:MM for older)

### 4. Chat Interface - Non-Member View

When viewing a group you're not a member of:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                          🔒                                 │
│                                                             │
│              Accès réservé aux membres                     │
│         Rejoignez ce groupe pour accéder au chat.         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5. Dark Mode vs Light Mode

#### Dark Mode (Default)
- Background: Slate-800 (#1e293b)
- Messages (own): Indigo-600 → Purple-600 gradient
- Messages (others): Slate-700 (#334155)
- Input: Slate-700 background, slate-600 border
- Text: White/Slate-100

#### Light Mode
- Background: White (#ffffff)
- Messages (own): Indigo-500 → Purple-500 gradient
- Messages (others): Gray-200 (#e5e7eb)
- Input: White background, gray-300 border
- Text: Gray-900/Black

### 6. Message States

#### Sending State
```
┌──────────────────────────────────────┐  ┌──────────┐
│ Écrivez un message...                │  │ Envoi... │
└──────────────────────────────────────┘  └──────────┘
        (disabled, dimmed)                 (disabled)
```

#### Error State
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Impossible d'envoyer le message                         │
└─────────────────────────────────────────────────────────────┘
│  ┌──────────────────────────────────────┐  ┌──────────┐  │
│  │ Écrivez un message...                │  │  Envoyer │  │
│  └──────────────────────────────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 7. Message Interaction Flow

#### Sending a Message
1. User types in input field
2. User clicks "Envoyer" or presses Enter
3. Button shows "Envoi..." state
4. Message appears at bottom of chat
5. Input clears automatically
6. Chat auto-scrolls to bottom
7. Other group members see message in real-time

#### Deleting a Message
1. User hovers over their own message
2. Delete button (🗑) appears in top-right corner of message
3. User clicks delete button
4. Message disappears immediately (optimistic update)
5. Message removed from database via RLS
6. Other group members see message disappear in real-time

### 8. Responsive Behavior

#### Desktop (> 768px)
- Messages max-width: 80% of container
- Full-width input with send button side-by-side
- Comfortable padding and spacing

#### Tablet (768px - 480px)
- Messages max-width: 85% of container
- Input and button remain side-by-side but smaller

#### Mobile (< 480px)
- Messages max-width: 90% of container
- Input and button might stack on very small screens
- Touch-optimized button sizes

### 9. Accessibility Features

- Semantic HTML structure
- Keyboard navigation support
- Focus indicators on interactive elements
- ARIA labels where appropriate
- Color contrast meets WCAG AA standards
- Screen reader friendly message order

### 10. Real-time Features

#### What Updates in Real-time:
✅ New messages from other users
✅ Message deletions from any user
✅ Auto-scroll to new messages

#### What Doesn't Update in Real-time:
❌ User join/leave notifications (not implemented)
❌ "User is typing" indicators (not implemented)
❌ Read receipts (not implemented)

## User Flows

### Happy Path - Sending First Message
1. User opens GroupDetail for their study group
2. Clicks on "💬 Chat" tab (default tab)
3. Sees empty state with prompt
4. Types "Hello everyone!" in input field
5. Clicks "Envoyer"
6. Message appears with current timestamp
7. Other members see message immediately

### Happy Path - Deleting Own Message
1. User sees their message "Oops typo!" with mistake
2. Hovers over the message
3. Delete button appears
4. Clicks delete button
5. Message disappears
6. Other members see it disappear immediately

### Error Path - Non-Member Access
1. Non-member user finds public study group
2. Opens GroupDetail to see group info
3. Clicks "💬 Chat" tab
4. Sees locked icon and message
5. Cannot access chat functionality
6. Can join group to gain access

## Technical Notes

### Performance Optimizations
- Messages limited to 100 most recent
- Real-time subscription scoped to specific group
- Efficient duplicate prevention algorithm
- Automatic subscription cleanup on unmount

### Security Features
- RLS policies enforce member-only access at database level
- Client-side verification prevents unauthorized attempts
- User can only delete their own messages
- Message length limited to 1000 characters

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Known Limitations
- No message editing (delete and resend instead)
- No file attachments
- No rich text formatting
- No @mentions
- No message threading
- Maximum 100 messages loaded at once

## Future Enhancements

Potential improvements planned for future versions:
1. User names instead of IDs
2. Pagination for message history
3. "User is typing..." indicators
4. Read receipts
5. Message reactions (emoji)
6. File attachments
7. Rich text formatting
8. @mentions and notifications
9. Message search
10. Message editing
