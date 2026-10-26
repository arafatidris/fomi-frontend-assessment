'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Dialog } from '@/components/ui/Dialog';
import { Disclosure } from '@/components/ui/Disclosure';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { getModel } from '@/data/create/models';
import { useComposer } from './CreateProvider';
import { MODE_OPTIONS, renderCost, scrollFeedToTop, useModeSwitch } from './Composer';
import { PromptField } from './PromptField';
import { ComposerOptions } from './ComposerOptions';
import { AdvancedSettings } from './AdvancedSettings';
import { StylePicker } from './StylePicker';
import { useCatalog } from './CatalogContext';

/**
 * Below the desktop breakpoint the composer docks to the bottom of the screen,
 * within thumb reach, and its settings live in a bottom sheet.
 */
export function MobileComposer() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  if (settingsOpen && !settingsLoaded) setSettingsLoaded(true);
  const { composer } = useComposer();
  const { styles } = useCatalog();
  const setMode = useModeSwitch();
  const isVideo = composer.mode === 'video';
  const model = getModel(isVideo ? composer.videoModel : composer.imageModel);
  const ratio = isVideo ? composer.videoAspectRatio : composer.imageAspectRatio;
  const summary = [isVideo ? `${composer.duration}s` : `${composer.count} images`, ratio, model?.name].join(' · ');
  const styleLabel = styles.find((style) => style.id === composer.styleId)?.label;

  return (
    <>
      <div
        id="composer-dock"
        className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        <div className="mx-auto max-w-2xl rounded-[1.7rem] bg-panel/92 p-2 shadow-pop ring-1 ring-line backdrop-blur-xl backdrop-saturate-150">
          <div className="mb-2 flex items-center gap-2 pl-1 pr-0.5">
            <SegmentedControl label="Media type" options={MODE_OPTIONS} value={composer.mode} onChange={setMode} className="w-36 shrink-0" />
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="min-w-0 flex-1 truncate rounded-full px-2 py-1 text-left text-xs text-ink-2 transition-colors hover:text-ink"
            >
              {summary}
              {styleLabel && ` · ${styleLabel}`}
            </button>
            <IconButton label="Generation settings" icon={SlidersHorizontal} variant="surface" onClick={() => setSettingsOpen(true)} />
          </div>
          <PromptField variant="dock" onGenerated={scrollFeedToTop} />
        </div>
      </div>

      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        labelledBy="composer-settings-title"
        variant="sheet"
        className="lg:hidden"
      >
        {settingsLoaded && (
        <div className="flex max-h-[88dvh] flex-col bg-panel">
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <span aria-hidden className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-line-strong" />
            <h2 id="composer-settings-title" className="text-base font-semibold">
              {isVideo ? 'Video settings' : 'Image settings'}
            </h2>
            <IconButton label="Close settings" icon={X} onClick={() => setSettingsOpen(false)} />
          </div>
          <div className="space-y-3 overflow-y-auto px-5 pb-4">
            <ComposerOptions placement="top-start" />
            <Disclosure title="Advanced">
              <AdvancedSettings />
            </Disclosure>
            <Disclosure title="Styles" summary={styleLabel} defaultOpen>
              <StylePicker />
            </Disclosure>
          </div>
          <div className="border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <Button variant="primary" size="lg" className="w-full" onClick={() => setSettingsOpen(false)}>
              Done · {renderCost(composer)} credits per render
            </Button>
          </div>
        </div>
        )}
      </Dialog>
    </>
  );
}
