'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Coins } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Disclosure } from '@/components/ui/Disclosure';
import { CURRENT_USER } from '@/data/user';
import { useCatalog } from './CatalogContext';
import { useComposer } from './CreateProvider';
import { PromptField } from './PromptField';
import { ComposerOptions } from './ComposerOptions';
import { AdvancedSettings } from './AdvancedSettings';
import { StylePicker } from './StylePicker';

export const MODE_OPTIONS = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
];

/** After queueing a render, bring the top of the feed (where it appears) into view. */
export const scrollFeedToTop = () => window.scrollY > 120 && window.scrollTo({ top: 0, behavior: 'smooth' });

/** What the next render will cost, shown before the click rather than after. */
export function renderCost(composer) {
  if (composer.mode === 'video') return composer.duration === 10 ? 20 : 10;
  return composer.count * (composer.quality === 'hd' ? 2 : 1);
}

/** Switching mode on a media tab moves to the matching tab, so URL and UI agree. */
export function useModeSwitch() {
  const router = useRouter();
  const pathname = usePathname();
  const { updateComposer } = useComposer();
  return (mode) => {
    updateComposer({ mode });
    if (pathname === '/image' || pathname === '/video') router.push(`/${mode}`);
  };
}

export function Composer() {
  const { composer } = useComposer();
  const { styles } = useCatalog();
  const setMode = useModeSwitch();
  const styleLabel = styles.find((style) => style.id === composer.styleId)?.label;
  const cost = renderCost(composer);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto overscroll-contain rounded-[1.35rem] bg-panel p-3.5">
      <SegmentedControl label="Media type" options={MODE_OPTIONS} value={composer.mode} onChange={setMode} />
      <PromptField onGenerated={scrollFeedToTop} />
      <ComposerOptions />
      <div className="flex flex-col gap-2.5 pt-1">
        <Disclosure title="Advanced">
          <AdvancedSettings />
        </Disclosure>
        <Disclosure title="Styles" summary={styleLabel}>
          <StylePicker />
        </Disclosure>
      </div>
      <p className="mt-auto flex items-center justify-center gap-1.5 pt-2 text-[11px] text-ink-2">
        <Coins aria-hidden className="size-3.5" />
        <span>
          This render uses <strong className="font-semibold text-ink">{cost} credits</strong> ·{' '}
          {CURRENT_USER.credits.toLocaleString('en-US')} available
        </span>
      </p>
    </div>
  );
}
