'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';

/**
 * State persisted to localStorage, modelled as an external store:
 * - the server render and hydration use `initialValue` (no mismatch),
 * - the stored value takes over right after hydration,
 * - other tabs stay in sync through the `storage` event.
 * Storage failures (private mode, quota) degrade to in-memory state.
 */
const cache = new Map();
const listeners = new Map();

function read(key, version, fallback) {
  if (cache.has(key)) return cache.get(key);
  let value = fallback;
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (stored?.v === version) value = stored.data;
  } catch {
    // Unreadable storage: fall back to the initial value.
  }
  cache.set(key, value);
  return value;
}

function notify(key) {
  listeners.get(key)?.forEach((listener) => listener());
}

export function usePersistentState(key, initialValue, { version = 1 } = {}) {
  // Freeze the initial value so the server snapshot is referentially stable.
  const [initial] = useState(initialValue);

  const subscribe = useCallback(
    (onChange) => {
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key).add(onChange);
      const onStorage = (event) => {
        if (event.key !== key) return;
        cache.delete(key);
        onChange();
      };
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.get(key).delete(onChange);
        window.removeEventListener('storage', onStorage);
      };
    },
    [key],
  );

  const value = useSyncExternalStore(
    subscribe,
    () => read(key, version, initial),
    () => initial,
  );

  const setValue = useCallback(
    (next) => {
      const previous = read(key, version, initial);
      const resolved = typeof next === 'function' ? next(previous) : next;
      if (Object.is(resolved, previous)) return;
      cache.set(key, resolved);
      try {
        localStorage.setItem(key, JSON.stringify({ v: version, data: resolved }));
      } catch {
        // Storage full or unavailable: the session still works in memory.
      }
      notify(key);
    },
    [key, version, initial],
  );

  return [value, setValue];
}
