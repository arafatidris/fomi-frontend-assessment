'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useGenerationFeed } from '@/hooks/useGenerationFeed';
import { useWorkspace } from './CreateProvider';
import { GenerationItem } from './GenerationItem';
import { EmptyState } from './EmptyState';

const TITLES = { all: 'All generations', image: 'Image generations', video: 'Video generations' };

export function GenerationFeed({ type, initialPage }) {
  const { toast } = useToast();
  const { created, hidden, favorites, openLightbox, retry, removeGeneration, reuse, toggleFavorite } = useWorkspace();
  const feed = useGenerationFeed(type, initialPage);
  const sentinelRef = useRef(null);

  const items = useMemo(() => {
    const own = created.filter((item) => type === 'all' || item.type === type);
    const hiddenIds = new Set(hidden);
    return [...own, ...feed.items].filter((item) => !hiddenIds.has(item.id));
  }, [created, feed.items, hidden, type]);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const copyPrompt = useCallback(
    async (prompt) => {
      try {
        await navigator.clipboard.writeText(prompt);
        toast({ tone: 'success', title: 'Prompt copied' });
      } catch {
        toast({ tone: 'error', title: 'Couldn’t access the clipboard' });
      }
    },
    [toast],
  );

  // Infinite scroll: start loading well before the user reaches the end.
  const { hasMore, status, loadMore } = feed;
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || status === 'error') return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && loadMore(), { rootMargin: '800px 0px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, status, loadMore]);

  if (!items.length && !feed.hasMore) return <EmptyState type={type} />;

  return (
    <section aria-labelledby="feed-title">
      <h1 id="feed-title" className="sr-only">
        {TITLES[type]}
      </h1>
      <ol className="flex flex-col gap-5 lg:gap-6">
        {items.map((generation, index) => (
          <GenerationItem
            key={generation.id}
            generation={generation}
            eager={index === 0}
            favorites={favoriteSet}
            onOpen={openLightbox}
            onRetry={retry}
            onRemove={removeGeneration}
            onReuse={reuse}
            onCopy={copyPrompt}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </ol>

      <div ref={sentinelRef} aria-live="polite" className="py-8">
        {feed.status === 'loading' && <FeedSkeleton />}
        {feed.status === 'error' && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-ink-2">Couldn’t load older generations.</p>
            <Button size="sm" icon={RotateCcw} onClick={feed.loadMore}>
              Try again
            </Button>
          </div>
        )}
        {!feed.hasMore && items.length > 2 && (
          <p className="flex items-center justify-center gap-3 text-xs text-ink-2">
            <span aria-hidden className="h-px w-10 bg-line-strong" />
            You’re all caught up
            <span aria-hidden className="h-px w-10 bg-line-strong" />
          </p>
        )}
      </div>
    </section>
  );
}

function FeedSkeleton() {
  return (
    <div aria-label="Loading older generations" role="status" className="grid gap-3 xl:grid-cols-[14.5rem_minmax(0,1fr)]">
      <div className="h-36 animate-pulse rounded-2xl bg-panel" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="aspect-[3/4] animate-pulse rounded-xl bg-panel-2" style={{ animationDelay: `${index * 90}ms` }} />
        ))}
      </div>
    </div>
  );
}
