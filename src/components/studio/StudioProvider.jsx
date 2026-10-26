'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createStore } from '@/lib/store';
import { isAbort } from '@/lib/api/client';
import { fetchRoundJob, proposeDirection, startRound, suggestVariants } from '@/lib/api/studio';
import { useToast } from '@/components/ui/Toast';
import { getFieldLabel } from '@/data/studio/direction';
import { buildInitialState, persistable, PERSIST_KEY, PERSIST_VERSION, studioReducer } from './studio-state';

const StudioContext = createContext(null);
const POLL_MS = 500;
const FRESH_MS = 4000;

function shallowEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every((value, index) => Object.is(value, b[index]));
}

export function StudioProvider({ project, children }) {
  const { toast } = useToast();
  const [store] = useState(() =>
    createStore(studioReducer, buildInitialState(project), {
      persistKey: PERSIST_KEY,
      version: PERSIST_VERSION,
      persist: persistable,
    }),
  );

  const actions = useMemo(() => {
    const dispatch = store.dispatch;
    const get = store.getState;

    // Guards against double submission before the job is registered.
    const starting = new Set();

    const render = async (shotId, request, label) => {
      if (starting.has(shotId) || get().jobs[shotId]) return;
      starting.add(shotId);
      const shot = get().shots[shotId];
      const roundNumber = shot.roundIds.length + 1;
      try {
        const job = await startRound({
          shotId,
          roundNumber,
          basedOnTakeId: shot.basedOnTakeId,
          count: 4,
          ...request,
        });
        dispatch({
          type: 'jobStarted',
          shotId,
          job: { id: job.id, progress: 0, kind: request.kind, axis: request.axis ?? null, count: request.variants?.length ?? 4, roundNumber, label },
        });
      } catch (error) {
        toast({ tone: 'error', title: 'Couldn’t start the render', description: error.message });
      } finally {
        starting.delete(shotId);
      }
    };

    return {
      selectShot: (shotId) => dispatch({ type: 'selectShot', shotId }),
      rate: (takeId, rating) => dispatch({ type: 'rate', takeId, rating }),
      setFinal: (shotId, takeId) => {
        const wasFinal = get().shots[shotId].finalTakeId === takeId;
        dispatch({ type: 'setFinal', shotId, takeId });
        const take = get().takes[takeId];
        toast(
          wasFinal
            ? { title: 'Final cleared' }
            : { tone: 'success', title: `Take ${take.label} is the final`, description: `${get().shots[shotId].title} is ready for export.` },
        );
      },
      setField: (shotId, field, value) => dispatch({ type: 'setField', shotId, field, value }),
      toggleLock: (shotId, field) => dispatch({ type: 'toggleLock', shotId, field }),
      branch: (takeId) => {
        dispatch({ type: 'branch', takeId });
        toast({ title: `Direction set from take ${get().takes[takeId].label}`, description: 'Your next round builds on it.' });
      },
      setFilter: (filter) => dispatch({ type: 'setFilter', filter }),
      toggleHideRejects: () => dispatch({ type: 'toggleHideRejects' }),
      togglePanel: (panel, open) => dispatch({ type: 'togglePanel', panel, open }),
      setPanels: (panels) => dispatch({ type: 'setPanels', panels }),
      focusTake: (takeId) => dispatch({ type: 'focusTake', takeId }),
      toggleCompare: (takeId) => dispatch({ type: 'toggleCompare', takeId }),
      clearCompare: () => dispatch({ type: 'clearCompare' }),
      openViewer: (takeId, compareId) => dispatch({ type: 'openViewer', takeId, compareId }),
      viewerShow: (takeId) => dispatch({ type: 'viewerShow', takeId }),
      viewerCompare: (compareId) => dispatch({ type: 'viewerCompare', compareId }),
      closeViewer: () => dispatch({ type: 'closeViewer' }),
      reset: () => {
        dispatch({ type: 'reset', initial: store.getInitialState() });
        toast({ tone: 'success', title: 'Demo project reset' });
      },

      generate: (shotId) => {
        if (get().jobs[shotId]) return;
        render(shotId, { kind: 'generate', direction: get().shots[shotId].direction }, 'New takes');
      },
      explore: (shotId, axis, variants) => {
        if (get().jobs[shotId]) return;
        render(shotId, { kind: 'explore', axis, variants, direction: get().shots[shotId].direction }, `Exploring ${getFieldLabel(axis).toLowerCase()}`);
      },
      suggest: (shotId, axis) => suggestVariants({ shotId, axis, direction: get().shots[shotId].direction }),

      /** Asks the direction model what an instruction would change: a reviewable diff, not a render. */
      direct: async (shotId, instruction) => {
        const shot = get().shots[shotId];
        dispatch({ type: 'proposalLoading', shotId, instruction });
        try {
          const proposal = await proposeDirection({ instruction, direction: shot.direction, locks: shot.locks });
          dispatch({ type: 'proposalReady', proposal });
        } catch (error) {
          dispatch({ type: 'proposalCleared' });
          toast({ tone: 'error', title: 'Couldn’t read that direction', description: error.message });
        }
      },
      applyProposal: () => {
        const { proposal } = get();
        if (proposal?.status !== 'ready' || !proposal.changes.length) return;
        const shot = get().shots[proposal.shotId];
        const direction = { ...shot.direction };
        for (const change of proposal.changes) direction[change.field] = change.to;
        dispatch({ type: 'proposalCleared' });
        render(proposal.shotId, { kind: 'direct', direction, instruction: proposal.instruction, changes: proposal.changes }, 'Directed');
      },
      discardProposal: () => dispatch({ type: 'proposalCleared' }),
    };
  }, [store, toast]);

  // One polling loop for all in-flight rounds.
  const jobs = useSyncExternalStore(store.subscribe, () => store.getState().jobs, () => store.getInitialState().jobs);
  useEffect(() => {
    const entries = Object.entries(jobs);
    if (!entries.length) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      await Promise.all(
        entries.map(async ([shotId, job]) => {
          try {
            const result = await fetchRoundJob(job.id, { signal: controller.signal });
            if (result.status === 'succeeded') {
              store.dispatch({ type: 'roundAdded', shotId, round: result.round });
              const ids = result.round.takes.map((take) => take.id);
              setTimeout(() => store.dispatch({ type: 'settleFresh', takeIds: ids }), FRESH_MS);
              const shot = store.getState().shots[shotId];
              toast({ tone: 'success', title: `Round ${result.round.number} is ready`, description: `${result.round.takes.length} new takes in ${shot.title}` });
            } else {
              store.dispatch({ type: 'jobProgress', shotId, progress: result.progress });
            }
          } catch (error) {
            if (isAbort(error)) return;
            store.dispatch({ type: 'jobFailed', shotId });
            toast({ tone: 'error', title: 'The render failed', description: error.message });
          }
        }),
      );
    }, POLL_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [jobs, store, toast]);

  const value = useMemo(() => ({ store, actions }), [store, actions]);
  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

function useStudioContext() {
  const context = useContext(StudioContext);
  if (!context) throw new Error('Studio hooks must be used inside <StudioProvider>.');
  return context;
}

/** Subscribes to one slice of Studio state; re-renders only when it changes. */
export function useStudio(selector) {
  const { store } = useStudioContext();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getInitialState()),
  );
}

/** Like useStudio, for selectors that build arrays: equal contents keep the same reference. */
export function useStudioList(selector) {
  const { store } = useStudioContext();
  const cache = useRef({ server: undefined, client: undefined });
  const read = (state, slot) => {
    const next = selector(state);
    if (shallowEqual(cache.current[slot], next)) return cache.current[slot];
    cache.current[slot] = next;
    return next;
  };
  return useSyncExternalStore(
    store.subscribe,
    () => read(store.getState(), 'client'),
    () => read(store.getInitialState(), 'server'),
  );
}

export function useStudioActions() {
  return useStudioContext().actions;
}

/** Direct store access for event handlers that need the latest state without subscribing. */
export function useStudioStore() {
  return useStudioContext().store;
}
