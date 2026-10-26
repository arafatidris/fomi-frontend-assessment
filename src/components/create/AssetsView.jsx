'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Heart, Search } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { getAspectRatio } from '@/lib/media/aspect-ratios';
import { useCatalog } from './CatalogContext';
import { useWorkspace } from './CreateProvider';
import { MediaTile } from './MediaTile';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'saved', label: 'Saved' },
];

/** Every output as one library: filterable, searchable, favorites one tap away. */
export function AssetsView() {
  const { history } = useCatalog();
  const { created, hidden, favorites, openLightbox, toggleFavorite } = useWorkspace();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const assets = useMemo(() => {
    const words = deferredQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return [...created.filter((item) => item.status === 'succeeded'), ...history]
      .filter((generation) => !hidden.includes(generation.id))
      .filter((generation) => filter === 'all' || filter === 'saved' || generation.type === filter)
      .filter((generation) => words.every((word) => generation.prompt.toLowerCase().includes(word)))
      .flatMap((generation) =>
        generation.outputs.map((output, index) => ({ generation, output, index })),
      )
      .filter(({ output }) => filter !== 'saved' || favoriteSet.has(output.id));
  }, [created, history, hidden, filter, deferredQuery, favoriteSet]);

  return (
    <section aria-labelledby="assets-title">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 id="assets-title" className="text-xl font-semibold">
            Assets
          </h1>
          <p className="text-[13px] text-ink-2">{assets.length} items</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by prompt…"
            aria-label="Search assets by prompt"
            className="h-9 w-full rounded-full border border-line bg-surface pl-9 pr-3 text-[13px] outline-none transition-colors placeholder:text-ink-3 focus:border-line-strong"
          />
        </div>
        <SegmentedControl label="Filter assets" options={FILTERS} value={filter} onChange={setFilter} className="w-full sm:w-80" />
      </div>

      {assets.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-line-strong px-6 py-20 text-center">
          <Heart aria-hidden className="mb-3 size-6 text-ink-3" />
          <p className="font-semibold">{filter === 'saved' ? 'Nothing saved yet' : 'No matches'}</p>
          <p className="mt-1 max-w-xs text-sm text-ink-2">
            {filter === 'saved'
              ? 'Tap the heart on any image or video to keep it here.'
              : 'Try a different word, or clear the search.'}
          </p>
        </div>
      ) : (
        <ul className="columns-2 gap-3 sm:columns-3 xl:columns-4 2xl:columns-5">
          {assets.map(({ generation, output, index }) => (
            <li key={output.id} className="mb-3 break-inside-avoid">
              <MediaTile
                generation={generation}
                output={output}
                index={index}
                aspect={getAspectRatio(generation.aspectRatio).value}
                sizes="(min-width: 1536px) 16vw, (min-width: 1280px) 19vw, (min-width: 640px) 30vw, 48vw"
                favorite={favoriteSet.has(output.id)}
                onOpen={openLightbox}
                onToggleFavorite={toggleFavorite}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
