# Testing Chat Message Deletion Feature

## Overview
This document provides instructions for testing the chat message deletion feature and verifying that it works correctly with Supabase Realtime synchronization.

## Prerequisites
1. Supabase project configured with environment variables
2. Database schema applied (see `database/schema.sql`)
3. At least 2 user accounts for testing realtime sync
4. Frontend application running (`npm start` in frontend directory)

## Test Cases

### Test 1: Basic Message Deletion (Single User)
**Objective:** Verify that a user can delete their own messages

**Steps:**
1. Login as User A
2. Navigate to the Chat/Discussion tab
3. Select any channel (e.g., "Général")
4. Send a test message (e.g., "This is a test message")
5. Click the trash icon (🗑️) next to your message
6. Confirm the deletion in the dialog

**Expected Results:**
- ✅ Confirmation dialog appears asking "Supprimer ce message ?"
- ✅ After confirming, message disappears from the chat
- ✅ Success toast notification appears: "Message supprimé avec succès"
- ✅ Console log shows: "Attempting to delete message: [messageId]"
- ✅ Console log shows: "Message deleted successfully: [messageId]"
- ✅ Console log shows: "Message deleted via Realtime: [messageId]"

**Failure Scenarios:**
- ❌ If error occurs, appropriate warning toast appears with specific error message
- ❌ No browser alert() dialog should appear (replaced with toast)

---

### Test 2: Delete Button Visibility
**Objective:** Verify that delete button only appears for user's own messages

**Steps:**
1. Login as User A
2. Send a message in any channel
3. Observe the message in the chat
4. Login as User B in another browser/incognito window
5. Navigate to the same channel
6. Observe User A's message

**Expected Results:**
- ✅ User A sees trash icon next to their own message
- ✅ User A sees "(vous)" label next to their username
- ✅ User B does NOT see trash icon next to User A's message
- ✅ Each user only sees delete buttons on their own messages

---

### Test 3: Realtime Synchronization (Multi-User)
**Objective:** Verify that message deletion syncs in real-time across all clients

**Steps:**
1. Login as User A in Browser 1
2. Login as User B in Browser 2 (incognito/different browser)
3. Both users navigate to the same channel
4. User A sends a message
5. Verify User B sees the message appear (realtime insert works)
6. User A deletes their message
7. Observe both browsers

**Expected Results:**
- ✅ User A's message appears in User B's browser within 1-2 seconds
- ✅ When User A deletes the message, it disappears from BOTH browsers
- ✅ User B's browser removes the message within 1-2 seconds
- ✅ No error messages in either browser console
- ✅ Both consoles show: "Message deleted via Realtime: [messageId]"
- ✅ Browser 1 shows: "Subscribed to channel: [channelId]"

---

### Test 4: Permission Validation
**Objective:** Verify RLS policy prevents unauthorized deletions

**Steps:**
1. Login as User A
2. Open browser DevTools > Console
3. Send a message and note its ID in the console logs
4. Logout and login as User B
5. In DevTools Console, attempt to manually delete User A's message:
```javascript
// Replace MESSAGE_ID with actual message ID
const { error } = await window.supabase
  .from('chat_messages')
  .delete()
  .eq('id', 'MESSAGE_ID');
console.log('Delete result:', error);
```

**Expected Results:**
- ✅ Delete operation fails
- ✅ Error contains RLS policy violation message
- ✅ Message remains visible in the chat
- ✅ User A's message is NOT deleted

---

### Test 5: Error Handling - Network Issues
**Objective:** Verify graceful handling of network errors

**Steps:**
1. Login as User A
2. Send a message
3. Open DevTools > Network tab
4. Throttle network to "Offline" or "Slow 3G"
5. Attempt to delete the message
6. Wait for timeout
7. Restore network connection

**Expected Results:**
- ✅ Warning toast appears with error message
- ✅ Message is NOT removed from local state until confirmed
- ✅ Console shows error details
- ❌ No crash or unhandled promise rejection

---

### Test 6: Fallback Deletion Mechanism
**Objective:** Verify that local fallback works if Realtime is delayed

**Steps:**
1. Login as User A
2. Send a message
3. Disable Supabase Realtime temporarily (in DevTools, pause script execution or modify network)
4. Delete the message
5. Wait 1-2 seconds

**Expected Results:**
- ✅ Message is removed from database (verify in Supabase dashboard)
- ✅ After 1 second, message is removed from UI even without Realtime event
- ✅ Console shows: "Realtime deletion not received, removing locally"
- ✅ UI remains consistent

---

### Test 7: Deletion of Non-Existent Message
**Objective:** Verify handling when message doesn't exist

**Steps:**
1. Login as User A
2. Send a message
3. In DevTools Console:
```javascript
// Create a fake message ID
await deleteMessage('00000000-0000-0000-0000-000000000000');
```

**Expected Results:**
- ✅ Warning toast appears: "Message introuvable"
- ✅ No API call is made to Supabase
- ✅ No errors in console

---

## Console Logs to Monitor

When testing, watch for these console logs:

### Successful Deletion:
```
Subscribed to channel: [channelId]
Attempting to delete message: [messageId]
Message deleted successfully: [messageId]
Message deleted via Realtime: [messageId]
```

### Failed Deletion:
```
Supabase delete error: [error details]
Erreur suppression message: [error]
```

### Realtime Issues:
```
Error subscribing to channel: [channelId]
Realtime deletion not received, removing locally
```

## Debugging Checklist

If message deletion is not working:

1. **Check RLS Policies:**
   - Go to Supabase Dashboard > SQL Editor
   - Verify policies exist:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'chat_messages';
   ```

2. **Check Realtime Configuration:**
   - Go to Supabase Dashboard > Database > Replication
   - Ensure `chat_messages` table has Realtime enabled
   - Ensure "DELETE" events are enabled for the table

3. **Check User Authentication:**
   - Verify user is logged in: `console.log(user)`
   - Verify auth.uid() is set: `console.log(await supabase.auth.getUser())`

4. **Check Network:**
   - Open DevTools > Network tab
   - Look for DELETE request to `/rest/v1/chat_messages`
   - Check response status (should be 204 No Content for success)

5. **Check Realtime Connection:**
   - Open DevTools > Console
   - Look for "Subscribed to channel" message
   - If missing, check Supabase Realtime quota and configuration

## Known Issues & Workarounds

### Issue: Realtime events not received
**Symptoms:** Messages don't disappear for other users
**Cause:** Realtime not enabled or quota exceeded
**Workaround:** 
- Enable Realtime for `chat_messages` table in Supabase Dashboard
- Check Realtime quota limits
- Fallback mechanism will still remove message locally after 1s

### Issue: "Permission denied" error
**Symptoms:** Warning toast shows RLS error
**Cause:** RLS policy not applied or user_id mismatch
**Workaround:**
- Re-run schema.sql to apply RLS policies
- Verify user is logged in
- Check that message.user_id matches current user

### Issue: Browser confirm dialog still appears
**Symptoms:** Old-style alert instead of modern UI
**Cause:** Expected behavior - confirmation dialog uses browser confirm
**Note:** This is intentional for simplicity. Can be replaced with custom modal if needed.

## Success Criteria

All tests must pass with these criteria:
- ✅ Users can delete their own messages
- ✅ Users cannot delete other users' messages
- ✅ Deletions sync in real-time across all clients
- ✅ Error messages are clear and user-friendly (toasts, not alerts)
- ✅ RLS policies enforce security
- ✅ Fallback mechanism works if Realtime is delayed
- ✅ Console logs provide debugging information
- ✅ No unhandled errors or crashes

## Automated Testing (Future)

To add automated tests for this feature:

1. Create `frontend/src/features/chat/deleteMessage.test.js`
2. Mock Supabase client and Realtime subscription
3. Test all error paths and success scenarios
4. Use React Testing Library for component testing
5. Use Jest for unit testing individual functions

Example test structure:
```javascript
describe('deleteMessage', () => {
  it('should delete message successfully', async () => {
    // Mock supabase.from().delete()
    // Call deleteMessage()
    // Assert success toast appears
    // Assert message removed from state
  });
  
  it('should show error for unauthorized deletion', async () => {
    // Mock RLS error
    // Call deleteMessage()
    // Assert warning toast appears
  });
});
```
