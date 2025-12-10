# Group Chat Testing Plan

## Test Environment Setup

### Prerequisites
1. Supabase project configured
2. Database migrations applied (study_groups and group_chats tables)
3. At least 2 test user accounts
4. At least 1 study group with members

### Test Data Setup
```sql
-- Create test users (if not exists)
-- User A: Will be group member
-- User B: Will be group member
-- User C: Will NOT be group member

-- Create test group
INSERT INTO study_groups (name, description, created_by) 
VALUES ('Test Group', 'Group for testing chat', 'USER_A_UUID');

-- Add User A as admin (automatic via trigger)
-- Add User B as member
INSERT INTO study_group_members (group_id, user_id, role)
VALUES ('TEST_GROUP_UUID', 'USER_B_UUID', 'member');
```

## Test Cases

### 1. Database Security Tests

#### Test 1.1: Member Can Read Messages
**Setup**: Login as User A (group member)
**Steps**:
1. Execute query: `SELECT * FROM group_chats WHERE group_id = 'TEST_GROUP_UUID'`
**Expected**: Query succeeds, returns messages (or empty array)
**Status**: [ ]

#### Test 1.2: Non-Member Cannot Read Messages
**Setup**: Login as User C (NOT a group member)
**Steps**:
1. Execute query: `SELECT * FROM group_chats WHERE group_id = 'TEST_GROUP_UUID'`
**Expected**: Query returns empty array (RLS filters results)
**Status**: [ ]

#### Test 1.3: Member Can Insert Messages
**Setup**: Login as User A (group member)
**Steps**:
1. Execute insert:
```sql
INSERT INTO group_chats (group_id, user_id, message)
VALUES ('TEST_GROUP_UUID', 'USER_A_UUID', 'Test message')
```
**Expected**: Insert succeeds
**Status**: [ ]

#### Test 1.4: Non-Member Cannot Insert Messages
**Setup**: Login as User C (NOT a group member)
**Steps**:
1. Attempt insert:
```sql
INSERT INTO group_chats (group_id, user_id, message)
VALUES ('TEST_GROUP_UUID', 'USER_C_UUID', 'Test message')
```
**Expected**: Insert fails with permission error
**Status**: [ ]

#### Test 1.5: User Can Delete Own Messages Only
**Setup**: Login as User A, User A has message with id MSG_A
**Steps**:
1. User A deletes MSG_A: `DELETE FROM group_chats WHERE id = 'MSG_A_UUID'`
2. User B attempts to delete MSG_A: `DELETE FROM group_chats WHERE id = 'MSG_A_UUID'`
**Expected**: 
- Step 1 succeeds
- Step 2 fails (message already deleted or permission denied)
**Status**: [ ]

### 2. React Hook Tests

#### Test 2.1: Hook Loads Messages on Mount
**Setup**: User A in test group with 3 messages
**Steps**:
1. Mount component with useGroupChat hook
2. Check messages state
**Expected**: Hook loads 3 messages
**Status**: [ ]

#### Test 2.2: Hook Sends Message Successfully
**Setup**: User A in test group
**Steps**:
1. Call sendMessage('Hello world')
2. Check database for new message
**Expected**: Message appears in database with correct group_id, user_id
**Status**: [ ]

#### Test 2.3: Hook Rejects Empty Messages
**Setup**: User A in test group
**Steps**:
1. Call sendMessage('')
2. Call sendMessage('   ')
**Expected**: Both calls throw error, no messages sent
**Status**: [ ]

#### Test 2.4: Hook Receives Real-time Updates
**Setup**: User A and User B both in test group, both have hook mounted
**Steps**:
1. User A sends message via hook
2. Check User B's messages state
**Expected**: User B sees new message appear in real-time
**Status**: [ ]

#### Test 2.5: Hook Handles Message Deletion
**Setup**: User A in test group with 1 message
**Steps**:
1. Call deleteMessage(messageId)
2. Check messages state
**Expected**: Message removed from state and database
**Status**: [ ]

#### Test 2.6: Hook Cleans Up Subscriptions
**Setup**: User A in test group
**Steps**:
1. Mount component with hook
2. Unmount component
3. Check Supabase subscriptions
**Expected**: Subscription is removed, no memory leak
**Status**: [ ]

### 3. UI Component Tests

#### Test 3.1: Component Shows Loading State
**Setup**: Slow network simulation
**Steps**:
1. Render GroupChat component
2. Observe loading state
**Expected**: Loading spinner appears before messages load
**Status**: [ ]

#### Test 3.2: Component Shows Empty State
**Setup**: Group with no messages
**Steps**:
1. Render GroupChat component
**Expected**: Empty state message displayed with emoji
**Status**: [ ]

#### Test 3.3: Component Displays Messages
**Setup**: Group with 5 messages
**Steps**:
1. Render GroupChat component
2. Check message display
**Expected**: All 5 messages displayed with correct content and timestamps
**Status**: [ ]

#### Test 3.4: Component Auto-Scrolls to New Messages
**Setup**: Group with 20 messages (requires scrolling)
**Steps**:
1. Render GroupChat component (scrolled to bottom)
2. New message arrives via real-time
**Expected**: Component auto-scrolls to show new message
**Status**: [ ]

#### Test 3.5: User Can Send Message
**Setup**: User A in group, component rendered
**Steps**:
1. Type message in input field
2. Click send button
3. Check message list
**Expected**: Message appears in list, input cleared
**Status**: [ ]

#### Test 3.6: User Can Delete Own Message
**Setup**: User A has sent 1 message
**Steps**:
1. Hover over own message
2. Click delete button
3. Check message list
**Expected**: Message removed from list
**Status**: [ ]

#### Test 3.7: User Cannot Delete Other's Messages
**Setup**: User B viewing User A's message
**Steps**:
1. Hover over User A's message
2. Check for delete button
**Expected**: No delete button visible on User A's messages
**Status**: [ ]

#### Test 3.8: Timestamp Formatting
**Setup**: Messages from today, yesterday, and last week
**Steps**:
1. Render GroupChat component
2. Check timestamp displays
**Expected**: 
- Today: "14:30"
- Yesterday: "Hier 14:30"
- Last week: "05/12 14:30"
**Status**: [ ]

#### Test 3.9: Dark Mode Support
**Setup**: Group with messages
**Steps**:
1. Render with isDark={true}
2. Render with isDark={false}
**Expected**: Both modes display correctly with appropriate colors
**Status**: [ ]

#### Test 3.10: Message Length Validation
**Setup**: User in group
**Steps**:
1. Type 1001 characters in input
2. Attempt to send
**Expected**: Input limited to 1000 characters
**Status**: [ ]

### 4. Integration Tests

#### Test 4.1: Chat Tab Visible in GroupDetail
**Setup**: User A is member of test group
**Steps**:
1. Open GroupDetail for test group
2. Check tabs
**Expected**: "Chat" tab is first tab and visible
**Status**: [ ]

#### Test 4.2: Chat Tab Shows Chat Component
**Setup**: User A is member of test group
**Steps**:
1. Open GroupDetail
2. Click Chat tab
**Expected**: GroupChat component renders with messages
**Status**: [ ]

#### Test 4.3: Non-Member Sees Locked State
**Setup**: User C viewing public group (not a member)
**Steps**:
1. Open GroupDetail for test group
2. Click Chat tab
**Expected**: Locked message displayed, no chat functionality
**Status**: [ ]

#### Test 4.4: Multiple Users Can Chat Simultaneously
**Setup**: User A and User B both in group, both viewing chat
**Steps**:
1. User A sends message "Hello"
2. User B sends message "Hi there"
3. User A sends message "How are you?"
**Expected**: All messages appear in order for both users in real-time
**Status**: [ ]

### 5. Performance Tests

#### Test 5.1: Load Time with 100 Messages
**Setup**: Group with 100 messages
**Steps**:
1. Measure time to load and render messages
**Expected**: Loads in < 2 seconds
**Status**: [ ]

#### Test 5.2: Real-time Update Latency
**Setup**: User A and User B in same group
**Steps**:
1. User A sends message
2. Measure time until User B sees it
**Expected**: < 500ms latency
**Status**: [ ]

#### Test 5.3: Memory Usage During Long Session
**Setup**: Chat open for 30 minutes with messages coming in
**Steps**:
1. Monitor browser memory usage
2. Send/receive 50 messages over 30 minutes
**Expected**: No memory leaks, stable memory usage
**Status**: [ ]

### 6. Error Handling Tests

#### Test 6.1: Network Error During Send
**Setup**: Simulate network failure
**Steps**:
1. Disconnect network
2. Attempt to send message
**Expected**: Error displayed, message not sent
**Status**: [ ]

#### Test 6.2: Database Connection Lost
**Setup**: Simulate Supabase connection loss
**Steps**:
1. Kill Supabase connection
2. Attempt operations
**Expected**: Appropriate error messages, graceful degradation
**Status**: [ ]

#### Test 6.3: Invalid Group ID
**Setup**: Pass non-existent group_id to hook
**Steps**:
1. Mount hook with invalid group_id
**Expected**: No crash, error logged
**Status**: [ ]

### 7. Cross-Browser Tests

Test in the following browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

Expected: Consistent behavior across all browsers

### 8. Mobile Responsiveness Tests

#### Test 8.1: Mobile Layout
**Setup**: Mobile device or responsive mode (375px width)
**Steps**:
1. Open GroupDetail with chat
**Expected**: Chat displays properly, messages wrap correctly
**Status**: [ ]

#### Test 8.2: Touch Interactions
**Setup**: Touch device
**Steps**:
1. Scroll messages
2. Tap input field
3. Tap send button
**Expected**: All touch interactions work smoothly
**Status**: [ ]

## Test Results Summary

### Passed: __ / __
### Failed: __ / __
### Blocked: __ / __

## Issues Found

| Issue ID | Severity | Description | Status |
|----------|----------|-------------|---------|
| | | | |

## Sign-off

- [ ] All critical tests passed
- [ ] All security tests passed
- [ ] No blocking issues
- [ ] Documentation updated
- [ ] Ready for production

**Tester**: _______________
**Date**: _______________
**Environment**: _______________
