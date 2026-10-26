'use client';

import { memo } from 'react';
import Image from 'next/image';
import { CalendarClock, Check, Plus } from 'lucide-react';
import { Disclosure } from '@/components/ui/Disclosure';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils/cn';
import { shotSummary } from './studio-state';
import { useStudio, useStudioActions, useStudioList } from './StudioProvider';

/**
 * The shot list: the project's deliverables, not a chronological feed. A
 * returning creator sees at a glance what's final, what needs review and
 * what hasn't started.
 */
export function ShotRail({ onNavigate, inOverlay = false }) {
  const project = useStudio((state) => state.project);
  const shotOrder = useStudio((state) => state.shotOrder);
  const finals = useStudioList((state) => state.shotOrder.filter((id) => state.shots[id].finalTakeId));
  const { toast } = useToast();
  const progress = finals.length / shotOrder.length;

  return (
    <nav aria-label="Shot list" className="flex h-full flex-col">
      <div className={cn('border-b border-line px-4 pb-4 pt-4', inOverlay && 'pr-14')}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Shot list</h2>
          <span className="font-mono text-xs text-ink-2">
            {finals.length}/{shotOrder.length} final
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Shots with a final take"
          aria-valuemin={0}
          aria-valuemax={shotOrder.length}
          aria-valuenow={finals.length}
          className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2"
        >
          <div className="h-full rounded-full bg-success transition-[width] duration-700 ease-out" style={{ width: `${progress * 100}%` }} />
        </div>
        <Disclosure
          title="Brief"
          className="mt-3"
          buttonClassName="h-8 justify-between rounded-lg bg-surface-2 px-3 text-xs shadow-none hover:bg-panel-2"
        >
          <div className="space-y-2 px-1 pt-2.5 text-xs leading-relaxed text-ink-2">
            <p>{project.brief}</p>
            <p className="flex items-center gap-1.5 text-ink-3">
              <CalendarClock aria-hidden className="size-3.5" />
              Due in {project.dueInDays} days
            </p>
          </div>
        </Disclosure>
      </div>

      <ol className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-2">
        {shotOrder.map((shotId, index) => (
          <ShotRow key={shotId} shotId={shotId} index={index} onNavigate={onNavigate} />
        ))}
      </ol>

      <div className="border-t border-line p-2">
        <button
          type="button"
          onClick={() => toast({ title: 'New shots come from the brief', description: 'Adding shots is out of scope for this demo.' })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <Plus aria-hidden className="size-4" />
          Add shot
        </button>
      </div>
    </nav>
  );
}

const ShotRow = memo(function ShotRow({ shotId, index, onNavigate }) {
  const actions = useStudioActions();
  const shot = useStudio((state) => state.shots[shotId]);
  const active = useStudio((state) => state.activeShotId === shotId);
  const busy = useStudio((state) => Boolean(state.jobs[shotId]));
  const [status, , unrated] = useStudioList((state) => {
    const summary = shotSummary(state, shotId);
    return [summary.status, summary.picks, summary.unrated];
  });
  // Thumbnail: the final, else the most recent pick, else the latest take.
  const cover = useStudio((state) => {
    if (shot.finalTakeId) return state.takes[shot.finalTakeId]?.media ?? null;
    const ids = [...shot.roundIds].reverse().flatMap((roundId) => state.rounds[roundId].takeIds);
    const pick = ids.find((id) => state.takes[id].rating === 'pick');
    return state.takes[pick ?? ids[0]]?.media ?? null;
  });

  return (
    <li>
      <button
        type="button"
        aria-current={active ? 'true' : undefined}
        onClick={() => {
          actions.selectShot(shotId);
          onNavigate?.();
        }}
        className={cn(
          'relative flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors duration-150',
          active ? 'bg-surface-2' : 'hover:bg-surface-2/60',
        )}
      >
        {active && <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent" />}
        <span
          className={cn(
            'relative h-10 w-14 shrink-0 overflow-hidden rounded-md',
            cover ? 'bg-surface-2 ring-1 ring-line' : 'border border-dashed border-line-strong',
          )}
        >
          {cover && (
            <Image src={cover.src} alt="" fill sizes="56px" quality={60} placeholder="blur" blurDataURL={cover.blurDataURL} className="object-cover" />
          )}
          {status === 'final' && (
            <span className="absolute bottom-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-success text-[#06281a]">
              <Check aria-hidden className="size-2.5" strokeWidth={3.5} />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-1.5">
            <span className="font-mono text-xs text-ink-3">{String(index + 1).padStart(2, '0')}</span>
            <span className={cn('truncate text-[13px]', active ? 'font-semibold text-ink' : 'font-medium text-ink')}>{shot.title}</span>
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-3">
            <span className="truncate">{shot.use}</span>
            <span aria-hidden>·</span>
            <span className="font-mono">{shot.aspectRatio}</span>
          </span>
        </span>
        <span className="shrink-0">
          {busy ? (
            <span className="flex size-2 animate-pulse rounded-full bg-accent" aria-label="Rendering" />
          ) : status === 'final' ? (
            <span className="sr-only">Final chosen</span>
          ) : status === 'todo' ? (
            <span className="text-xs text-ink-3">New</span>
          ) : unrated ? (
            <span className="rounded-full bg-accent-soft px-1.5 py-0.5 font-mono text-[11px] font-semibold text-accent-ink" aria-label={`${unrated} to review`}>
              {unrated}
            </span>
          ) : null}
        </span>
      </button>
    </li>
  );
});
