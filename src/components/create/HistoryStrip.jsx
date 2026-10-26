'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, CircleAlert, Play } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils/cn';
import { truncate } from '@/lib/utils/format';
import { useCatalog } from './CatalogContext';
import { useWorkspace } from './CreateProvider';
import { ProgressRing } from './ProgressRing';

/**
 * The floating history card from the design: a "View all" entry point and a
 * horizontally scrolling strip of recent generations. Keyboard users get one
 * tab stop and arrow keys between thumbnails (toolbar pattern).
 */
export function HistoryStrip({ onViewAll }) {
  const { history } = useCatalog();
  const { created, hidden, openLightbox } = useWorkspace();
  const scrollerRef = useRef(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });

  const items = useMemo(() => {
    const own = created.filter((item) => item.status !== 'failed');
    return [...own, ...history].filter((item) => !hidden.includes(item.id));
  }, [created, history, hidden]);

  const updateEdges = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    setEdges({
      start: scroller.scrollLeft < 4,
      end: scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateEdges();
    const scroller = scrollerRef.current;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [updateEdges, items.length]);

  const scrollByPage = (direction) => {
    const scroller = scrollerRef.current;
    scroller.scrollBy({ left: direction * scroller.clientWidth * 0.8, behavior: 'smooth' });
  };

  const onKeyDown = (event) => {
    const keys = { ArrowRight: focusIndex + 1, ArrowLeft: focusIndex - 1, Home: 0, End: items.length - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const next = Math.min(items.length - 1, Math.max(0, keys[event.key]));
    setFocusIndex(next);
    scrollerRef.current.querySelectorAll('button')[next]?.focus();
  };

  const open = useCallback(
    (generation) => {
      if (generation.status !== 'pending') openLightbox(generation, 0);
    },
    [openLightbox],
  );

  return (
    <section
      aria-label="History"
      className="relative flex items-center gap-2 rounded-2xl bg-surface p-1.5 shadow-float ring-1 ring-line sm:p-2"
    >
      <button
        type="button"
        onClick={onViewAll}
        className="flex h-[3.25rem] w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-xl border border-line text-ink transition-[background-color,border-color,transform] duration-150 hover:border-line-strong hover:bg-surface-2 active:scale-95 lg:h-[4.5rem] lg:w-[4.75rem]"
      >
        <span className="text-[13px] font-semibold leading-tight">History</span>
        <span className="text-[11px] leading-tight text-ink-3">View all</span>
      </button>

      <span aria-hidden className="h-10 w-px shrink-0 bg-line lg:h-14" />

      <div className="relative min-w-0 flex-1">
        <div
          ref={scrollerRef}
          role="toolbar"
          aria-label="Recent generations"
          onKeyDown={onKeyDown}
          onScroll={updateEdges}
          className={cn(
            'flex gap-2 overflow-x-auto scroll-smooth py-0.5 scrollbar-none lg:gap-2.5',
            !edges.end && 'mask-fade-r [--fade:56px]',
          )}
        >
          {items.map((generation, index) => (
            <HistoryThumb
              key={generation.id}
              generation={generation}
              index={index}
              tabIndex={index === focusIndex ? 0 : -1}
              onFocusIndex={setFocusIndex}
              onOpen={open}
            />
          ))}
        </div>

        {!edges.start && (
          <ScrollButton direction="left" onClick={() => scrollByPage(-1)} />
        )}
        {!edges.end && <ScrollButton direction="right" onClick={() => scrollByPage(1)} />}
      </div>
    </section>
  );
}

function ScrollButton({ direction, onClick }) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden
      onClick={onClick}
      className={cn(
        'absolute top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-ink shadow-pop ring-1 ring-line transition-transform duration-150 hover:scale-105 active:scale-95 lg:flex',
        direction === 'left' ? '-left-1' : '-right-1',
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

const HistoryThumb = memo(function HistoryThumb({ generation, index, tabIndex, onFocusIndex, onOpen }) {
  const output = generation.outputs[0];
  const pending = generation.status === 'pending';
  const label = pending ? `Rendering: ${truncate(generation.prompt, 60)}` : `Open: ${truncate(generation.prompt, 80)}`;

  return (
    <Tooltip content={truncate(generation.prompt, 70)} side="bottom" delay={600}>
      <button
        type="button"
        tabIndex={tabIndex}
        onFocus={() => onFocusIndex(index)}
        onClick={() => onOpen(generation)}
        aria-label={label}
        aria-busy={pending || undefined}
        className={cn(
          'relative size-[3.25rem] shrink-0 overflow-hidden rounded-lg bg-panel-2 transition-[transform,box-shadow] duration-200 ease-out lg:size-[4.5rem]',
          'hover:-translate-y-0.5 hover:shadow-float focus-visible:outline-offset-1 active:scale-95',
          generation.status && 'animate-pop-in',
        )}
      >
        {pending ? (
          <span className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(110deg,var(--c-panel-2)_35%,var(--c-panel)_50%,var(--c-panel-2)_65%)] bg-size-[220%_100%] animate-shimmer">
            <ProgressRing value={generation.progress} size={30} />
          </span>
        ) : output ? (
          <>
            <Image
              src={output.poster ?? output.src}
              alt=""
              fill
              sizes="72px"
              quality={60}
              placeholder="blur"
              blurDataURL={output.blurDataURL}
              className="object-cover"
            />
            {generation.type === 'video' && (
              <span className="absolute bottom-1 right-1 flex size-4 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
                <Play aria-hidden className="size-2.5 fill-current" />
              </span>
            )}
          </>
        ) : (
          <CircleAlert aria-hidden className="m-auto size-5 text-danger" />
        )}
      </button>
    </Tooltip>
  );
});
