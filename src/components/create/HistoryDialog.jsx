'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import Image from 'next/image';
import { Play, Search, X } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { IconButton } from '@/components/ui/IconButton';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useNow } from '@/hooks/useNow';
import { dayBucket, truncate } from '@/lib/utils/format';
import { useCatalog } from './CatalogContext';
import { useWorkspace } from './CreateProvider';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
];

/** "View all": every generation, searchable by prompt and grouped by day. */
export function HistoryDialog({ open, onClose }) {
  const { history } = useCatalog();
  const { created, hidden, openLightbox } = useWorkspace();
  const now = useNow(60_000);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const deferredQuery = useDeferredValue(query);

  const groups = useMemo(() => {
    const words = deferredQuery.toLowerCase().split(/\s+/).filter(Boolean);
    const items = [...created.filter((item) => item.status === 'succeeded'), ...history].filter(
      (item) =>
        !hidden.includes(item.id) &&
        (filter === 'all' || item.type === filter) &&
        words.every((word) => item.prompt.toLowerCase().includes(word)),
    );
    const reference = now ?? 0;
    const buckets = new Map();
    for (const item of items) {
      const timestamp = item.createdAt ?? reference - (item.ageMinutes ?? 0) * 60_000;
      const label = now ? dayBucket(timestamp, reference) : 'All';
      if (!buckets.has(label)) buckets.set(label, []);
      buckets.get(label).push(item);
    }
    return [...buckets.entries()];
  }, [created, history, hidden, filter, deferredQuery, now]);

  const total = groups.reduce((sum, [, items]) => sum + items.length, 0);

  return (
    <Dialog open={open} onClose={onClose} labelledBy="history-title" variant="sheet" className="[--dialog-width:72rem]">
      <div className="flex max-h-[88dvh] flex-col sm:max-h-[min(100dvh-2rem,52rem)]">
        <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="mr-auto">
            <h2 id="history-title" className="text-lg font-semibold">
              History
            </h2>
            <p className="text-xs text-ink-2">{total} generations</p>
          </div>
          <div className="relative order-3 w-full sm:order-none sm:w-64">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search prompts…"
              aria-label="Search prompts"
              className="h-9 w-full rounded-full border border-line bg-surface-2 pl-9 pr-3 text-[13px] outline-none transition-colors placeholder:text-ink-3 focus:border-line-strong"
            />
          </div>
          <SegmentedControl label="Filter by type" options={FILTERS} value={filter} onChange={setFilter} className="w-56" />
          <IconButton label="Close history" icon={X} onClick={onClose} />
        </header>

        <div className="overflow-y-auto px-5 pb-6 sm:px-6">
          {total === 0 ? (
            <p className="py-20 text-center text-sm text-ink-2">
              {query ? `Nothing matches “${query}”.` : 'No generations here yet.'}
            </p>
          ) : (
            groups.map(([label, items]) => (
              <section key={label} aria-labelledby={`history-${label}`} className="pt-5">
                <h3 id={`history-${label}`} className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-2">
                  {label}
                </h3>
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {items.map((item) => {
                    const output = item.outputs[0];
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => openLightbox(item, 0)}
                          aria-label={`Open: ${truncate(item.prompt, 80)}`}
                          className="group relative block aspect-square w-full overflow-hidden rounded-xl bg-panel-2 transition-transform duration-200 active:scale-95"
                        >
                          <Image
                            src={output.poster ?? output.src}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 9rem, (min-width: 640px) 25vw, 33vw"
                            quality={60}
                            placeholder="blur"
                            blurDataURL={output.blurDataURL}
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {item.outputs.length > 1 && (
                            <span className="absolute right-1.5 top-1.5 rounded-full bg-black/55 px-1.5 text-[10px] font-semibold text-white backdrop-blur">
                              {item.outputs.length}
                            </span>
                          )}
                          {item.type === 'video' && (
                            <Play aria-hidden className="absolute bottom-1.5 left-1.5 size-3.5 fill-white text-white drop-shadow" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </Dialog>
  );
}
