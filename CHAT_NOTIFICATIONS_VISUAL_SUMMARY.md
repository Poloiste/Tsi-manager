# Chat Notification System - Visual Summary

## 🎯 Overview

This document provides a visual walkthrough of the chat notification system implemented for TSI Manager.

---

## 📱 Notification Badge on Main Tab

### Before Messages Arrive
```
Navigation Bar:
┌─────────────────────────────────────────────────────────┐
│ 📅 Planning | 💬 Discussions | 🎴 Révision | 📚 Cours │
└─────────────────────────────────────────────────────────┘
```

### After Messages Arrive in Other Channels
```
Navigation Bar:
┌──────────────────────────────────────────────────────────────┐
│ 📅 Planning | 💬 Discussions [🔴3] | 🎴 Révision | 📚 Cours │
└──────────────────────────────────────────────────────────────┘
                           ↑
                    Red pulsing badge
                    shows total unread
                    count across all
                    channels
```

---

## 💬 Channel Selector with Badges

### Clean State
```
Channel Selector:
┌────────────────────────────────────────────────────┐
│ [Général] [Maths] [Physique] [SII] [Informatique] │
└────────────────────────────────────────────────────┘
```

### With Unread Messages
```
Channel Selector:
┌──────────────────────────────────────────────────────────────┐
│ [Général] [Maths 🔴2] [Physique] [SII 🔴1] [Informatique] │
└──────────────────────────────────────────────────────────────┘
              ↑                      ↑
       Unread badges         Per-channel counts
       on channel tabs       disappear when
                            channel is viewed
```

---

## 🎨 Chat Header with Notification Controls

```
Chat Header:
┌─────────────────────────────────────────────────────────────┐
│ 💬 Général [Matière]                        🔊 🔔           │
│                                              ↑   ↑           │
│                                           Sound Browser     │
│                                           Toggle Notif      │
│                                           (Blue) (Purple)   │
└─────────────────────────────────────────────────────────────┘

When disabled:
┌─────────────────────────────────────────────────────────────┐
│ 💬 Général [Matière]                        🔇 🔕           │
│                                              ↑   ↑           │
│                                           Muted  Disabled   │
│                                           (Gray) (Gray)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔔 Toast Notification (Current Channel)

When a message arrives in the channel you're currently viewing:

```
Top-Right Corner:
┌────────────────────────────────────────────┐
│ 🔵 💬 Alice: Bonjour! Quelqu'un peut...   │ ← Slide in animation
│                                        [X] │
└────────────────────────────────────────────┘
                                         ↑
                                    Close button
                              Auto-dismiss after 5s
```

---

## 🖥️ Browser Notification (Background)

When you're on another tab or app:

```
System Notification:
┌────────────────────────────────────────────┐
│ 💬 Maths                                   │
│ Bob: Est-ce que quelqu'un a compris...     │
│                                            │
│ [5 seconds ago]                            │
└────────────────────────────────────────────┘
```

---

## 📱 Mobile Menu with Badge

```
Mobile Drawer Menu:
┌────────────────────────────────────┐
│ 📅 Planning                        │
│ ┌────────────────────────────────┐ │
│ │ 💬 Discussions          [🔴 3] │ │ ← Unread badge
│ └────────────────────────────────┘ │    on right side
│ 🎴 Révision                        │
│ 📚 Cours                           │
│ 🌐 Communauté                      │
└────────────────────────────────────┘
```

---

## 🎭 Notification Flow Diagram

```
User Experience Flow:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. New Message Arrives                                    │
│     ↓                                                       │
│  2. Check: Is it my own message?                           │
│     ├─ Yes → No notification                               │
│     └─ No → Continue                                       │
│        ↓                                                    │
│  3. Check: In current channel?                             │
│     ├─ Yes → Toast notification + Sound                    │
│     └─ No → Badge + Sound + Browser notification*         │
│               ↓                                             │
│  4. Cooldown: Wait 3 seconds before next notification      │
│     from same channel                                       │
│                                                             │
│  * Browser notification only if:                           │
│    - Enabled by user                                       │
│    - Permission granted                                    │
│    - Tab not focused                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎵 Sound Notification

```
Audio Visualization (Web Audio API):
┌──────────────────────────────────────────────┐
│                                              │
│   Frequency: 800Hz                           │
│   Duration: 300ms                            │
│   Type: Sine wave                            │
│                                              │
│   Volume:  ▂▅▇█▇▅▂                          │
│   Time:    0───→300ms                        │
│                                              │
│   Effect: Gentle "beep" sound               │
│           Not intrusive                      │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 💾 Data Persistence

```
localStorage Structure:
{
  "chatUnreadMessages_user123": {
    "channel-id-1": 2,    // Maths: 2 unread
    "channel-id-2": 1,    // SII: 1 unread
    "channel-id-3": 0     // Cleared after viewing
  },
  "chatSoundEnabled": true,
  "chatBrowserNotificationsEnabled": false
}
```

---

## 🔐 Permission Flow

```
First Time Accessing Chat:
┌──────────────────────────────────────────────┐
│ 1. User clicks "💬 Discussions" tab          │
│    ↓                                          │
│ 2. Wait 1 second (non-intrusive delay)       │
│    ↓                                          │
│ 3. Browser shows permission dialog:          │
│    ┌────────────────────────────────────┐    │
│    │ tsimanager.com wants to            │    │
│    │ show notifications                  │    │
│    │                                     │    │
│    │  [Block] [Allow]                   │    │
│    └────────────────────────────────────┘    │
│    ↓                                          │
│ 4. Save permission state                     │
│    ↓                                          │
│ 5. Enable/disable browser notifications      │
│    accordingly                                │
└──────────────────────────────────────────────┘
```

---

## 📊 User Actions & Responses

### Sound Toggle
```
Before: 🔊 (Blue, Sound Enabled)
Action: User clicks button
After:  🔇 (Gray, Sound Disabled)
Result: No beep on new messages
```

### Browser Notification Toggle
```
Before: 🔔 (Purple, Notifications Enabled)
Action: User clicks button
After:  🔕 (Gray, Notifications Disabled)
Result: No system notifications
```

### Viewing Channel with Unread Messages
```
Before: [Maths 🔴2] → Channel has 2 unread
Action: User clicks channel
After:  [Maths]     → Badge disappears
Result: Messages marked as read instantly
```

---

## 🎯 Anti-Spam Protection

```
Scenario: Rapid messages in same channel

Timeline:
00:00 → Message 1 arrives → ✓ Notification sent
00:01 → Message 2 arrives → ✗ Blocked (cooldown)
00:02 → Message 3 arrives → ✗ Blocked (cooldown)
00:03 → Message 4 arrives → ✓ Notification sent (cooldown expired)
00:04 → Message 5 arrives → ✗ Blocked (new cooldown)
00:06 → Message 6 arrives → ✓ Notification sent

Result: Maximum 1 notification per 3 seconds per channel
        Prevents notification spam
        User still sees all messages in chat
```

---

## 🌟 Responsive Design

### Desktop (≥1024px)
```
┌─────────────────────────────────────────────────────────┐
│ TSI1 Manager                                    [User]  │
│ ┌──────────────────────────────────────────────────┐    │
│ │ 📅 Planning | 💬 Discussions [3] | 🎴 Révision │    │
│ └──────────────────────────────────────────────────┘    │
│                                                          │
│           Full labels + badges clearly visible          │
└─────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1023px)
```
┌────────────────────────────────────────────┐
│ TSI1 Manager                        [User] │
│ ┌────────────────────────────────────────┐ │
│ │ 📅 | 💬[3] | 🎴 | 📚 | 🌐 | 📝 | 👥 │ │
│ └────────────────────────────────────────┘ │
│                                            │
│      Compact icons + badges scroll         │
└────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────────────┐
│ TSI1 Manager     ☰       │ ← Hamburger menu
│                          │
│  [Tap to open drawer]    │
│                          │
│  Drawer shows:           │
│  💬 Discussions    [3] → │
│                          │
└──────────────────────────┘
```

---

## ✅ Success Indicators

✓ **Build**: Compiles successfully  
✓ **Security**: No vulnerabilities (CodeQL)  
✓ **Code Quality**: ESLint compliant  
✓ **Performance**: Efficient cooldown system  
✓ **UX**: Non-intrusive notifications  
✓ **Accessibility**: Clear visual feedback  
✓ **Persistence**: Settings & counts saved  
✓ **Cross-browser**: Web Audio API + Notification API  

---

## 🎨 Color Palette

```
Badge Colors:
- Unread: bg-red-500 (Bright red)
- Active: bg-gradient-to-r from-indigo-600 to-purple-600
- Sound On: bg-indigo-600/30 (Blue tint)
- Notif On: bg-purple-600/30 (Purple tint)
- Disabled: bg-slate-700/50 (Gray)

Animations:
- Badge: animate-pulse (draws attention)
- Toast: Slide from right with fade
- Icons: Smooth color transitions
```

---

## 📚 Key Technologies Used

- **React Hooks**: useState, useEffect, useCallback, useRef
- **Web Audio API**: For notification sounds
- **Notification API**: For browser notifications
- **localStorage**: For persistence
- **Supabase Realtime**: For message subscriptions
- **Tailwind CSS**: For styling
- **Lucide Icons**: For UI icons

---

## 🔮 Future Enhancement Ideas

While not implemented in this PR, these could be added later:

1. **Custom Sounds**: User-uploadable notification sounds
2. **Per-Channel Settings**: Mute individual channels
3. **DND Schedule**: Auto-disable during study hours
4. **Rich Notifications**: Action buttons in browser notifications
5. **@Mentions**: Higher priority for mentions
6. **Notification History**: Log of past notifications
7. **Desktop App**: System tray integration

---

## 📝 Summary

The chat notification system provides a comprehensive, polite, and effective way for users to stay informed about new messages. It balances functionality with user experience, ensuring notifications are helpful without being intrusive.

**Key Highlights:**
- 🎯 Smart notification routing (current vs. other channels)
- 🛡️ Anti-spam protection with cooldown
- 💾 Persistent state across sessions
- 🎨 Clear visual indicators
- 🔒 Respects user preferences
- ⚡ Real-time updates via WebSocket
- 🌐 Cross-platform browser support
