/**
 * A ~40-line reducer store for client state that many components read.
 * Components subscribe to *slices* through useSyncExternalStore, so a change
 * to one take re-renders that take, not the whole workspace (the problem a
 * single React context would have).
 *
 * Created per mount (never at module scope) so server renders never share
 * state between requests. Optional persistence hydrates after mount, which
 * keeps the server HTML and the first client render identical.
 */
export function createStore(reducer, initialState, { persistKey, version = 1, persist } = {}) {
  let state = initialState;
  let hydrated = false;
  const listeners = new Set();

  const hydrate = () => {
    if (hydrated || !persistKey) return;
    hydrated = true;
    try {
      const stored = JSON.parse(localStorage.getItem(persistKey) ?? 'null');
      if (stored?.v === version) state = reducer(state, { type: 'hydrate', saved: stored.data });
    } catch {
      // Corrupt or unavailable storage: start from the seed state.
    }
  };

  const save = () => {
    if (!persistKey) return;
    try {
      localStorage.setItem(persistKey, JSON.stringify({ v: version, data: persist ? persist(state) : state }));
    } catch {
      // Storage full or blocked: keep working in memory.
    }
  };

  return {
    getState: () => state,
    getInitialState: () => initialState,
    dispatch(action) {
      const next = reducer(state, action);
      if (next === state) return;
      state = next;
      save();
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      hydrate();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
