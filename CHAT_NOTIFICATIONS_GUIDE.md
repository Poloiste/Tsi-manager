# Chat Notification System - Implementation Guide

## Overview

This document describes the chat notification system implemented for TSI Manager, which provides real-time notifications when new messages arrive in the chat channels.

## Features Implemented

### 1. Browser Notification Permission Request
- ✅ Automatically requests notification permission when user first accesses the chat tab
- ✅ Shows permission request dialog after 1-second delay (non-intrusive)
- ✅ Permission state is tracked to avoid repeated requests

### 2. Toast Notifications for Current Channel
- ✅ Visual toast notifications appear when new messages arrive in the currently viewed channel
- ✅ Shows message preview with author name and first 50 characters
- ✅ Only shown for messages from other users (not your own messages)
- ✅ Auto-dismisses after 5 seconds

### 3. Unread Message Badges
- ✅ **Main Discussions Tab Badge**: Red badge with unread count appears on the "💬 Discussions" navigation tab
- ✅ **Channel Badges**: Each channel shows unread message count in channel selector
- ✅ Badges animate with pulse effect to draw attention
- ✅ Shows "9+" for counts greater than 9
- ✅ Badges appear on:
  - Desktop navigation (full label)
  - Tablet navigation (compact)
  - Mobile navigation (drawer menu)

### 4. Browser Notifications (Background)
- ✅ Native browser notifications when app is in background (tab not focused)
- ✅ Shows channel name, author, and message preview
- ✅ Only sent when document is not visible
- ✅ Auto-dismisses after 5 seconds
- ✅ Can be toggled on/off by user

### 5. Sound Notifications
- ✅ Plays notification sound using Web Audio API
- ✅ Simple sine wave beep (800Hz, 300ms)
- ✅ Can be toggled on/off by user
- ✅ Plays for both current channel and other channels

### 6. Notification Management (Anti-Spam)
- ✅ **Cooldown System**: 3-second cooldown per channel prevents notification spam
- ✅ **Silent Browser Notifications**: Browser notifications are silent (sound handled separately)
- ✅ **Notification Deduplication**: Uses channel-specific tags to prevent duplicate browser notifications
- ✅ **Rate Limiting**: Only one notification per channel every 3 seconds

### 7. Unread Message Tracking
- ✅ Tracks unread messages per channel
- ✅ Persists across sessions using localStorage
- ✅ Automatically marks channel as read when viewed
- ✅ Updates in real-time as messages arrive

### 8. User Controls
- ✅ **Sound Toggle Button**: Toggle notification sound on/off (blue icon in chat header)
- ✅ **Browser Notification Toggle**: Toggle browser notifications on/off (purple icon in chat header)
- ✅ Visual feedback shows enabled/disabled state
- ✅ Settings persist across sessions

## Technical Implementation

### New Files Created

1. **`frontend/src/hooks/useChatNotifications.js`**
   - Custom React hook managing all chat notification logic
   - Handles sound generation with Web Audio API
   - Manages unread message counts per channel
   - Implements cooldown/rate limiting
   - Persists settings and unread counts to localStorage

### Modified Files

1. **`frontend/src/App.js`**
   - Added import for `useChatNotifications` hook
   - Added import for notification icons (Volume2, VolumeX, BellOff)
   - Fixed missing `useQuiz` import
   - Integrated chat notifications hook
   - Added notification permission request on chat tab access
   - Modified real-time message subscriptions to handle notifications:
     - Current channel subscription shows toasts
     - Global message subscription tracks unread counts
   - Added unread badges to all navigation tabs
   - Added notification control buttons to chat header
   - Added unread badges to channel selector buttons

## User Experience Flow

### First Time Using Chat
1. User clicks on "💬 Discussions" tab
2. After 1 second, browser prompts for notification permission
3. User grants or denies permission
4. Permission state is saved for future sessions

### Receiving Messages in Current Channel
1. New message arrives in currently viewed channel
2. Toast notification appears in top-right corner with message preview
3. Notification sound plays (if enabled)
4. No badge is shown (already viewing the channel)

### Receiving Messages in Other Channels
1. New message arrives in a channel user is not viewing
2. Unread count badge appears on the specific channel
3. Total unread count badge appears on "💬 Discussions" tab
4. Notification sound plays (if enabled)
5. If browser notifications enabled and tab not focused: browser notification appears

### Switching Channels
1. User clicks on a channel with unread messages
2. Channel immediately loads messages
3. Unread badge for that channel disappears
4. Total unread count updates

### Notification Controls
Users can toggle notifications without leaving the chat:
- Click **🔊 icon** to enable/disable sound
- Click **🔔 icon** to enable/disable browser notifications
- Icons show visual feedback (blue when enabled, gray when disabled)

## Browser Compatibility

- **Sound Notifications**: Works in all modern browsers with Web Audio API support
- **Browser Notifications**: Requires notification permission (Chrome, Firefox, Safari, Edge)
- **localStorage**: Used for persistence - works in all modern browsers

## Privacy & Performance

### Privacy
- ✅ No data sent to external servers
- ✅ All notification processing happens client-side
- ✅ Unread counts stored only in localStorage (user's browser)
- ✅ Browser notifications respect user's permission choice

### Performance
- ✅ Efficient cooldown system prevents excessive notifications
- ✅ Minimal memory footprint (only tracks unread counts)
- ✅ No polling - uses Supabase real-time subscriptions
- ✅ Debounced notification handling prevents UI lag

## Testing Scenarios

To test the notification system:

1. **Test Sound Notifications**
   - Open chat, ensure sound is enabled
   - Have another user send a message
   - Verify beep sound plays

2. **Test Toast Notifications**
   - View a channel
   - Have another user send a message in that channel
   - Verify toast appears in top-right corner

3. **Test Unread Badges**
   - View Channel A
   - Have another user send messages in Channel B
   - Verify badge appears on Channel B button
   - Verify badge appears on main "Discussions" tab
   - Switch to Channel B
   - Verify badges disappear

4. **Test Browser Notifications**
   - Enable browser notifications in chat
   - Switch to another tab or minimize browser
   - Have another user send a message
   - Verify native browser notification appears

5. **Test Cooldown/Anti-Spam**
   - Have another user send multiple messages quickly
   - Verify only one notification per 3 seconds

6. **Test Settings Persistence**
   - Disable sound
   - Refresh page
   - Verify sound remains disabled

## Future Enhancements (Not Implemented)

Potential improvements for future iterations:
- 🔮 Custom notification sounds
- 🔮 Per-channel notification preferences
- 🔮 Mute/unmute individual channels
- 🔮 DND (Do Not Disturb) mode with time schedule
- 🔮 Rich browser notifications with action buttons
- 🔮 Notification history/log
- 🔮 @mention notifications with higher priority
- 🔮 Desktop app with system tray notifications

## Code Quality

- ✅ ESLint compliant (builds successfully)
- ✅ Proper React hooks usage (no warnings)
- ✅ Comprehensive comments and documentation
- ✅ Error handling for browser API failures
- ✅ Graceful degradation when APIs unavailable

## Summary

The chat notification system is fully functional and provides a polite, non-intrusive way for users to stay updated on new messages across all channels. The implementation follows React best practices, respects user preferences, and includes anti-spam measures to ensure a pleasant user experience.
