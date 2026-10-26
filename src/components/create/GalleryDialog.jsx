'use client';

import Image from 'next/image';
import { Heart, WandSparkles, X } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { IconButton } from '@/components/ui/IconButton';
import { useToast } from '@/components/ui/Toast';
import { useCatalog } from './CatalogContext';
import { useComposer } from './CreateProvider';

/** Community picks with one-click "use this prompt": inspiration that leads straight back to work. */
export function GalleryDialog({ open, onClose }) {
  const { community } = useCatalog();
  const { updateComposer, focusPrompt } = useComposer();
  const { toast } = useToast();

  const applyPrompt = (pick) => {
    updateComposer({ prompt: pick.prompt, mode: 'image' });
    onClose();
    requestAnimationFrame(focusPrompt);
    toast({ tone: 'success', title: 'Prompt added to your composer', description: `From @${pick.author}` });
  };

  return (
    <Dialog open={open} onClose={onClose} labelledBy="gallery-title" variant="sheet" className="[--dialog-width:68rem]">
      <div className="flex max-h-[88dvh] flex-col sm:max-h-[min(100dvh-2rem,52rem)]">
        <header className="flex items-center gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="mr-auto">
            <h2 id="gallery-title" className="text-lg font-semibold">
              Community gallery
            </h2>
            <p className="text-xs text-ink-2">Hand-picked this week. Use any prompt as a starting point.</p>
          </div>
          <IconButton label="Close gallery" icon={X} onClick={onClose} />
        </header>
        <ul className="columns-2 gap-3 overflow-y-auto p-5 sm:columns-3 sm:p-6 lg:columns-4">
          {community.map((pick) => (
            <li key={pick.id} className="group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-panel-2">
              <Image
                src={pick.media.src}
                alt={pick.prompt}
                width={pick.media.width}
                height={pick.media.height}
                sizes="(min-width: 1024px) 16rem, (min-width: 640px) 33vw, 50vw"
                quality={60}
                placeholder="blur"
                blurDataURL={pick.media.blurDataURL}
                className="h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/80 via-black/20 to-transparent p-3 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100">
                <p className="mb-2 line-clamp-3 text-xs leading-snug text-white/90">{pick.prompt}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1 truncate text-[11px] text-white/75">
                    @{pick.author} · <Heart aria-hidden className="size-3 fill-current" /> {pick.likes.toLocaleString('en-US')}
                  </span>
                  <button
                    type="button"
                    onClick={() => applyPrompt(pick)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1c1917] transition-transform duration-150 hover:scale-105 active:scale-95"
                  >
                    <WandSparkles aria-hidden className="size-3" />
                    Use prompt
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
}
