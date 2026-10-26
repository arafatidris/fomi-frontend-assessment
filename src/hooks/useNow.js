'use client';

import { useEffect, useState } from 'react';

/**
 * The current time, refreshed every `interval` ms. Null until mounted so the
 * server-rendered HTML never depends on the clock (and hydration stays exact).
 */
export function useNow(interval = 30_000) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, interval);
    return () => clearInterval(timer);
  }, [interval]);
  return now;
}
