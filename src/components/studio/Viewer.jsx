'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Check, ChevronLeft, ChevronRight, Columns2, Download, Flag, GitBranch, X } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { IconButton } from '@/components/ui/IconButton';
import { Kbd } from '@/components/ui/Kbd';
import { DIRECTION_FIELDS, getFieldLabel } from '@/data/studio/direction';
import { cn } from '@/lib/utils/cn';
import { CompareSlider } from '@/components/create/CompareSlider';
import { visibleTakeIds } from './studio-state';
import { useStudio, useStudioActions, useStudioList, useStudioStore } from './StudioProvider';

function TakeImage({ take, priority }) {
  return (
    <Image
      src={take.media.src}
      alt={take.variant ?? `Take ${take.label}`}
      fill
      sizes="(min-width: 1024px) calc(100vw - 24rem), 100vw"
      quality={90}
      placeholder="blur"
      blurDataURL={take.media.blurDataURL}
      loading={priority ? 'eager' : 'lazy'}
      draggable={false}
      className="select-none object-contain"
    />
  );
}

/**
 * Full-screen review. ←/→ move through the shot's takes, P/X/F/B act on the
 * current one, C compares it with the other selected take. On touch: swipe
 * to move, big thumb-reachable buttons to judge.
 */
export function Viewer() {
  const store = useStudioStore();
  const actions = useStudioActions();
  const viewer = useStudio((state) => state.viewer);
  const take = useStudio((state) => (state.viewer ? state.takes[state.viewer.takeId] : null));
  const other = useStudio((state) => (state.viewer?.compareId ? state.takes[state.viewer.compareId] : null));
  const shot = useStudio((state) => (take ? state.shots[take.shotId] : null));
  const round = useStudio((state) => (take ? state.rounds[take.roundId] : null));
  const order = useStudioList((state) => (state.viewer ? visibleTakeIds(state, state.takes[state.viewer.takeId].shotId) : []));
  const compareCandidate = useStudio((state) => {
    if (!take) return null;
    const selected = state.compare.find((id) => id !== take.id);
    if (selected) return selected;
    const final = state.shots[take.shotId].finalTakeId;
    return final && final !== take.id ? final : null;
  });
  const swipe = useRef(null);

  const list = order.includes(take?.id) ? order : take ? [take.id, ...order] : [];
  const index = take ? list.indexOf(take.id) : -1;
  const go = (step) => list.length > 1 && actions.viewerShow(list[(index + step + list.length) % list.length]);
  const isFinal = shot?.finalTakeId === take?.id;

  const onKeyDown = (event) => {
    if (!take || event.metaKey || event.ctrlKey) return;
    const key = event.key.toLowerCase();
    const handlers = {
      arrowright: () => go(1),
      arrowleft: () => go(-1),
      p: () => actions.rate(take.id, 'pick'),
      x: () => actions.rate(take.id, 'reject'),
      f: () => actions.setFinal(take.shotId, take.id),
      b: () => actions.branch(take.id),
      c: () => actions.viewerCompare(other ? null : compareCandidate),
    };
    if (!handlers[key]) return;
    event.preventDefault();
    handlers[key]();
  };

  const differs = (field) => take && shot && take.direction[field] !== shot.direction[field];

  return (
    <Dialog
      open={Boolean(viewer)}
      onClose={actions.closeViewer}
      label="Take viewer"
      variant="fullscreen"
      onKeyDown={onKeyDown}
      className="bg-[#070708]"
    >
      {take && shot && (
        <div className="flex h-full flex-col lg:flex-row">
          <div
            className="relative flex min-h-0 min-w-0 flex-1 flex-col"
            onPointerDown={(event) => {
              if (event.pointerType !== 'mouse') swipe.current = event.clientX;
            }}
            onPointerUp={(event) => {
              const start = swipe.current;
              swipe.current = null;
              if (start !== null && Math.abs(event.clientX - start) > 48 && !other) go(event.clientX < start ? 1 : -1);
            }}
          >
            <div className="flex items-center gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <span className="rounded-md bg-white/10 px-2 py-1 font-mono text-xs font-medium tabular text-white">
                TAKE {take.label}
              </span>
              <span className="hidden font-mono text-xs text-white/55 sm:inline">
                R{String(round.number).padStart(2, '0')} · SEED {take.seed} · {shot.aspectRatio}
              </span>
              <span className="truncate text-[13px] text-white/70">{shot.title}</span>
              <span className="ml-auto font-mono text-xs tabular text-white/55">
                {index + 1}/{list.length}
              </span>
              <IconButton
                label={other ? 'Exit compare' : 'Compare'}
                shortcut="C"
                icon={Columns2}
                variant="overlay"
                active={Boolean(other)}
                disabled={!other && !compareCandidate}
                onClick={() => actions.viewerCompare(other ? null : compareCandidate)}
              />
              <IconButton label="Close viewer" shortcut="Esc" icon={X} variant="overlay" autoFocus onClick={actions.closeViewer} />
            </div>

            <div className="relative min-h-0 flex-1 px-3 pb-3 lg:px-14">
              <div key={other ? `${take.id}-${other.id}` : take.id} className="relative size-full animate-fade-in">
                {other ? (
                  <CompareSlider
                    label={`Compare take ${take.label} with ${other.label}`}
                    before={<TakeImage take={take} priority />}
                    after={<TakeImage take={other} priority />}
                  />
                ) : (
                  <TakeImage take={take} priority />
                )}
              </div>
              {!other && list.length > 1 && (
                <>
                  <StepButton direction="left" onClick={() => go(-1)} />
                  <StepButton direction="right" onClick={() => go(1)} />
                </>
              )}
              {other && (
                <p className="pointer-events-none absolute inset-x-0 bottom-5 text-center font-mono text-xs text-white/70">
                  {take.label} ←  drag  → {other.label}
                </p>
              )}
            </div>

            <ul aria-label="Takes in this shot" className="hidden gap-1.5 overflow-x-auto px-4 pb-4 scrollbar-none sm:flex sm:justify-center-safe">
              {list.map((id) => (
                <FilmstripItem key={id} takeId={id} current={id === take.id} />
              ))}
            </ul>
          </div>

          <aside className="flex max-h-[48dvh] shrink-0 flex-col overflow-y-auto border-t border-white/10 bg-[#0e0e10] lg:max-h-none lg:w-[24rem] lg:border-l lg:border-t-0">
            <div className="grid grid-cols-3 gap-2 p-4">
              <Judge label="Pick" shortcut="P" icon={Flag} active={take.rating === 'pick'} onClick={() => actions.rate(take.id, 'pick')} />
              <Judge label="Reject" shortcut="X" icon={X} active={take.rating === 'reject'} tone="muted" onClick={() => actions.rate(take.id, 'reject')} />
              <Judge label={isFinal ? 'Final' : 'Set final'} shortcut="F" icon={Check} active={isFinal} tone="final" onClick={() => actions.setFinal(take.shotId, take.id)} />
            </div>

            <div className="flex-1 space-y-5 px-4 pb-4">
              {other ? (
                <section aria-labelledby="viewer-diff">
                  <h2 id="viewer-diff" className="mb-2 font-mono text-xs uppercase tracking-wider text-white/55">
                    {take.label} vs {other.label}
                  </h2>
                  <DirectionDiff a={take} b={other} />
                </section>
              ) : (
                <section aria-labelledby="viewer-direction">
                  <h2 id="viewer-direction" className="mb-2 font-mono text-xs uppercase tracking-wider text-white/55">
                    Direction of this take
                  </h2>
                  <dl className="space-y-2.5">
                    {DIRECTION_FIELDS.map((field) => (
                      <div key={field.key}>
                        <dt className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-white/50">
                          {field.label}
                          {differs(field.key) && <span className="normal-case tracking-normal text-accent-ink">· differs from current</span>}
                        </dt>
                        <dd className={cn('mt-0.5 text-[13px] leading-snug', differs(field.key) ? 'text-white' : 'text-white/75')}>
                          {take.direction[field.key]}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}
            </div>

            <div className="space-y-2 border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => actions.branch(take.id)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/8 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-white/14"
              >
                <GitBranch aria-hidden className="size-4" />
                Branch direction from this take
                <Kbd className="border-white/20 bg-white/10 text-white/80 shadow-none">B</Kbd>
              </button>
              <a
                href={take.media.src}
                download
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[13px] text-white/70 transition-colors hover:text-white"
              >
                <Download aria-hidden className="size-4" />
                Download {store.getState().shots[take.shotId].deliverable}
              </a>
            </div>
          </aside>
        </div>
      )}
    </Dialog>
  );
}

function DirectionDiff({ a, b }) {
  const changed = DIRECTION_FIELDS.filter((field) => a.direction[field.key] !== b.direction[field.key]);
  if (!changed.length) {
    return <p className="text-[13px] text-white/70">Same direction, different seed: the difference is pure variation.</p>;
  }
  return (
    <dl className="space-y-3">
      {changed.map((field) => (
        <div key={field.key}>
          <dt className="font-mono text-[11px] uppercase tracking-wider text-white/50">{getFieldLabel(field.key)}</dt>
          <dd className="mt-1 space-y-1 text-[13px] leading-snug">
            <p>
              <span className="mr-1.5 font-mono text-xs text-white/45">{a.label}</span>
              <span className="text-white/85">{a.direction[field.key]}</span>
            </p>
            <p>
              <span className="mr-1.5 font-mono text-xs text-white/45">{b.label}</span>
              <span className="text-white">{b.direction[field.key]}</span>
            </p>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function FilmstripItem({ takeId, current }) {
  const actions = useStudioActions();
  const take = useStudio((state) => state.takes[takeId]);
  const ref = useRef(null);

  // Keep the take being viewed visible in the strip.
  useEffect(() => {
    if (current) ref.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [current]);

  return (
    <li className="shrink-0">
      <button
        ref={ref}
        type="button"
        onClick={() => actions.viewerShow(takeId)}
        aria-label={`Show take ${take.label}`}
        aria-current={current || undefined}
        className={cn(
          'relative block h-12 w-16 overflow-hidden rounded-md opacity-50 ring-2 ring-transparent transition-[opacity,box-shadow] duration-200 hover:opacity-90',
          current && 'opacity-100 ring-white',
          take.rating === 'reject' && 'saturate-0',
        )}
      >
        <Image src={take.media.src} alt="" fill sizes="64px" quality={60} className="object-cover" />
        {take.rating === 'pick' && <span className="absolute right-0.5 top-0.5 size-2 rounded-full bg-accent-solid" />}
      </button>
    </li>
  );
}

function Judge({ label, shortcut, icon: Icon, active, tone, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-xl border border-white/10 py-3 text-[12px] font-semibold text-white/85 transition-[background-color,border-color,transform] duration-150 hover:bg-white/8 active:scale-95',
        active && tone === 'final' && 'border-transparent bg-success text-[#06281a] hover:bg-success',
        active && tone === 'muted' && 'border-transparent bg-white/20 text-white',
        active && !tone && 'border-transparent bg-accent-solid text-on-accent hover:bg-accent-solid',
      )}
    >
      <Icon aria-hidden className={cn('size-5', active && !tone && 'fill-current')} />
      <span className="flex items-center gap-1.5">
        {label}
        <span className="font-mono text-[11px] opacity-60">{shortcut}</span>
      </span>
    </button>
  );
}

function StepButton({ direction, onClick }) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'left' ? 'Previous take' : 'Next take'}
      className={cn(
        'absolute top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-[background-color,transform] hover:bg-white/20 active:scale-90 sm:flex',
        direction === 'left' ? 'left-2' : 'right-2',
      )}
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}
