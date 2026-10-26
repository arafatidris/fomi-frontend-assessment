'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createGeneration, fetchJob } from '@/lib/api/create';
import { isAbort } from '@/lib/api/client';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useToast } from '@/components/ui/Toast';
import { DEFAULT_MODEL } from '@/data/create/models';

/**
 * Two contexts on purpose: typing in the composer must not re-render the
 * feed, and polling a render's progress must not re-render the composer.
 */
const ComposerContext = createContext(null);
const WorkspaceContext = createContext(null);

export const DEFAULT_COMPOSER = {
  mode: 'image',
  prompt: '',
  count: 4,
  imageAspectRatio: '1:1',
  videoAspectRatio: '16:9',
  imageModel: DEFAULT_MODEL.image,
  videoModel: DEFAULT_MODEL.video,
  duration: 5,
  styleId: null,
  negativePrompt: '',
  guidance: 7,
  seed: null,
  quality: 'standard',
  motion: 'medium',
};

const POLL_MS = 550;
const FRESH_MS = 4000;
let tempCounter = 0;

function buildRequest(composer) {
  const isVideo = composer.mode === 'video';
  return {
    type: composer.mode,
    prompt: composer.prompt.trim(),
    count: isVideo ? 1 : composer.count,
    aspectRatio: isVideo ? composer.videoAspectRatio : composer.imageAspectRatio,
    modelId: isVideo ? composer.videoModel : composer.imageModel,
    styleId: composer.styleId,
    duration: composer.duration,
    negativePrompt: composer.negativePrompt || undefined,
    guidance: composer.guidance,
    seed: composer.seed ?? undefined,
    quality: composer.quality,
    motion: isVideo ? composer.motion : undefined,
  };
}

export function CreateProvider({ children }) {
  const { toast } = useToast();
  const [composer, setComposer] = usePersistentState('fomi.composer', DEFAULT_COMPOSER, { version: 2 });
  const [created, setCreated] = usePersistentState('fomi.created', [], { version: 2 });
  const [favorites, setFavorites] = usePersistentState('fomi.favorites', [], { version: 1 });
  const [hidden, setHidden] = usePersistentState('fomi.hidden', [], { version: 1 });
  const [lightbox, setLightbox] = useState(null);
  // Desktop panel and mobile dock each render a prompt field (CSS shows one);
  // focus always goes to whichever is visible.
  const promptFields = useRef(new Set());
  const registerPromptField = useCallback((field) => {
    promptFields.current.add(field);
    return () => promptFields.current.delete(field);
  }, []);
  const focusPrompt = useCallback(() => {
    const field = [...promptFields.current].find((element) => element.offsetParent !== null);
    if (!field) return;
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
  }, []);
  // Actions read the latest list through a ref so their identity stays stable
  // while polling updates `created`; memoized feed items then skip re-renders.
  const createdRef = useRef(created);
  useEffect(() => {
    createdRef.current = created;
  }, [created]);

  const updateComposer = useCallback((patch) => setComposer((current) => ({ ...current, ...patch })), [setComposer]);

  const submit = useCallback(
    async (requestBody, existingId) => {
      const id = existingId ?? `pending-${Date.now()}-${(tempCounter += 1)}`;
      const placeholder = {
        id,
        type: requestBody.type,
        prompt: requestBody.prompt,
        modelId: requestBody.modelId,
        aspectRatio: requestBody.aspectRatio,
        styleId: requestBody.styleId,
        count: requestBody.count,
        status: 'pending',
        progress: 0,
        createdAt: Date.now(),
        request: requestBody,
        outputs: [],
      };
      setCreated((current) => [placeholder, ...current.filter((item) => item.id !== id)]);

      try {
        const job = await createGeneration(requestBody);
        setCreated((current) => current.map((item) => (item.id === id ? { ...item, jobId: job.id, etaMs: job.etaMs } : item)));
      } catch (error) {
        setCreated((current) =>
          current.map((item) => (item.id === id ? { ...item, status: 'failed', error: error.message } : item)),
        );
        toast({ tone: 'error', title: 'Couldn’t start that render', description: error.message });
      }
    },
    [setCreated, toast],
  );

  const generate = useCallback(() => {
    const prompt = composer.prompt.trim();
    if (prompt.length < 3) {
      focusPrompt();
      toast({ tone: 'error', title: 'Describe your idea first', description: 'A few words is enough to start.' });
      return false;
    }
    submit(buildRequest(composer));
    return true;
  }, [composer, submit, toast, focusPrompt]);

  // One polling loop for every in-flight job; it reschedules itself whenever
  // results land. Jobs are stateless server-side, so this survives reloads.
  useEffect(() => {
    const inFlight = created.filter((item) => item.status === 'pending' && item.jobId);
    if (!inFlight.length) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const results = await Promise.allSettled(inFlight.map((item) => fetchJob(item.jobId, { signal: controller.signal })));
      if (controller.signal.aborted) return;
      setCreated((current) =>
        current.map((item) => {
          const index = inFlight.findIndex((pending) => pending.id === item.id);
          if (index < 0) return item;
          const result = results[index];
          if (result.status === 'rejected') {
            return isAbort(result.reason) ? item : { ...item, status: 'failed', error: result.reason.message };
          }
          const job = result.value;
          if (job.status === 'succeeded') {
            return {
              ...job.generation,
              id: item.id,
              status: 'succeeded',
              progress: 1,
              request: item.request,
              createdAt: item.createdAt,
              fresh: true,
            };
          }
          if (job.status === 'failed') return { ...item, status: 'failed', progress: job.progress, error: job.error.message };
          return { ...item, progress: Math.max(item.progress, job.progress), etaMs: job.etaMs };
        }),
      );
    }, POLL_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [created, setCreated]);

  // Renders that just landed "develop" in the feed; clear the flag once played.
  useEffect(() => {
    if (!created.some((item) => item.fresh)) return;
    const timer = setTimeout(
      () => setCreated((current) => current.map((item) => (item.fresh ? { ...item, fresh: false } : item))),
      FRESH_MS,
    );
    return () => clearTimeout(timer);
  }, [created, setCreated]);

  const retry = useCallback(
    (id) => {
      const item = createdRef.current.find((entry) => entry.id === id);
      if (item?.request) submit(item.request, id);
    },
    [submit],
  );

  const removeGeneration = useCallback(
    (generation) => {
      const isOwn = createdRef.current.some((item) => item.id === generation.id);
      if (isOwn) setCreated((current) => current.filter((item) => item.id !== generation.id));
      else setHidden((current) => [...current, generation.id]);
      setLightbox(null);
      toast({
        title: 'Generation deleted',
        action: {
          label: 'Undo',
          onClick: () =>
            isOwn
              ? setCreated((current) => [generation, ...current].sort((a, b) => b.createdAt - a.createdAt))
              : setHidden((current) => current.filter((id) => id !== generation.id)),
        },
      });
    },
    [setCreated, setHidden, toast],
  );

  const toggleFavorite = useCallback(
    (outputId) => {
      setFavorites((current) =>
        current.includes(outputId) ? current.filter((id) => id !== outputId) : [...current, outputId],
      );
    },
    [setFavorites],
  );

  const reuse = useCallback(
    (generation) => {
      const isVideo = generation.type === 'video';
      setComposer((current) => ({
        ...current,
        mode: generation.type,
        prompt: generation.prompt,
        styleId: generation.styleId ?? null,
        ...(isVideo
          ? { videoAspectRatio: generation.aspectRatio, videoModel: generation.modelId }
          : { imageAspectRatio: generation.aspectRatio, imageModel: generation.modelId, count: generation.outputs.length || current.count }),
      }));
      setLightbox(null);
      requestAnimationFrame(focusPrompt);
      toast({ tone: 'success', title: 'Prompt and settings loaded', description: 'Tweak it, then generate.' });
    },
    [setComposer, toast, focusPrompt],
  );

  const resetDemo = useCallback(() => {
    setComposer(DEFAULT_COMPOSER);
    setCreated([]);
    setFavorites([]);
    setHidden([]);
    toast({ tone: 'success', title: 'Demo data reset' });
  }, [setComposer, setCreated, setFavorites, setHidden, toast]);

  const openLightbox = useCallback((generation, index = 0) => setLightbox({ generation, index }), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const composerValue = useMemo(
    () => ({ composer, updateComposer, generate, registerPromptField, focusPrompt }),
    [composer, updateComposer, generate, registerPromptField, focusPrompt],
  );

  const workspaceValue = useMemo(
    () => ({
      created,
      favorites,
      hidden,
      lightbox,
      openLightbox,
      closeLightbox,
      retry,
      removeGeneration,
      toggleFavorite,
      reuse,
      resetDemo,
    }),
    [created, favorites, hidden, lightbox, openLightbox, closeLightbox, retry, removeGeneration, toggleFavorite, reuse, resetDemo],
  );

  return (
    <ComposerContext.Provider value={composerValue}>
      <WorkspaceContext.Provider value={workspaceValue}>{children}</WorkspaceContext.Provider>
    </ComposerContext.Provider>
  );
}

export function useComposer() {
  const context = useContext(ComposerContext);
  if (!context) throw new Error('useComposer must be used inside <CreateProvider>.');
  return context;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used inside <CreateProvider>.');
  return context;
}
