# Schedule Replacement Feature - Implementation Summary

## Overview
This implementation adds the functionality where custom events (DS, Colle, DM, etc.) **replace** base schedule courses that occur at the same time slot, rather than displaying both events.

## Problem Statement
**Before:** When adding a custom event (e.g., "DS Méca 8h-10h") to a time slot that already has a base course (e.g., "Méca cours 8h-10h"), both events would display, causing confusion.

**After:** When adding a custom event to a time slot with an existing base course, only the custom event is displayed. The base course is automatically filtered out.

## Implementation Details

### Files Modified
1. **`frontend/src/App.js`** (lines ~2182-2185)
   - Updated `getDaySchedule` function to use the new utility function
   - Added import for `getDayScheduleUtil` from scheduleUtils

### Files Added
1. **`frontend/src/utils/scheduleUtils.js`**
   - `getStartHour(timeStr)`: Extracts start hour from time strings
   - `getDaySchedule(baseSchedule, customEvents, week, day)`: Main logic for combining schedules with replacement

2. **`frontend/src/utils/scheduleUtils.test.js`**
   - 20 unit tests covering all edge cases

3. **`frontend/src/utils/scheduleUtils.integration.test.js`**
   - 5 integration tests demonstrating real-world scenarios

## How It Works

### 1. Time Parsing
The function extracts the start hour from time strings like:
- `"8h-10h"` → 8
- `"14h-16h"` → 14
- `"8h00-10h00"` → 8
- `"13h30-18h"` → 13

### 2. Replacement Logic
```
1. Get base courses for the day
2. Get custom events for the specific week and day
3. Extract start hours from all custom events
4. Filter base courses: exclude any that have the same start hour as a custom event
5. Combine filtered base courses with custom events
6. Sort chronologically by start hour
```

### 3. Example Scenarios

#### Scenario 1: DS replaces a course
**Base Schedule (Monday):**
- 8h-10h: Méca cours
- 10h-13h: Elec TD
- 14h-15h: Français cours

**Custom Event:**
- Week 10, Monday, 8h-10h: DS Méca

**Result:**
- 8h-10h: **DS Méca** (replaces Méca cours)
- 10h-13h: Elec TD
- 14h-15h: Français cours

#### Scenario 2: Event added to empty slot
**Base Schedule (Monday):**
- 8h-10h: Méca cours
- 10h-13h: Elec TD

**Custom Event:**
- Week 10, Monday, 12h-13h: Réunion

**Result:**
- 8h-10h: Méca cours
- 10h-13h: Elec TD
- 12h-13h: **Réunion** (added, no replacement)

#### Scenario 3: Multiple replacements
**Base Schedule (Monday):**
- 8h-10h: Méca cours
- 10h-13h: Elec TD
- 14h-15h: Français cours

**Custom Events:**
- Week 10, Monday, 8h-10h: DS Méca
- Week 10, Monday, 14h-15h: Colle Français

**Result:**
- 8h-10h: **DS Méca** (replaces Méca cours)
- 10h-13h: Elec TD
- 14h-15h: **Colle Français** (replaces Français cours)

## Testing

### Test Coverage
- **Unit Tests:** 20 tests covering time parsing, filtering, sorting, and edge cases
- **Integration Tests:** 5 tests covering real-world scenarios from the problem statement
- **Total:** All 69 tests pass (including existing tests)

### Test Results
```
✓ Test 1: DS replaces Méca course at 8h-10h on Monday
✓ Test 2: DS replaces Maths TD at 14h-16h on Tuesday
✓ Test 3: Event added to empty time slot without replacing any course
✓ Test 4: Base course reappears when custom event is removed
✓ Test 5: Multiple custom events correctly replace multiple base courses
```

### Build Status
✅ Production build succeeds with no compilation errors

## User Impact

### Benefits
1. **Cleaner Schedule Display:** No duplicate events at the same time slot
2. **Intuitive Behavior:** Custom events naturally override base schedule
3. **Flexible:** Works with any time format used in the application
4. **Reversible:** Removing a custom event restores the original base course

### Edge Cases Handled
- Null/undefined base schedule or custom events
- Invalid time formats
- Multiple custom events on the same day
- Custom events on different weeks
- Empty time slots

## Code Quality

### Security
✅ CodeQL scan: 0 vulnerabilities found

### Code Review
✅ Automated review: No issues found

### Best Practices
- Comprehensive test coverage
- Pure functions (no side effects)
- Clear documentation
- Handles edge cases gracefully
- Minimal changes to existing code

## Backward Compatibility
This change is **fully backward compatible**. The function signature remains the same in App.js, and the behavior only changes when custom events exist. If there are no custom events, the schedule displays exactly as before.
