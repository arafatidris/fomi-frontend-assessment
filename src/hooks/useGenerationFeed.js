'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchGenerations } from '@/lib/api/create';
import { isAbort } from '@/lib/api/client';

/**
 * Cursor-paginated feed seeded with the server-rendered first page, so the
 * first paint needs no client fetch. status: 'idle' | 'loading' | 'error'.
 */
export function useGenerationFeed(type, initialPage) {
  const [state, setState] = useState({ items: initialPage.items, nextCursor: initialPage.nextCursor });
  const [status, setStatus] = useState('idle');
  const controllerRef = useRef(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !state.nextCursor) return;
    loadingRef.current = true;
    setStatus('loading');
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const page = await fetchGenerations({ type, cursor: state.nextCursor, signal: controller.signal });
      setState((current) => ({ items: [...current.items, ...page.items], nextCursor: page.nextCursor }));
      setStatus('idle');
    } catch (error) {
      if (!isAbort(error)) setStatus('error');
    } finally {
      loadingRef.current = false;
    }
  }, [type, state.nextCursor]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return { items: state.items, hasMore: Boolean(state.nextCursor), status, loadMore };
}
