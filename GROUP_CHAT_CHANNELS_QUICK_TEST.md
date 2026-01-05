# Group Chat with Channels - Quick Test Guide

## 🚀 Quick Start Testing

This guide provides the essential tests to verify the group chat with channels implementation works correctly.

---

## Prerequisites

1. **Backend Running**:
   ```bash
   cd backend
   npm install
   npm start
   ```
   ✅ Should see: "✅ Server running on port 3000" and "🔌 WebSocket server ready"

2. **Frontend Running**:
   ```bash
   cd frontend
   npm install
   npm start
   ```
   ✅ Should open browser at http://localhost:3001

3. **Test Accounts**:
   - User A (admin of a test group)
   - User B (member of the same group)

---

## ✅ Essential Tests (5 minutes)

### Test 1: Channel List Loads
1. Log in as User A
2. Open a test group
3. Click "Chat" tab

**Expected**:
- ✅ Channel list appears on the left
- ✅ If no channels exist, see "Aucun canal" message
- ✅ "+" button visible (you're admin)

---

### Test 2: Create Channel
1. Click "+" button in channel list
2. Enter name: "General"
3. Click "Créer"

**Expected**:
- ✅ Channel created and appears in list
- ✅ Channel is auto-selected
- ✅ Chat area shows "# General" header

---

### Test 3: Send Message
1. Type "Hello!" in the input field
2. Press Enter or click "Envoyer"

**Expected**:
- ✅ Message appears immediately
- ✅ Shows your name
- ✅ Shows timestamp
- ✅ Input cleared

---

### Test 4: Real-time Messaging
1. Open same group/channel in another browser (as User B)
2. Send message from User A
3. Watch User B's screen

**Expected**:
- ✅ Message appears on User B's screen within 1 second
- ✅ No refresh needed
- ✅ Shows User A's name

---

### Test 5: Delete Message
1. Hover over your own message
2. Click trash icon
3. Check both User A and User B screens

**Expected**:
- ✅ Trash icon appears on hover
- ✅ Message deleted on both screens
- ✅ No error in console

---

## 🔍 Additional Tests (10 minutes)

### Test 6: Typing Indicator
1. User A starts typing (don't send)
2. Watch User B's screen

**Expected**:
- ✅ "User A est en train d'écrire..." appears
- ✅ Disappears after 2-3 seconds of no typing

---

### Test 7: Channel Switching
1. Create a second channel "Random"
2. Switch between "General" and "Random"
3. Send messages in each

**Expected**:
- ✅ Each channel has its own messages
- ✅ Active channel is highlighted
- ✅ Messages don't mix between channels

---

### Test 8: Infinite Scroll
*Only if channel has 60+ messages*

1. Open channel with many messages
2. Scroll to top
3. Click "Charger plus de messages"

**Expected**:
- ✅ Loads 50 messages initially
- ✅ Can load more messages
- ✅ Smooth scrolling

---

### Test 9: Access Control
1. Log in as User B (member, not admin)
2. Open same group

**Expected**:
- ✅ Can see all channels
- ✅ Can send/delete own messages
- ✅ Cannot see "+" button (not admin)

---

### Test 10: Network Reconnection
1. Send a message
2. Disconnect from network (WiFi off)
3. Try to send message
4. Reconnect network

**Expected**:
- ✅ Error shown when disconnected
- ✅ Auto-reconnects when network back
- ✅ Can send messages again

---

## 🐛 Common Issues

### Issue: WebSocket not connecting
**Symptoms**: Messages don't appear in real-time
**Check**:
- Backend console shows "✅ Client connected"
- Browser console shows "✅ Connected to WebSocket server"
- No CORS errors in console

**Fix**:
- Verify REACT_APP_API_URL=http://localhost:3000
- Check backend is running on port 3000
- Clear browser cache and reload

---

### Issue: Cannot create channel
**Symptoms**: "+" button not visible or create fails
**Check**:
- User is admin of the group
- Backend console for errors

**Fix**:
- Verify user role in study_group_members table
- Check browser console for API errors

---

### Issue: Messages not loading
**Symptoms**: Empty chat or loading spinner
**Check**:
- Browser console for errors
- Backend console for API errors
- Network tab for failed requests

**Fix**:
- Verify user is member of group
- Check Supabase connection
- Verify RLS policies in database

---

## 📊 Test Results

Record your test results:

```
Date: _____________
Tester: _____________

Essential Tests:
[ ] Test 1: Channel List Loads
[ ] Test 2: Create Channel
[ ] Test 3: Send Message
[ ] Test 4: Real-time Messaging
[ ] Test 5: Delete Message

Additional Tests:
[ ] Test 6: Typing Indicator
[ ] Test 7: Channel Switching
[ ] Test 8: Infinite Scroll
[ ] Test 9: Access Control
[ ] Test 10: Network Reconnection

Issues Found: _____________
Overall Status: ✅ Pass / ❌ Fail / ⚠️ Partial
```

---

## 🎯 Success Criteria

✅ Implementation is ready for production when:
- All essential tests pass
- Real-time messaging works reliably
- No console errors
- Access control verified
- Performance is acceptable (< 2 sec for actions)

---

## 📝 Next Steps

After testing:
1. Document any bugs found
2. Test on different browsers
3. Test on mobile devices
4. Perform load testing (multiple users)
5. Review security (authentication, authorization)

For comprehensive testing, see [GROUP_CHAT_TEST_PLAN.md](./GROUP_CHAT_TEST_PLAN.md)
