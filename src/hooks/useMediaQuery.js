'use client';

import { useCallback, useSyncExternalStore } from 'react';

/** Subscribes to a media query. Returns `fallback` during SSR and hydration. */
export function useMediaQuery(query, fallback = false) {
  const subscribe = useCallback(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}
