'use client';

import { useRef } from 'react';
import { Columns2, Eye, EyeOff, PanelLeft, PanelRight, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Kbd } from '@/components/ui/Kbd';
import { useHotkeys, useModKey } from '@/hooks/useHotkeys';
import { getAspectRatio } from '@/lib/media/aspect-ratios';
import { cn } from '@/lib/utils/cn';
import { shotSummary, visibleTakeIds } from './studio-state';
import { useStudio, useStudioActions, useStudioList, useStudioStore } from './StudioProvider';
import { PendingRound, RoundSection } from './RoundSection';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'picks', label: 'Picks' },
  { value: 'unrated', label: 'To review' },
];

/** Moves focus to the take visually next to the focused one. */
function moveFocus(container, direction) {
  const items = [...container.querySelectorAll('[data-take-id]')];
  if (!items.length) return;
  const current = document.activeElement?.closest('[data-take-id]');
  const index = items.indexOf(current);
  if (index < 0) return items[0].focus();
  if (direction === 'left') return items[index - 1]?.focus();
  if (direction === 'right') return items[index + 1]?.focus();

  const rect = current.getBoundingClientRect();
  const center = rect.left + rect.width / 2;
  const candidates = items
    .map((element) => ({ element, rect: element.getBoundingClientRect() }))
    .filter(({ rect: other }) => (direction === 'down' ? other.top >= rect.bottom - 2 : other.bottom <= rect.top + 2));
  candidates.sort((a, b) => {
    const rowA = direction === 'down' ? a.rect.top : -a.rect.bottom;
    const rowB = direction === 'down' ? b.rect.top : -b.rect.bottom;
    if (Math.abs(rowA - rowB) > 4) return rowA - rowB;
    return Math.abs(a.rect.left + a.rect.width / 2 - center) - Math.abs(b.rect.left + b.rect.width / 2 - center);
  });
  candidates[0]?.element.focus();
}

export function Stage({ onOpenDirection }) {
  const containerRef = useRef(null);
  const store = useStudioStore();
  const actions = useStudioActions();
  const mod = useModKey();
  const shotId = useStudio((state) => state.activeShotId);
  const shot = useStudio((state) => state.shots[state.activeShotId]);
  const job = useStudio((state) => state.jobs[state.activeShotId]);
  const filter = useStudio((state) => state.filter);
  const hideRejects = useStudio((state) => state.hideRejects);
  const panels = useStudio((state) => state.panels);
  const compare = useStudio((state) => state.compare);
  const focusedTakeId = useStudio((state) => state.focusedTakeId);
  const visible = useStudioList((state) => visibleTakeIds(state, state.activeShotId));
  const [status, picks, unrated] = useStudioList((state) => {
    const summary = shotSummary(state, state.activeShotId);
    return [summary.status, summary.picks, summary.unrated];
  });

  const aspect = getAspectRatio(shot.aspectRatio).value;
  const focusId = visible.includes(focusedTakeId) ? focusedTakeId : visible[0];
  const rounds = [...shot.roundIds].reverse();
  const empty = !rounds.length && !job;

  // Shortcuts act on the focused take, wherever DOM focus is.
  const onTake = (handler) => () => {
    const id = store.getState().focusedTakeId;
    if (id && store.getState().takes[id]) handler(id);
  };
  useHotkeys({
    p: onTake((id) => actions.rate(id, 'pick')),
    x: onTake((id) => actions.rate(id, 'reject')),
    f: onTake((id) => actions.setFinal(store.getState().takes[id].shotId, id)),
    b: onTake((id) => actions.branch(id)),
    c: onTake((id) => actions.toggleCompare(id)),
    h: () => actions.toggleHideRejects(),
  });

  const onKeyDown = (event) => {
    const direction = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[event.key];
    if (!direction || !event.target.closest?.('[data-take-id]')) return;
    event.preventDefault();
    moveFocus(containerRef.current, direction);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line px-4 py-3 md:px-6">
        <div className="mr-auto flex min-w-0 items-center gap-3">
          <IconButton
            label={panels.rail ? 'Hide shot list' : 'Show shot list'}
            icon={PanelLeft}
            onClick={() => actions.togglePanel('rail')}
            className="hidden xl:inline-flex"
            active={!panels.rail}
          />
          <div className="min-w-0">
            <h1 className="flex items-baseline gap-2 truncate text-lg font-semibold tracking-tight">
              <span className="font-mono text-sm font-medium text-ink-3">{String(store.getState().shotOrder.indexOf(shotId) + 1).padStart(2, '0')}</span>
              {shot.title}
            </h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-2">
              <span>{shot.use}</span>
              <span aria-hidden>·</span>
              <span className="font-mono">{shot.aspectRatio}</span>
              <span aria-hidden>·</span>
              <span className="font-mono">{shot.deliverable}</span>
              <StatusPill status={status} picks={picks} unrated={unrated} />
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!empty && (
            <>
              <SegmentedControl label="Filter takes" options={FILTERS} value={filter} onChange={actions.setFilter} className="w-60" />
              <IconButton
                label={hideRejects ? 'Show rejected takes' : 'Hide rejected takes'}
                icon={hideRejects ? EyeOff : Eye}
                shortcut="H"
                onClick={actions.toggleHideRejects}
                active={hideRejects}
              />
            </>
          )}
          <IconButton
            label={panels.direction ? 'Hide direction panel' : 'Show direction panel'}
            icon={PanelRight}
            onClick={() => actions.togglePanel('direction')}
            className="hidden lg:inline-flex"
            active={!panels.direction}
          />
        </div>
      </header>

      <div
        ref={containerRef}
        onKeyDown={onKeyDown}
        className="min-h-0 flex-1 space-y-9 overflow-y-auto overscroll-contain px-4 pb-32 pt-5 md:px-6 lg:pb-10 xl:pb-20"
      >
        {job && <PendingRound job={job} aspect={aspect} />}
        {empty ? (
          <EmptyShot shot={shot} onRender={() => actions.generate(shotId)} onOpenDirection={onOpenDirection} mod={mod} />
        ) : (
          <>
            {rounds.map((roundId, index) => (
              <RoundSection key={roundId} roundId={roundId} aspect={aspect} focusId={focusId} compare={compare} priority={index === 0 && !job} />
            ))}
            {!visible.length && !job && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <p className="text-sm text-ink-2">No takes match this filter.</p>
                <Button size="sm" onClick={() => actions.setFilter('all')}>
                  Show all takes
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {compare.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center px-4 lg:bottom-14">
          <div className="pointer-events-auto flex animate-pop-in items-center gap-2 rounded-full border border-line-strong bg-surface-2/95 py-1.5 pl-4 pr-1.5 shadow-pop backdrop-blur-xl">
            <span className="text-[13px] text-ink-2">
              {compare.length === 1 ? 'Select one more take to compare' : 'Ready to compare'}
              <span className="ml-2 font-mono text-ink">
                {compare.map((id, index) => `${'AB'[index]} ${store.getState().takes[id]?.label}`).join('  ·  ')}
              </span>
            </span>
            <Button
              size="sm"
              variant="primary"
              icon={Columns2}
              disabled={compare.length < 2}
              onClick={() => actions.openViewer(compare[0], compare[1])}
            >
              Compare
            </Button>
            <IconButton label="Clear comparison" icon={X} onClick={actions.clearCompare} />
          </div>
        </div>
      )}

      <ShortcutHints mod={mod} />
    </div>
  );
}

function StatusPill({ status, picks, unrated }) {
  if (status === 'final')
    return <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">Final chosen</span>;
  if (status === 'todo')
    return <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-2">Not started</span>;
  return (
    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-ink">
      {unrated ? `${unrated} to review` : `${picks} picks · choose a final`}
    </span>
  );
}

function EmptyShot({ shot, onRender, onOpenDirection, mod }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
      <div
        className="mb-6 flex w-72 max-w-full items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface/50 text-ink-3"
        style={{ aspectRatio: getAspectRatio(shot.aspectRatio).value }}
      >
        <span className="font-mono text-xs">{shot.aspectRatio} · {shot.deliverable}</span>
      </div>
      <h2 className="text-lg font-semibold">Nothing rendered yet</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">
        The direction is pre-filled from the brief. Review it, lock what must not change, then render a first round.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button variant="secondary" className="lg:hidden" onClick={onOpenDirection}>
          Review direction
        </Button>
        <Button variant="primary" icon={Sparkles} onClick={onRender}>
          Render first takes
          <span className="ml-1 hidden font-mono text-xs opacity-70 sm:inline">{mod}↵</span>
        </Button>
      </div>
    </div>
  );
}

function ShortcutHints({ mod }) {
  const hints = [
    ['P', 'Pick'],
    ['X', 'Reject'],
    ['F', 'Final'],
    ['C', 'Compare'],
    ['B', 'Branch'],
    ['↵', 'Open'],
    [`${mod}K`, 'Commands'],
    ['?', 'All shortcuts'],
  ];
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 hidden items-center justify-center gap-4 bg-linear-to-t from-canvas via-canvas/90 to-transparent px-6 pb-3 pt-8 xl:flex',
      )}
    >
      {hints.map(([key, label]) => (
        <span key={label} className="flex items-center gap-1.5 text-xs text-ink-3">
          <Kbd>{key}</Kbd>
          {label}
        </span>
      ))}
    </div>
  );
}
