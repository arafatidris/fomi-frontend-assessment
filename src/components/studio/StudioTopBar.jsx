'use client';

import Link from 'next/link';
import { ArrowUpRight, ChevronDown, Command, Download, Keyboard, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Menu } from '@/components/ui/Menu';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { useModKey } from '@/hooks/useHotkeys';
import { CURRENT_USER } from '@/data/user';
import { LogoMark } from '@/components/create/Logo';
import { useStudio, useStudioActions, useStudioList } from './StudioProvider';

export function StudioTopBar({ onOpenPalette, onOpenShots, onOpenShortcuts }) {
  const mod = useModKey();
  const { toast } = useToast();
  const actions = useStudioActions();
  const project = useStudio((state) => state.project);
  const activeTitle = useStudio((state) => state.shots[state.activeShotId].title);
  const finals = useStudioList((state) => state.shotOrder.filter((id) => state.shots[id].finalTakeId));
  const total = useStudio((state) => state.shotOrder.length);

  const exportFinals = () =>
    toast({
      tone: 'success',
      title: `Exporting ${finals.length} of ${total} finals`,
      description: 'Each at its deliverable size, as a zip. (Mocked in this demo.)',
    });

  return (
    <header className="flex h-13 shrink-0 items-center gap-2 border-b border-line px-3 md:px-4">
      <Link href="/" aria-label="Back to Fomi Create" className="flex items-center rounded-lg p-1.5 text-ink transition-colors hover:bg-surface-2">
        <LogoMark className="h-5 w-[18px]" />
      </Link>
      <span aria-hidden className="h-5 w-px bg-line-strong" />
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 truncate text-[13px]">
          <span className="text-ink-2">{project.client}</span>
          <span aria-hidden className="text-ink-3">/</span>
          <span className="font-semibold">{project.name}</span>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-2">{project.season}</span>
        </p>
      </div>

      {/* Shot switcher for screens without the rail. */}
      <button
        type="button"
        onClick={onOpenShots}
        className="ml-1 flex min-w-0 items-center gap-1 rounded-lg px-2 py-1 text-[13px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink xl:hidden"
      >
        <span aria-hidden>·</span>
        <span className="truncate font-medium text-ink">{activeTitle}</span>
        <ChevronDown aria-hidden className="size-3.5 shrink-0" />
        <span className="sr-only">Switch shot</span>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenPalette}
          className="hidden h-8 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-[13px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink md:flex"
        >
          <Command aria-hidden className="size-3.5" />
          Commands
          <kbd className="rounded border border-line-strong px-1 font-mono text-[11px]">{mod}K</kbd>
        </button>
        <Button size="sm" variant="secondary" icon={Download} onClick={exportFinals} className="hidden h-8 rounded-lg sm:inline-flex">
          Export <span className="font-mono text-xs text-ink-2">{finals.length}/{total}</span>
        </Button>
        <Menu
          label="Account"
          items={[
            { label: 'Command palette', icon: Command, onSelect: onOpenPalette, shortcut: `${mod}K` },
            { label: 'Keyboard shortcuts', icon: Keyboard, onSelect: onOpenShortcuts, shortcut: '?' },
            { label: 'Back to Fomi Create', icon: ArrowUpRight, href: '/' },
            { separator: true },
            { label: 'Reset demo project', icon: RotateCcw, onSelect: actions.reset },
          ]}
          header={
            <div className="mb-1 border-b border-line px-2.5 pb-2.5 pt-1">
              <p className="text-sm font-semibold">{CURRENT_USER.name}</p>
              <p className="text-xs text-ink-3">{CURRENT_USER.email}</p>
            </div>
          }
          trigger={(props) => (
            <button {...props} type="button" aria-label={`Account: ${CURRENT_USER.name}`} className="ml-1 rounded-full transition-transform hover:scale-105 active:scale-95">
              <Avatar initials={CURRENT_USER.initials} size={28} className="ring-canvas" />
            </button>
          )}
        />
      </div>
    </header>
  );
}
