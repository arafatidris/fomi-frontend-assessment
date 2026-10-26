'use client';

import { memo, useEffect, useId, useRef, useState } from 'react';
import { ArrowUp, Check, Compass, Copy, GitBranch, Lock, LockOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Spinner } from '@/components/ui/Spinner';
import { Disclosure } from '@/components/ui/Disclosure';
import { useToast } from '@/components/ui/Toast';
import { useModKey } from '@/hooks/useHotkeys';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { DIRECTION_FIELDS, composePrompt } from '@/data/studio/direction';
import { cn } from '@/lib/utils/cn';
import { useStudio, useStudioActions } from './StudioProvider';
import { ExplorePopover } from './ExplorePopover';

/**
 * The direction: the prompt split into the six things a director reasons
 * about. Lock what works, explore one axis, or describe a change in plain
 * words and review the proposed diff before anything renders.
 */
export function DirectionPanel({ inOverlay = false }) {
  const actions = useStudioActions();
  const mod = useModKey();
  const shotId = useStudio((state) => state.activeShotId);
  const shot = useStudio((state) => state.shots[state.activeShotId]);
  const job = useStudio((state) => state.jobs[state.activeShotId]);
  const proposal = useStudio((state) => (state.proposal?.shotId === state.activeShotId ? state.proposal : null));
  const basedOn = useStudio((state) => (shot.basedOnTakeId ? state.takes[shot.basedOnTakeId] : null));
  const busy = Boolean(job);
  const changeFor = (field) => proposal?.status === 'ready' && proposal.changes.find((change) => change.field === field);

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex items-center justify-between gap-2 border-b border-line px-5 py-3', inOverlay && 'pr-14')}>
        <div>
          <h2 className="text-sm font-semibold">Direction</h2>
          <p className="text-xs text-ink-3">Locked fields never change unless you change them.</p>
        </div>
        {basedOn && (
          <button
            type="button"
            onClick={() => actions.openViewer(basedOn.id)}
            className="flex shrink-0 items-center gap-1 rounded-full border border-line px-2 py-1 font-mono text-xs text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
            title="The take this direction was branched from"
          >
            <GitBranch aria-hidden className="size-3" />
            from {basedOn.label}
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <ul className="space-y-1">
          {DIRECTION_FIELDS.map((field) => (
            <DirectionField
              key={`${shotId}-${field.key}`}
              shotId={shotId}
              field={field}
              value={shot.direction[field.key]}
              locked={Boolean(shot.locks[field.key])}
              change={changeFor(field.key)}
              skipped={proposal?.status === 'ready' && proposal.skipped.some((entry) => entry.field === field.key)}
              disabled={busy}
            />
          ))}
        </ul>

        <Disclosure
          title="Full prompt"
          className="mt-4"
          buttonClassName="h-9 justify-between rounded-lg bg-transparent px-2 text-xs font-medium text-ink-2 shadow-none hover:bg-surface-2"
        >
          <PromptPreview direction={shot.direction} />
        </Disclosure>
      </div>

      <div className="space-y-3 border-t border-line p-4">
        {proposal && <ProposalBar proposal={proposal} mod={mod} busy={busy} />}
        <DirectInput shotId={shotId} disabled={busy || proposal?.status === 'loading'} />
        <Button
          variant="primary"
          size="lg"
          icon={busy ? null : Sparkles}
          loading={busy}
          className="w-full rounded-xl"
          onClick={() => actions.generate(shotId)}
          disabled={busy}
        >
          {busy ? `Rendering ${Math.round(job.progress * 100)}%` : 'Render 4 takes'}
          {!busy && <span className="ml-1 font-mono text-xs opacity-70">{mod}↵</span>}
        </Button>
      </div>
    </div>
  );
}

const DirectionField = memo(function DirectionField({ shotId, field, value, locked, change, skipped, disabled }) {
  const actions = useStudioActions();
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [exploreOpen, setExploreOpen] = useState(false);
  const inputRef = useRef(null);
  const exploreRef = useRef(null);
  const closedAt = useRef(0);
  const wide = useMediaQuery('(min-width: 1024px)');

  useEffect(() => {
    if (!editing) return;
    const input = inputRef.current;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, [editing]);

  const startEditing = () => {
    setDraft(value);
    setEditing(true);
  };

  const commit = () => {
    const next = draft.trim();
    if (next && next !== value) actions.setField(shotId, field.key, next);
    setEditing(false);
  };

  return (
    <li
      className={cn(
        'group/field rounded-xl px-2.5 py-2 transition-colors duration-150 hover:bg-surface-2/70',
        change && 'bg-success-soft/60 hover:bg-success-soft/60',
        editing && 'bg-surface-2',
      )}
    >
      <div className="flex items-center gap-1">
        <span id={`${id}-label`} className="flex-1 font-mono text-xs font-medium uppercase tracking-wider text-ink-3">
          {field.label}
          {skipped && <span className="ml-2 normal-case tracking-normal text-warning">locked, not changed</span>}
        </span>
        <IconButton
          label={locked ? `Unlock ${field.label}` : `Lock ${field.label}`}
          icon={locked ? Lock : LockOpen}
          size="xs"
          active={locked}
          aria-pressed={locked}
          onClick={() => actions.toggleLock(shotId, field.key)}
          className={cn(!locked && 'opacity-60 group-hover/field:opacity-100')}
        />
        <IconButton
          ref={exploreRef}
          label={`Explore ${field.label.toLowerCase()}`}
          icon={Compass}
          size="xs"
          disabled={disabled || locked}
          // Light-dismiss fires on pointerdown; don't immediately reopen on the same click.
          onClick={() => performance.now() - closedAt.current > 250 && setExploreOpen(true)}
          className="opacity-60 group-hover/field:opacity-100"
        />
      </div>

      {editing ? (
        <textarea
          ref={inputRef}
          aria-labelledby={`${id}-label`}
          value={draft}
          rows={2}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              commit();
            } else if (event.key === 'Escape') {
              event.stopPropagation();
              setEditing(false);
            }
          }}
          className="mt-1 w-full resize-none rounded-lg border border-field bg-canvas px-2.5 py-2 text-[13px] leading-snug text-ink outline-none field-sizing-content"
        />
      ) : change ? (
        <div className="mt-1 space-y-1 text-[13px] leading-snug">
          <del className="block text-danger/85 decoration-danger/60">{change.from}</del>
          <ins className="block font-medium text-success no-underline">{change.to}</ins>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEditing}
          // The name must contain the visible text (WCAG 2.5.3, label in name).
          aria-label={`${value}. Edit ${field.label.toLowerCase()}`}
          className="mt-0.5 block w-full rounded-md text-left text-[13px] leading-snug text-ink outline-offset-2 transition-colors hover:text-white"
        >
          {value}
        </button>
      )}

      {exploreOpen && (
        <ExplorePopover
          shotId={shotId}
          field={field}
          anchorRef={exploreRef}
          placement={wide ? 'left-start' : 'bottom-end'}
          onClose={() => {
            closedAt.current = performance.now();
            setExploreOpen(false);
          }}
        />
      )}
    </li>
  );
});

function ProposalBar({ proposal, mod, busy }) {
  const actions = useStudioActions();
  if (proposal.status === 'loading') {
    return (
      <div role="status" className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-[13px] text-ink-2">
        <Spinner className="size-4 text-accent" />
        Reading “{proposal.instruction}”…
      </div>
    );
  }
  const count = proposal.changes.length;
  return (
    <div role="region" aria-label="Proposed direction changes" className="animate-pop-in rounded-xl border border-success/30 bg-success-soft/40 p-3">
      <p className="text-[13px] text-ink">
        {count ? (
          <>
            <strong className="font-semibold">{count === 1 ? '1 field' : `${count} fields`}</strong> would change
          </>
        ) : (
          'Nothing to change: every field it touches is locked.'
        )}
        {proposal.skipped.length > 0 && (
          <span className="text-ink-2"> · {proposal.skipped.map((entry) => entry.label).join(', ')} locked</span>
        )}
      </p>
      <div className="mt-2.5 flex gap-2">
        <Button size="sm" variant="ghost" onClick={actions.discardProposal} className="rounded-lg">
          Discard
        </Button>
        <Button size="sm" variant="primary" icon={Check} disabled={!count || busy} onClick={actions.applyProposal} className="flex-1 rounded-lg">
          Apply &amp; render <span className="font-mono text-xs opacity-70">{mod}↵</span>
        </Button>
      </div>
    </div>
  );
}

function DirectInput({ shotId, disabled }) {
  const actions = useStudioActions();
  const [text, setText] = useState('');
  const id = useId();

  const submit = () => {
    if (text.trim().length < 3 || disabled) return;
    actions.direct(shotId, text.trim());
    setText('');
  };

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        Direct a change in plain words
      </label>
      <textarea
        id={id}
        value={text}
        rows={1}
        disabled={disabled}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
            event.preventDefault();
            submit();
          }
        }}
        placeholder="Direct a change… “colder, more mist”"
        className="field-sizing-content max-h-28 min-h-11 w-full resize-none rounded-xl border border-line-strong bg-surface py-3 pl-3.5 pr-11 text-[13px] leading-snug text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-field disabled:opacity-60"
      />
      <IconButton
        label="Propose changes"
        icon={ArrowUp}
        size="sm"
        variant="accent"
        disabled={disabled || text.trim().length < 3}
        onClick={submit}
        className="absolute bottom-1.5 right-1.5 rounded-lg"
        tooltip={false}
      />
    </div>
  );
}

function PromptPreview({ direction }) {
  const { toast } = useToast();
  const prompt = composePrompt(direction);
  return (
    <div className="relative mt-2 rounded-lg bg-surface-2 p-3 pr-10">
      <p className="font-mono text-xs leading-relaxed text-ink-2">{prompt}</p>
      <IconButton
        label="Copy prompt"
        icon={Copy}
        size="xs"
        className="absolute right-1.5 top-1.5"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(prompt);
            toast({ tone: 'success', title: 'Prompt copied' });
          } catch {
            toast({ tone: 'error', title: 'Couldn’t access the clipboard' });
          }
        }}
      />
    </div>
  );
}
