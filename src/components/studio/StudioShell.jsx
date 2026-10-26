'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Layers, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { ToastProvider } from '@/components/ui/Toast';
import { Dialog } from '@/components/ui/Dialog';
import { IconButton } from '@/components/ui/IconButton';
import { useHotkeys } from '@/hooks/useHotkeys';
import { StudioProvider, useStudio, useStudioActions, useStudioStore } from './StudioProvider';
import { StudioTopBar } from './StudioTopBar';
import { ShotRail } from './ShotRail';
import { Stage } from './Stage';
import { DirectionPanel } from './DirectionPanel';

const Viewer = dynamic(() => import('./Viewer').then((module) => module.Viewer), { ssr: false });
const CommandPalette = dynamic(() => import('./CommandPalette').then((module) => module.CommandPalette), { ssr: false });
const StudioShortcuts = dynamic(() => import('./StudioShortcuts').then((module) => module.StudioShortcuts), { ssr: false });

export function StudioShell({ project }) {
  return (
    <ToastProvider className="[--toast-offset:5.5rem] lg:items-end lg:pr-[23.5rem] lg:[--toast-offset:3.25rem]">
      <StudioProvider project={project}>
        <Workspace />
      </StudioProvider>
    </ToastProvider>
  );
}

function Workspace() {
  const store = useStudioStore();
  const actions = useStudioActions();
  const panels = useStudio((state) => state.panels);
  const viewerOpen = useStudio((state) => Boolean(state.viewer));
  const busy = useStudio((state) => Boolean(state.jobs[state.activeShotId]));
  const [overlay, setOverlay] = useState(null); // 'palette' | 'shortcuts' | 'shots' | 'direction'
  const [loaded, setLoaded] = useState({});
  if (overlay && !loaded[overlay]) setLoaded({ ...loaded, [overlay]: true });
  if (viewerOpen && !loaded.viewer) setLoaded({ ...loaded, viewer: true });

  const stepShot = (step) => {
    const { shotOrder, activeShotId } = store.getState();
    const next = shotOrder[(shotOrder.indexOf(activeShotId) + step + shotOrder.length) % shotOrder.length];
    actions.selectShot(next);
  };

  useHotkeys({
    'mod+k': () => setOverlay((current) => (current === 'palette' ? null : 'palette')),
    'mod+enter': () => {
      const { proposal, activeShotId } = store.getState();
      if (proposal?.status === 'ready' && proposal.shotId === activeShotId && proposal.changes.length) actions.applyProposal();
      else actions.generate(activeShotId);
    },
    '?': () => setOverlay('shortcuts'),
    '[': () => stepShot(-1),
    ']': () => stepShot(1),
    '\\': () => {
      const open = !(panels.rail || panels.direction);
      actions.setPanels({ rail: open, direction: open });
    },
  });

  const close = () => setOverlay(null);

  return (
    <div className="flex h-dvh flex-col">
      <a
        href="#stage"
        className="sr-only z-50 rounded-lg bg-surface px-4 py-2 text-sm shadow-pop focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to takes
      </a>
      <StudioTopBar
        onOpenPalette={() => setOverlay('palette')}
        onOpenShots={() => setOverlay('shots')}
        onOpenShortcuts={() => setOverlay('shortcuts')}
      />

      <div className="flex min-h-0 flex-1">
        {panels.rail && (
          <aside className="hidden w-64 shrink-0 border-r border-line bg-panel xl:block 2xl:w-72">
            <ShotRail />
          </aside>
        )}
        <main id="stage" className="min-w-0 flex-1">
          <Stage onOpenDirection={() => setOverlay('direction')} />
        </main>
        {panels.direction && (
          <aside aria-label="Direction" className="hidden w-[22rem] shrink-0 border-l border-line bg-panel lg:block 2xl:w-[24rem]">
            <DirectionPanel />
          </aside>
        )}
      </div>

      {/* Touch-first action bar below the desktop breakpoint. */}
      <nav
        aria-label="Studio actions"
        className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-line bg-panel/95 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl lg:hidden"
      >
        <BarButton icon={Layers} label="Shots" className="xl:hidden" onClick={() => setOverlay('shots')} />
        <BarButton icon={SlidersHorizontal} label="Direction" onClick={() => setOverlay('direction')} />
        <button
          type="button"
          onClick={() => actions.generate(store.getState().activeShotId)}
          disabled={busy}
          className="ml-auto flex h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent-solid px-4 text-sm font-semibold text-on-accent transition-transform active:scale-[0.98] disabled:opacity-60 sm:flex-none sm:px-6"
        >
          <Sparkles aria-hidden className="size-4" />
          {busy ? 'Rendering…' : 'Render'}
          <span className="hidden sm:inline">{busy ? '' : '4 takes'}</span>
        </button>
      </nav>

      <Dialog open={overlay === 'shots'} onClose={close} label="Shot list" variant="drawer" className="mr-auto ml-0 xl:hidden [--dialog-width:20rem]">
        <div className="relative h-full bg-panel">
          <IconButton label="Close shot list" icon={X} onClick={close} className="absolute right-2 top-2.5 z-10" />
          {loaded.shots && <ShotRail onNavigate={close} inOverlay />}
        </div>
      </Dialog>
      <Dialog open={overlay === 'direction'} onClose={close} label="Direction" variant="sheet" className="lg:hidden [--dialog-width:28rem]">
        <div className="relative h-[85dvh] bg-panel">
          <IconButton label="Close direction" icon={X} onClick={close} className="absolute right-3 top-2.5 z-10" />
          {loaded.direction && <DirectionPanel inOverlay />}
        </div>
      </Dialog>

      {loaded.viewer && <Viewer />}
      {loaded.palette && (
        <CommandPalette
          open={overlay === 'palette'}
          onClose={close}
          onOpenShortcuts={() => setOverlay('shortcuts')}
          onOpenDirection={() => setOverlay('direction')}
        />
      )}
      {loaded.shortcuts && <StudioShortcuts open={overlay === 'shortcuts'} onClose={close} />}
    </div>
  );
}

function BarButton({ icon: Icon, label, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-[13px] font-medium text-ink transition-transform active:scale-[0.97] ${className ?? ''}`}
    >
      <Icon aria-hidden className="size-4 text-ink-2" />
      {label}
    </button>
  );
}
