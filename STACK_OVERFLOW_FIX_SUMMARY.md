# Stack Overflow Fix Summary

## Problem Description
The application was experiencing "Maximum call stack size exceeded" errors caused by:
1. Recursive function calls
2. Infinite re-render loops in React hooks
3. Unmemoized callback functions in useEffect dependencies

## Root Causes Identified

### 1. Recursive Logging Functions (CRITICAL)
**Location**: `frontend/src/hooks/useStudyGroups.js` (lines 6-12)

**Problem**:
```javascript
const log = (...args) => {
  if (isDev) log(...args);  // ❌ Calls itself recursively!
};
```

**Fix**:
```javascript
const log = (...args) => {
  if (isDev) console.log(...args);  // ✅ Calls console.log
};
```

### 2. Infinite Re-render Loops in useEffect
**Locations**: Multiple custom hooks

**Problem**: useEffect dependencies included callback functions that changed on every render, causing infinite loops:
```javascript
useEffect(() => {
  loadData();
}, [userId, loadData]); // ❌ loadData changes every render
```

**Fix**: Remove unstable callback functions from dependencies:
```javascript
useEffect(() => {
  loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [userId]); // ✅ Only re-run when userId changes
```

### 3. Unmemoized Toast Functions
**Location**: `frontend/src/components/Toast.js`

**Problem**: Toast hook functions were recreated on every render:
```javascript
const showSuccess = (message, duration) => addToast(message, 'success', duration);
```

**Fix**: Wrap functions with useCallback:
```javascript
const showSuccess = useCallback((message, duration) => 
  addToast(message, 'success', duration), [addToast]);
```

## Files Modified

1. **frontend/src/hooks/useStudyGroups.js**
   - Fixed recursive logging functions
   - Fixed useEffect dependency array

2. **frontend/src/hooks/useSRS.js**
   - Fixed useEffect dependency array (line 342)

3. **frontend/src/hooks/useGamification.js**
   - Fixed useEffect dependency array (line 377)

4. **frontend/src/hooks/useNotifications.js**
   - Fixed 2 useEffect dependency arrays (lines 307, 328)

5. **frontend/src/hooks/useQuiz.js**
   - Fixed useEffect dependency array (line 299)

6. **frontend/src/components/Toast.js**
   - Added useCallback memoization to all functions
   - Added useCallback import

## Best Practices Implemented

### 1. useEffect Dependencies
- Only include stable values in dependency arrays
- Use `eslint-disable-next-line react-hooks/exhaustive-deps` with a comment explaining why
- Prefer primitive values (strings, numbers) over objects/functions

### 2. useCallback Usage
- Wrap all functions returned from custom hooks with useCallback
- Ensure proper dependency arrays for useCallback
- Use refs for values that shouldn't trigger re-renders

### 3. Logging Patterns
- Always call console methods directly (console.log, console.warn, console.error)
- Never create wrapper functions that call themselves
- Use const for logging utilities, not function declarations

## Testing
- ✅ All existing utility tests pass (151 tests)
- ✅ No new stack overflow errors
- ✅ All hooks load data correctly
- ⚠️ One unrelated test failure (window.matchMedia mock issue)

## Prevention Guidelines

### When Writing Custom Hooks:
1. Always use useCallback for returned functions
2. Be careful with useEffect dependencies
3. Test hooks in isolation
4. Document why dependencies are excluded

### When Using useEffect:
1. Keep dependency arrays minimal
2. Only include values that should trigger re-runs
3. Use refs for values that shouldn't cause re-renders
4. Add eslint-disable comments with explanations

### Code Review Checklist:
- [ ] No recursive function calls
- [ ] All custom hook functions use useCallback
- [ ] useEffect dependencies are minimal and necessary
- [ ] No objects/arrays created inline in JSX
- [ ] Logging functions call console methods directly

## Impact
- ✅ Application now runs without stack overflow errors
- ✅ Performance improved (fewer unnecessary re-renders)
- ✅ Code is more maintainable with proper memoization
- ✅ Better debugging with proper logging patterns

## Documentation Added
- Added inline comments explaining eslint-disable usage
- Added comments explaining why dependencies are excluded
- This summary document for future reference
