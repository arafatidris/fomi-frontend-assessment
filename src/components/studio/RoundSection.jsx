'use client';

import { memo } from 'react';
import { Compass, Lock, MessageSquareText, Sparkles } from 'lucide-react';
import { getFieldLabel } from '@/data/studio/direction';
import { Tooltip } from '@/components/ui/Tooltip';
import { formatAge, formatRelativeTime } from '@/lib/utils/format';
import { useNow } from '@/hooks/useNow';
import { cn } from '@/lib/utils/cn';
import { useStudio, useStudioList } from './StudioProvider';
import { TakeCard } from './TakeCard';

const KIND = {
  generate: { icon: Sparkles, title: () => 'New takes' },
  explore: { icon: Compass, title: (round) => `Explored ${getFieldLabel(round.axis).toLowerCase()}` },
  direct: { icon: MessageSquareText, title: () => 'Directed' },
};

/** Columns follow the frame: wide shots get room to be judged, portraits pack tighter. */
export function gridFor(aspect) {
  if (aspect >= 2) return { min: '22rem', sizes: '(min-width: 1280px) 50vw, 100vw' };
  if (aspect >= 1.3) return { min: '17rem', sizes: '(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw' };
  if (aspect >= 0.95) return { min: '13rem', sizes: '(min-width: 1280px) 20vw, (min-width: 640px) 30vw, 50vw' };
  return { min: '10.5rem', sizes: '(min-width: 1280px) 15vw, (min-width: 640px) 24vw, 50vw' };
}

const isVisible = (take, filter, hideRejects) =>
  !(hideRejects && take.rating === 'reject') &&
  (filter !== 'picks' || take.rating === 'pick') &&
  (filter !== 'unrated' || !take.rating);

export const RoundSection = memo(function RoundSection({ roundId, aspect, focusId, compare, priority = false }) {
  const round = useStudio((state) => state.rounds[roundId]);
  const visible = useStudioList((state) =>
    state.rounds[roundId].takeIds.filter((id) => isVisible(state.takes[id], state.filter, state.hideRejects)),
  );
  const now = useNow(60_000);
  const kind = KIND[round.kind] ?? KIND.generate;
  const Icon = kind.icon;
  const grid = gridFor(aspect);
  const when = round.createdAt ? (now ? formatRelativeTime(round.createdAt, now) : 'Just now') : formatAge(round.minutesAgo ?? 0);

  if (!visible.length) return null;

  return (
    <section aria-labelledby={`${roundId}-title`} className="animate-fade-up">
      <header className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="rounded-md border border-line-strong px-1.5 py-0.5 font-mono text-xs font-medium text-ink-2">
          R{String(round.number).padStart(2, '0')}
        </span>
        <h2 id={`${roundId}-title`} className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Icon aria-hidden className="size-4 text-accent-ink" />
          {kind.title(round)}
          {round.instruction && <span className="font-normal text-ink-2">“{round.instruction}”</span>}
        </h2>
        {round.kind === 'explore' && (
          <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-2">
            <Lock aria-hidden className="size-3" />
            Everything else locked · same seed
          </span>
        )}
        <span className="ml-auto text-xs text-ink-3">{when}</span>
      </header>

      {round.changes?.length > 0 && (
        <ul aria-label="What changed from the previous direction" className="mb-3 flex flex-wrap gap-1.5">
          {round.changes.map((change) => (
            <li key={change.field} className="min-w-0 max-w-full">
              <Tooltip content={`${getFieldLabel(change.field)}: was “${change.from}”`}>
                <span tabIndex={0} className="inline-flex max-w-full items-center gap-1.5 sm:max-w-[28rem] rounded-full border border-line bg-surface px-2.5 py-1 text-xs outline-offset-2">
                  <span className="font-semibold text-ink-2">{getFieldLabel(change.field)}</span>
                  <span aria-hidden className="text-success">→</span>
                  <span className="truncate text-ink">{change.to}</span>
                </span>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}

      <ul className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${grid.min}), 1fr))` }}>
        {visible.map((takeId, index) => (
          <li key={takeId}>
            <TakeCard
              priority={priority && index < 2}
              takeId={takeId}
              aspect={aspect}
              sizes={grid.sizes}
              tabIndex={takeId === focusId ? 0 : -1}
              compareLetter={compare.indexOf(takeId) >= 0 ? 'AB'[compare.indexOf(takeId)] : null}
            />
          </li>
        ))}
      </ul>
    </section>
  );
});

/** Placeholder round while a render is in flight: same grid, developing tiles. */
export function PendingRound({ job, aspect }) {
  const grid = gridFor(aspect);
  return (
    <section aria-live="polite" aria-busy="true" className="animate-fade-up">
      <header className="mb-3 flex items-center gap-3">
        <span className="rounded-md border border-accent/50 px-1.5 py-0.5 font-mono text-xs font-medium text-accent-ink">
          R{String(job.roundNumber).padStart(2, '0')}
        </span>
        <h2 className="text-sm font-semibold">{job.label}</h2>
        <span className="font-mono text-xs tabular text-ink-2">{Math.round(job.progress * 100)}%</span>
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
          <span className="block h-full rounded-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${Math.max(4, job.progress * 100)}%` }} />
        </span>
      </header>
      <ul className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${grid.min}), 1fr))` }}>
        {Array.from({ length: job.count }, (_, index) => (
          <li key={index}>
            <div className={cn('relative overflow-hidden rounded-lg bg-surface-2 ring-1 ring-line')} style={{ aspectRatio: aspect }}>
              <div
                aria-hidden
                className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent_30%,rgb(255_255_255/0.06)_50%,transparent_70%)] bg-size-[220%_100%]"
                style={{ animationDelay: `${index * 140}ms` }}
              />
              <div
                aria-hidden
                className="absolute inset-0 opacity-50 blur-2xl [background:radial-gradient(circle_at_30%_30%,rgb(242_135_109/0.35),transparent_55%),radial-gradient(circle_at_70%_75%,rgb(110_140_200/0.25),transparent_55%)]"
                style={{ transform: `scale(${1 + job.progress * 0.5})`, transition: 'transform 600ms ease-out' }}
              />
              <span className="absolute left-2 top-2 rounded-md bg-black/50 px-1.5 py-0.5 font-mono text-xs text-white/70">
                {job.roundNumber}.{index + 1}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
