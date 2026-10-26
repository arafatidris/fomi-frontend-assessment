'use client';

import { memo } from 'react';
import Image from 'next/image';
import { Check, Columns2, Flag, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useStudio, useStudioActions } from './StudioProvider';

/**
 * A single take. Subscribes to its own slice of state only, so rating one
 * take re-renders that card and nothing else. Click or ↵ opens the viewer;
 * P / X / F act on whichever take has focus.
 */
export const TakeCard = memo(function TakeCard({ takeId, aspect, sizes, tabIndex, compareLetter, priority = false }) {
  const take = useStudio((state) => state.takes[takeId]);
  const isFinal = useStudio((state) => state.shots[state.takes[takeId].shotId].finalTakeId === takeId);
  const actions = useStudioActions();
  const rejected = take.rating === 'reject';
  const picked = take.rating === 'pick';

  return (
    <div
      className={cn(
        'group/take relative isolate overflow-hidden rounded-lg bg-surface-2 ring-1 ring-line transition-[box-shadow,transform] duration-200',
        'focus-within:ring-2 focus-within:ring-accent has-[:focus-visible]:shadow-[0_0_0_5px_color-mix(in_oklab,var(--c-accent)_18%,transparent)]',
        isFinal && 'ring-2 ring-success',
        compareLetter && !isFinal && 'ring-2 ring-ink',
        take.fresh && 'animate-develop',
      )}
      style={{ aspectRatio: aspect }}
    >
      <button
        type="button"
        data-take-id={takeId}
        tabIndex={tabIndex}
        onClick={() => actions.openViewer(takeId)}
        onFocus={() => actions.focusTake(takeId)}
        aria-label={`Take ${take.label}${take.variant ? `, ${take.variant}` : ''}${picked ? ', picked' : ''}${rejected ? ', rejected' : ''}${isFinal ? ', final' : ''}`}
        className="absolute inset-0 outline-none"
      >
        <Image
          src={take.media.src}
          alt={take.variant ?? `Take ${take.label}`}
          fill
          sizes={sizes}
          quality={75}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          placeholder="blur"
          blurDataURL={take.media.blurDataURL}
          className={cn(
            'object-cover transition-[filter,opacity,transform] duration-500 ease-out group-hover/take:scale-[1.02]',
            rejected && 'opacity-35 saturate-0',
          )}
        />
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/30 opacity-0 transition-opacity duration-300 group-focus-within/take:opacity-100 group-hover/take:opacity-100" />
      </button>

      {/* Slate */}
      <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 font-mono text-xs font-medium tabular text-white/90 backdrop-blur-md">
        {take.label}
      </span>

      <span className="pointer-events-none absolute right-2 top-2 flex items-center gap-1">
        {compareLetter && (
          <span className="flex size-5 items-center justify-center rounded-md bg-white font-mono text-xs font-semibold text-black">{compareLetter}</span>
        )}
        {isFinal ? (
          <span className="flex items-center gap-1 rounded-md bg-success px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#06281a]">
            <Check aria-hidden className="size-3" strokeWidth={3} /> Final
          </span>
        ) : picked ? (
          <span className="flex size-6 items-center justify-center rounded-md bg-accent-solid text-on-accent shadow-card">
            <Flag aria-hidden className="size-3.5 fill-current" />
          </span>
        ) : rejected ? (
          <span className="flex size-6 items-center justify-center rounded-md bg-black/60 text-white/80">
            <X aria-hidden className="size-3.5" strokeWidth={2.5} />
          </span>
        ) : null}
      </span>

      {take.variant && (
        <span className="pointer-events-none absolute inset-x-2 bottom-2 line-clamp-2 rounded-md bg-black/55 px-2 py-1 text-xs leading-snug text-white/90 backdrop-blur-md transition-opacity duration-200 group-hover/take:opacity-0">
          {take.variant}
        </span>
      )}

      <div className="absolute inset-x-2 bottom-2 flex items-center justify-end gap-1 opacity-0 transition-opacity duration-200 group-focus-within/take:opacity-100 group-hover/take:opacity-100">
        <QuickAction label="Pick" shortcut="P" active={picked} onClick={() => actions.rate(takeId, 'pick')}>
          <Flag aria-hidden className={cn('size-3.5', picked && 'fill-current')} />
        </QuickAction>
        <QuickAction label="Reject" shortcut="X" active={rejected} onClick={() => actions.rate(takeId, 'reject')}>
          <X aria-hidden className="size-3.5" />
        </QuickAction>
        <QuickAction label="Compare" shortcut="C" active={Boolean(compareLetter)} onClick={() => actions.toggleCompare(takeId)}>
          <Columns2 aria-hidden className="size-3.5" />
        </QuickAction>
        <QuickAction label={isFinal ? 'Clear final' : 'Set as final'} shortcut="F" active={isFinal} tone="final" onClick={() => actions.setFinal(take.shotId, takeId)}>
          <Check aria-hidden className="size-3.5" strokeWidth={2.5} />
        </QuickAction>
      </div>
    </div>
  );
});

function QuickAction({ label, shortcut, active, tone, onClick, children }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onClick}
      aria-label={`${label} (${shortcut})`}
      title={`${label} · ${shortcut}`}
      aria-pressed={active}
      className={cn(
        'flex size-7 items-center justify-center rounded-md bg-black/60 text-white/90 backdrop-blur-md transition-[background-color,transform] duration-150 hover:bg-black/80 active:scale-90',
        active && (tone === 'final' ? 'bg-success text-[#06281a] hover:bg-success' : 'bg-accent-solid text-on-accent hover:bg-accent-solid'),
      )}
    >
      {children}
    </button>
  );
}
