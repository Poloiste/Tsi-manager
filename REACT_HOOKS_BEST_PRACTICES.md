# React Hooks Best Practices Guide

## Table of Contents
1. [useEffect Dependencies](#useeffect-dependencies)
2. [useCallback and useMemo](#usecallback-and-usememo)
3. [Custom Hooks](#custom-hooks)
4. [Common Pitfalls](#common-pitfalls)
5. [Debugging Infinite Loops](#debugging-infinite-loops)

## useEffect Dependencies

### ✅ Good Practices

```javascript
// Only include primitive values that should trigger re-runs
useEffect(() => {
  fetchUserData(userId);
}, [userId]); // ✅ userId is a primitive value

// Exclude functions from dependencies if they don't need to trigger re-runs
useEffect(() => {
  loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [userId]); // ✅ Explained why loadData is excluded
```

### ❌ Bad Practices

```javascript
// Including unstable function references causes infinite loops
useEffect(() => {
  loadData();
}, [userId, loadData]); // ❌ loadData changes every render

// Missing dependencies
useEffect(() => {
  console.log(userData.name);
}, []); // ❌ userData.name should be in dependencies
```

## useCallback and useMemo

### When to Use useCallback

1. **Functions passed to child components**
```javascript
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

return <ChildComponent onClick={handleClick} />;
```

2. **Functions used in useEffect dependencies**
```javascript
const fetchData = useCallback(async () => {
  const data = await api.get(url);
  setData(data);
}, [url]);

useEffect(() => {
  fetchData();
}, [fetchData]); // ✅ fetchData is stable
```

3. **Functions returned from custom hooks**
```javascript
export function useCustomHook(userId) {
  const doSomething = useCallback(async (param) => {
    // implementation
  }, [userId]);
  
  return { doSomething };
}
```

### When to Use useMemo

1. **Expensive computations**
```javascript
const filteredData = useMemo(() => {
  return data.filter(item => item.category === category);
}, [data, category]);
```

2. **Objects/arrays passed to child components**
```javascript
const options = useMemo(() => ({
  enabled: true,
  timeout: 5000
}), []); // ✅ Options object is stable

return <Component options={options} />;
```

## Custom Hooks

### ✅ Good Custom Hook Pattern

```javascript
export function useData(userId) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Memoize callback functions
  const loadData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const result = await fetchData(userId);
      setData(result);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);
  
  // Only re-run effect when userId changes
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // loadData is excluded to prevent loops
  
  // Return memoized functions
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);
  
  return { data, isLoading, refresh };
}
```

### ❌ Bad Custom Hook Pattern

```javascript
export function useData(userId) {
  const [data, setData] = useState([]);
  
  // ❌ Not memoized - creates new function every render
  const loadData = async () => {
    const result = await fetchData(userId);
    setData(result);
  };
  
  // ❌ Will cause infinite loop
  useEffect(() => {
    loadData();
  }, [userId, loadData]);
  
  // ❌ Not memoized - creates new function every render
  return { data, refresh: () => loadData() };
}
```

## Common Pitfalls

### 1. Recursive Function Calls

❌ **NEVER do this:**
```javascript
const log = (...args) => {
  if (isDev) log(...args); // ❌ Calls itself!
};
```

✅ **Do this instead:**
```javascript
const log = (...args) => {
  if (isDev) console.log(...args); // ✅ Calls console.log
};
```

### 2. State Updates in Render

❌ **NEVER update state during render:**
```javascript
function Component() {
  const [count, setCount] = useState(0);
  setCount(count + 1); // ❌ Infinite loop!
  return <div>{count}</div>;
}
```

✅ **Update state in useEffect or event handlers:**
```javascript
function Component() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    setCount(c => c + 1); // ✅ In useEffect
  }, []); // Run once on mount
  
  return <div>{count}</div>;
}
```

### 3. Object/Array in Dependencies

❌ **Creating new objects/arrays in dependencies:**
```javascript
useEffect(() => {
  fetchData(options);
}, [{ enabled: true }]); // ❌ New object every render
```

✅ **Use useMemo or extract primitives:**
```javascript
const options = useMemo(() => ({ enabled: true }), []);
useEffect(() => {
  fetchData(options);
}, [options]); // ✅ options is stable
```

### 4. Missing Cleanup in useEffect

❌ **Not cleaning up subscriptions:**
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    doSomething();
  }, 1000);
  // ❌ Interval keeps running after unmount
}, []);
```

✅ **Return cleanup function:**
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    doSomething();
  }, 1000);
  
  return () => clearInterval(interval); // ✅ Cleanup
}, []);
```

## Debugging Infinite Loops

### 1. Check useEffect Dependencies

Add logging to see what's changing:
```javascript
useEffect(() => {
  console.log('Effect running', { userId, data });
  // Your code here
}, [userId, data]);
```

### 2. Use React DevTools Profiler

- Look for components that render many times
- Check what props/state are changing

### 3. Add Stack Trace Limits

For debugging only:
```javascript
if (process.env.NODE_ENV === 'development') {
  Error.stackTraceLimit = 50; // Increase stack trace limit
}
```

### 4. Isolate the Problem

Comment out code to narrow down the issue:
```javascript
useEffect(() => {
  // loadData(); // Temporarily commented
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [userId]);
```

### 5. Check for Circular Dependencies

Look for patterns like:
- A calls B, B calls A
- Component updates state, which triggers re-render, which updates state again

## Quick Reference

### useEffect Patterns

```javascript
// Run once on mount
useEffect(() => {
  setup();
}, []);

// Run when value changes
useEffect(() => {
  fetch(url);
}, [url]);

// Run with cleanup
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);

// Exclude unstable dependencies with explanation
useEffect(() => {
  callback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [stableValue]); // callback excluded to prevent loops
```

### useCallback Patterns

```javascript
// Memoize with dependencies
const handleClick = useCallback(() => {
  doSomething(id, name);
}, [id, name]);

// Memoize with no dependencies
const handleClose = useCallback(() => {
  setOpen(false);
}, []);

// Memoize with other memoized functions
const save = useCallback(async () => {
  await validate();
  await persist();
}, [validate, persist]);
```

### Custom Hook Template

```javascript
export function useCustomHook(param) {
  const [state, setState] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  
  // Memoize internal functions
  const internalFunc = useCallback(async () => {
    // implementation
  }, [param]);
  
  // Effects with minimal dependencies
  useEffect(() => {
    internalFunc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [param]);
  
  // Memoize returned functions
  const publicFunc = useCallback(() => {
    // implementation
  }, [internalFunc]);
  
  return {
    state,
    isLoading,
    publicFunc
  };
}
```

## Resources

- [React Hooks Documentation](https://reactjs.org/docs/hooks-reference.html)
- [When to useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)
- [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html)
- [Fixing the Can't Perform State Update Warning](https://kentcdodds.com/blog/fix-the-slow-render-before-you-fix-the-re-render)
