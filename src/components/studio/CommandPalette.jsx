'use client';

import { useDeferredValue, useId, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  Clapperboard,
  Columns2,
  Compass,
  Download,
  Eye,
  Filter,
  Image as ImageIcon,
  Keyboard,
  Maximize2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Kbd } from '@/components/ui/Kbd';
import { useToast } from '@/components/ui/Toast';
import { useModKey } from '@/hooks/useHotkeys';
import { DIRECTION_FIELDS } from '@/data/studio/direction';
import { cn } from '@/lib/utils/cn';
import { useStudioActions, useStudioStore } from './StudioProvider';

/**
 * ⌘K: every action, shot and take by name. Fuzzy enough to forgive, fast
 * enough to replace the mouse for people who live in the tool.
 */
export function CommandPalette({ open, onClose, onOpenShortcuts, onOpenDirection }) {
  const id = useId();
  const router = useRouter();
  const mod = useModKey();
  const { toast } = useToast();
  const store = useStudioStore();
  const actions = useStudioActions();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const deferred = useDeferredValue(query);

  // Rebuilt when opened or searched; state is read at that moment, not subscribed.
  const commands = useMemo(() => {
    if (!open) return [];
    const state = store.getState();
    const shotId = state.activeShotId;
    const shot = state.shots[shotId];
    const quickExplore = async (axis) => {
      const variants = await actions.suggest(shotId, axis);
      actions.explore(shotId, axis, variants);
    };

    const list = [
      { group: 'Actions', label: 'Render 4 new takes', icon: Sparkles, hint: `${mod}↵`, run: () => actions.generate(shotId) },
      ...DIRECTION_FIELDS.filter((field) => !shot.locks[field.key]).map((field) => ({
        group: 'Actions',
        label: `Explore ${field.label.toLowerCase()}`,
        detail: 'Four suggested values, everything else fixed',
        icon: Compass,
        keywords: 'sweep vary axis',
        run: () => quickExplore(field.key),
      })),
      { group: 'Actions', label: 'Show picks only', icon: Filter, run: () => actions.setFilter('picks') },
      { group: 'Actions', label: 'Show takes to review', icon: Filter, keywords: 'unrated', run: () => actions.setFilter('unrated') },
      { group: 'Actions', label: 'Show all takes', icon: Filter, run: () => actions.setFilter('all') },
      { group: 'Actions', label: state.hideRejects ? 'Show rejected takes' : 'Hide rejected takes', icon: Eye, hint: 'H', run: actions.toggleHideRejects },
      {
        group: 'Actions',
        label: 'Focus mode',
        detail: 'Hide the side panels',
        icon: Maximize2,
        hint: '\\',
        run: () => {
          const show = !(state.panels.rail || state.panels.direction);
          actions.setPanels({ rail: show, direction: show });
        },
      },
      ...(state.compare.length === 2
        ? [{ group: 'Actions', label: 'Compare selected takes', icon: Columns2, run: () => actions.openViewer(state.compare[0], state.compare[1]) }]
        : []),
      { group: 'Actions', label: 'Edit direction', icon: SlidersHorizontal, run: onOpenDirection },
      {
        group: 'Actions',
        label: 'Export finals',
        icon: Download,
        run: () => toast({ tone: 'success', title: 'Export started', description: 'Finals at deliverable size (mocked).' }),
      },
      { group: 'Actions', label: 'Keyboard shortcuts', icon: Keyboard, hint: '?', run: onOpenShortcuts },
      { group: 'Actions', label: 'Reset demo project', icon: RotateCcw, run: actions.reset },
      { group: 'Actions', label: 'Back to Fomi Create', icon: ArrowUpRight, run: () => router.push('/') },
      ...state.shotOrder.map((id, index) => ({
        group: 'Shots',
        label: state.shots[id].title,
        detail: `${String(index + 1).padStart(2, '0')} · ${state.shots[id].use} · ${state.shots[id].aspectRatio}`,
        icon: Clapperboard,
        keywords: state.shots[id].use,
        run: () => actions.selectShot(id),
      })),
      ...[...shot.roundIds].reverse().flatMap((roundId) =>
        state.rounds[roundId].takeIds.map((takeId) => {
          const take = state.takes[takeId];
          return {
            group: 'Takes',
            label: `Take ${take.label}`,
            detail: take.variant ?? (take.rating ? `${take.rating === 'pick' ? 'Picked' : 'Rejected'}` : 'Unrated'),
            icon: ImageIcon,
            keywords: take.label,
            run: () => actions.openViewer(takeId),
          };
        }),
      ),
    ];
    return list;
  }, [open, store, actions, mod, toast, router, onOpenShortcuts, onOpenDirection]);

  const results = useMemo(() => {
    const words = deferred.toLowerCase().split(/\s+/).filter(Boolean);
    const matching = words.length
      ? commands.filter((command) => {
          const haystack = `${command.label} ${command.detail ?? ''} ${command.keywords ?? ''} ${command.group}`.toLowerCase();
          return words.every((word) => haystack.includes(word));
        })
      : commands.filter((command) => command.group !== 'Takes');
    return matching.slice(0, 40);
  }, [commands, deferred]);

  const run = (command) => {
    onClose();
    setQuery('');
    // Let the dialog close first so focus returns before the action runs.
    requestAnimationFrame(command.run);
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(results.length - 1, index + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === 'Enter' && results[active]) {
      event.preventDefault();
      run(results[active]);
    }
  };

  let lastGroup = null;

  return (
    <Dialog
      open={open}
      onClose={() => {
        onClose();
        setQuery('');
      }}
      label="Command palette"
      className="mt-[12vh] mb-auto [--dialog-width:38rem]"
    >
      <div className="flex max-h-[70vh] flex-col">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search aria-hidden className="size-4 shrink-0 text-ink-3" />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls={`${id}-list`}
            aria-activedescendant={results[active] ? `${id}-item-${active}` : undefined}
            aria-label="Search commands, shots and takes"
            placeholder="Search commands, shots, takes…"
            className="h-13 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
          />
          <Kbd>Esc</Kbd>
        </div>
        <div id={`${id}-list`} role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto p-2">
          {results.length === 0 && <p className="px-3 py-10 text-center text-sm text-ink-2">No matches for “{query}”.</p>}
          {results.map((command, index) => {
            const header = command.group !== lastGroup ? command.group : null;
            lastGroup = command.group;
            const Icon = command.icon;
            return (
              <div key={`${command.group}-${command.label}`}>
                {header && <p className="px-3 pb-1 pt-3 font-mono text-[11px] uppercase tracking-wider text-ink-3 first:pt-1">{header}</p>}
                <div
                  id={`${id}-item-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onPointerMove={() => index !== active && setActive(index)}
                  onClick={() => run(command)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px]',
                    index === active ? 'bg-surface-2 text-ink' : 'text-ink',
                  )}
                >
                  <Icon aria-hidden className={cn('size-4 shrink-0', index === active ? 'text-accent-ink' : 'text-ink-3')} />
                  <span className="min-w-0 flex-1 truncate">
                    {command.label}
                    {command.detail && <span className="ml-2 text-ink-3">{command.detail}</span>}
                  </span>
                  {command.hint && <Kbd>{command.hint}</Kbd>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Dialog>
  );
}
