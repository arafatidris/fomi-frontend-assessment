'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/ui/Toast';
import { cn } from '@/lib/utils/cn';
import { useHotkeys } from '@/hooks/useHotkeys';
import { CreateProvider, useComposer, useWorkspace } from './CreateProvider';
import { CatalogProvider } from './CatalogContext';
import { TopBar } from './TopBar';
import { HistoryStrip } from './HistoryStrip';
import { Composer } from './Composer';
import { MobileComposer } from './MobileComposer';

// Overlays are code-split: none of them is needed for the first paint.
const Lightbox = dynamic(() => import('./Lightbox').then((module) => module.Lightbox), { ssr: false });
const HistoryDialog = dynamic(() => import('./HistoryDialog').then((module) => module.HistoryDialog), { ssr: false });
const GalleryDialog = dynamic(() => import('./GalleryDialog').then((module) => module.GalleryDialog), { ssr: false });
const ShortcutsDialog = dynamic(() => import('./ShortcutsDialog').then((module) => module.ShortcutsDialog), { ssr: false });

export function CreateShell({ catalog, children }) {
  return (
    <ToastProvider className="lg:items-end lg:pr-8 [--toast-offset:7.5rem] lg:[--toast-offset:1.5rem]">
      <CatalogProvider catalog={catalog}>
        <CreateProvider>
          <Workspace>{children}</Workspace>
        </CreateProvider>
      </CatalogProvider>
    </ToastProvider>
  );
}

/** Keeps a lazily-loaded overlay mounted after its first open so exit animations can play. */
function useLazyOverlay(open) {
  const [loaded, setLoaded] = useState(false);
  // Adjusting state during render (not in an effect) avoids an extra commit.
  if (open && !loaded) setLoaded(true);
  return loaded || open;
}

function Workspace({ children }) {
  const pathname = usePathname();
  const { composer, updateComposer, focusPrompt } = useComposer();
  const { lightbox } = useWorkspace();
  const [overlay, setOverlay] = useState(null); // 'history' | 'gallery' | 'shortcuts'
  const headerRef = useRef(null);

  // Publish the floating header's height so the sticky composer always sits
  // just below it, whatever the breakpoint or font load.
  useEffect(() => {
    const header = headerRef.current;
    const observer = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty('--create-header-h', `${Math.round(entry.borderBoxSize[0].blockSize)}px`);
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  // The Image and Video tabs own the composer mode; Home leaves it to the user.
  useEffect(() => {
    if (pathname === '/image' && composer.mode !== 'image') updateComposer({ mode: 'image' });
    if (pathname === '/video' && composer.mode !== 'video') updateComposer({ mode: 'video' });
  }, [pathname, composer.mode, updateComposer]);

  useHotkeys({
    '/': focusPrompt,
    '?': () => setOverlay('shortcuts'),
  });

  // The editor brings its own controls, so the generation composer steps aside.
  const isEditor = pathname === '/edit';
  const showLightbox = useLazyOverlay(Boolean(lightbox));
  const showHistory = useLazyOverlay(overlay === 'history');
  const showGallery = useLazyOverlay(overlay === 'gallery');
  const showShortcuts = useLazyOverlay(overlay === 'shortcuts');
  const close = () => setOverlay(null);

  return (
    <>
      <a
        href="#feed"
        className="sr-only z-50 rounded-full bg-surface px-4 py-2 text-sm font-medium shadow-pop focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>

      <div ref={headerRef} className="sticky top-0 z-30 bg-canvas pb-2 lg:pb-3">
        <TopBar onOpenGallery={() => setOverlay('gallery')} onOpenShortcuts={() => setOverlay('shortcuts')} />
        <div className="px-4 sm:px-6 lg:px-10">
          <HistoryStrip onViewAll={() => setOverlay('history')} />
        </div>
        {/* Soft edge so content dissolves under the floating header instead of being cut. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-full h-4 bg-linear-to-b from-canvas to-transparent" />
      </div>

      <div
        className={cn(
          'px-4 sm:px-6 lg:px-10 lg:pb-12',
          isEditor
            ? 'pb-12'
            : 'pb-40 lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-7 xl:grid-cols-[20rem_minmax(0,1fr)] 2xl:grid-cols-[22rem_minmax(0,1fr)]',
        )}
      >
        {!isEditor && (
          <aside
            id="composer"
            aria-label="Create"
            className="hidden lg:sticky lg:top-[calc(var(--create-header-h,11rem)+0.25rem)] lg:block lg:h-[calc(100dvh-var(--create-header-h,11rem)-1.5rem)] lg:min-h-120"
          >
            <Composer />
          </aside>
        )}
        <main id="feed" className="min-w-0 pt-2 lg:pt-1">
          {children}
        </main>
      </div>

      {!isEditor && <MobileComposer />}

      {showLightbox && <Lightbox />}
      {showHistory && <HistoryDialog open={overlay === 'history'} onClose={close} />}
      {showGallery && <GalleryDialog open={overlay === 'gallery'} onClose={close} />}
      {showShortcuts && <ShortcutsDialog open={overlay === 'shortcuts'} onClose={close} />}
    </>
  );
}
