'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Heart,
  ImageUpscale,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { getModel } from '@/data/create/models';
import { getStyle } from '@/data/create/styles';
import { cn } from '@/lib/utils/cn';
import { formatDuration, truncate } from '@/lib/utils/format';
import { useWorkspace } from './CreateProvider';
import { RelativeTime } from './RelativeTime';

/**
 * Full-screen viewer. Always dark so color judgement isn't biased by the warm
 * UI. ←/→ or swipe to move between outputs, Esc to close.
 */
export function Lightbox() {
  const { lightbox, closeLightbox, favorites, toggleFavorite, reuse, removeGeneration } = useWorkspace();
  const { toast } = useToast();
  // Keep showing the last item while the close animation plays.
  const [current, setCurrent] = useState(lightbox);
  const [index, setIndex] = useState(lightbox?.index ?? 0);
  const [upscaled, setUpscaled] = useState({});
  const swipe = useRef(null);

  if (lightbox && lightbox !== current) {
    setCurrent(lightbox);
    setIndex(lightbox.index);
  }

  const generation = current?.generation;
  const outputs = generation?.outputs ?? [];
  const output = outputs[Math.min(index, outputs.length - 1)];
  const isVideo = generation?.type === 'video';
  const many = outputs.length > 1;

  const go = (step) => many && setIndex((value) => (value + step + outputs.length) % outputs.length);

  const onKeyDown = (event) => {
    if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return;
    if (event.key === 'ArrowRight') go(1);
    else if (event.key === 'ArrowLeft') go(-1);
    else if (event.key.toLowerCase() === 'f' && output) toggleFavorite(output.id);
    else return;
    event.preventDefault();
  };

  const onPointerDown = (event) => {
    if (event.pointerType !== 'mouse') swipe.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(event.clientY - start.y)) go(dx < 0 ? 1 : -1);
  };

  const upscale = () => {
    if (!output || upscaled[output.id]) return;
    setUpscaled((state) => ({ ...state, [output.id]: 'working' }));
    setTimeout(() => {
      setUpscaled((state) => ({ ...state, [output.id]: 'done' }));
      toast({ tone: 'success', title: 'Upscaled to 2×', description: `${output.width * 2} × ${output.height * 2} px, saved to Assets` });
    }, 1700);
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generation.prompt);
      toast({ tone: 'success', title: 'Prompt copied' });
    } catch {
      toast({ tone: 'error', title: 'Couldn’t access the clipboard' });
    }
  };

  const favorite = output && favorites.includes(output.id);
  const upscaleState = output && upscaled[output.id];
  const model = generation && getModel(generation.modelId);
  const style = generation && getStyle(generation.styleId);
  const scale = upscaleState === 'done' ? 2 : 1;

  return (
    <Dialog
      open={Boolean(lightbox)}
      onClose={closeLightbox}
      label="Viewer"
      variant="fullscreen"
      className="bg-[#0d0b0a] text-white [--c-ink:#f6f0ec] [--c-ink-2:#c9bfb8] [--c-ink-3:#a1958d] [--c-line:rgb(255_255_255/0.1)] [--c-line-strong:rgb(255_255_255/0.18)] [--c-surface:#1b1816] [--c-surface-2:#23201d] [--c-panel-2:#2a2522]"
      onKeyDown={onKeyDown}
    >
      {generation && output && (
        <div className="flex h-full flex-col lg:flex-row">
          {/* Stage */}
          <div
            className="relative flex min-h-0 min-w-0 flex-1 flex-col"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] lg:px-6">
              <p className="text-[13px] font-medium tabular text-white/70" aria-live="polite">
                {many ? `${index + 1} / ${outputs.length}` : isVideo ? 'Video' : 'Image'}
              </p>
              <IconButton label="Close viewer" shortcut="Esc" icon={X} variant="overlay" autoFocus onClick={closeLightbox} />
            </div>

            <div className="relative min-h-0 flex-1 px-3 lg:px-16">
              <div key={output.id} className="relative size-full animate-fade-in">
                {isVideo ? (
                  <video
                    src={output.src}
                    poster={output.poster}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    aria-label={truncate(generation.prompt, 120)}
                    className="size-full object-contain"
                  />
                ) : (
                  <Image
                    src={output.src}
                    alt={generation.prompt}
                    fill
                    sizes="(min-width: 1024px) calc(100vw - 26rem), 100vw"
                    quality={90}
                    placeholder="blur"
                    blurDataURL={output.blurDataURL}
                    className="select-none object-contain"
                    draggable={false}
                    loading="eager"
                  />
                )}
                {upscaleState === 'done' && (
                  <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                    2× upscaled
                  </span>
                )}
              </div>

              {many && (
                <>
                  <NavButton direction="left" onClick={() => go(-1)} />
                  <NavButton direction="right" onClick={() => go(1)} />
                </>
              )}
            </div>

            {many && (
              <ul aria-label="Outputs" className="flex justify-center-safe gap-2 overflow-x-auto px-4 py-3 scrollbar-none lg:py-4">
                {outputs.map((item, itemIndex) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setIndex(itemIndex)}
                      aria-label={`Show output ${itemIndex + 1}`}
                      aria-current={itemIndex === index || undefined}
                      className={cn(
                        'relative block size-12 overflow-hidden rounded-lg opacity-55 ring-2 ring-transparent transition-[opacity,box-shadow,transform] duration-200 hover:opacity-90 active:scale-95 lg:size-14',
                        itemIndex === index && 'opacity-100 ring-white',
                      )}
                    >
                      <Image src={item.poster ?? item.src} alt="" fill sizes="56px" quality={60} placeholder="blur" blurDataURL={item.blurDataURL} className="object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Details */}
          <aside className="flex max-h-[45dvh] shrink-0 flex-col overflow-y-auto border-t border-white/10 bg-[#141110] lg:max-h-none lg:w-[24rem] lg:border-l lg:border-t-0">
            <div className="flex-1 space-y-6 p-5 lg:p-6">
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">Prompt</h2>
                  <IconButton label="Copy prompt" icon={Copy} size="xs" variant="overlay" onClick={copyPrompt} />
                </div>
                <p className="text-sm leading-relaxed text-white/90">{generation.prompt}</p>
              </section>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
                <Meta label="Model" value={model?.name ?? '—'} />
                <Meta label="Aspect ratio" value={generation.aspectRatio} />
                <Meta label="Style" value={style?.label ?? 'None'} />
                <Meta label="Seed" value={output.seed ?? '—'} mono />
                <Meta label="Resolution" value={`${output.width * scale} × ${output.height * scale}`} mono />
                {isVideo ? (
                  <Meta label="Duration" value={formatDuration(output.duration ?? 5)} mono />
                ) : (
                  <Meta label="Created" value={<RelativeTime generation={generation} />} />
                )}
              </dl>
            </div>

            <div className="space-y-2 border-t border-white/10 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:p-6">
              <Button variant="primary" size="lg" icon={RotateCcw} className="w-full" onClick={() => reuse(generation)}>
                Reuse prompt &amp; settings
              </Button>
              <div className="grid grid-cols-4 gap-2">
                <ActionButton
                  label={favorite ? 'Saved' : 'Save'}
                  icon={Heart}
                  pressed={favorite}
                  onClick={() => toggleFavorite(output.id)}
                  iconClassName={favorite ? 'fill-[#ff8a75] text-[#ff8a75]' : ''}
                />
                <a
                  href={output.src}
                  download
                  className="flex flex-col items-center gap-1 rounded-xl bg-white/6 py-2.5 text-[11px] font-medium text-white/85 transition-colors hover:bg-white/12"
                >
                  <Download aria-hidden className="size-4" />
                  Download
                </a>
                {!isVideo ? (
                  <ActionButton
                    label={upscaleState === 'done' ? 'Upscaled' : 'Upscale 2×'}
                    icon={upscaleState === 'working' ? null : ImageUpscale}
                    busy={upscaleState === 'working'}
                    disabled={Boolean(upscaleState)}
                    onClick={upscale}
                  />
                ) : (
                  <span />
                )}
                <ActionButton label="Delete" icon={Trash2} onClick={() => removeGeneration(generation)} tone="danger" />
              </div>
            </div>
          </aside>
        </div>
      )}
    </Dialog>
  );
}

function NavButton({ direction, onClick }) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'left' ? 'Previous output' : 'Next output'}
      className={cn(
        'absolute top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-[background-color,transform] duration-150 hover:bg-white/20 active:scale-90 sm:flex',
        direction === 'left' ? 'left-3' : 'right-3',
      )}
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}

function Meta({ label, value, mono }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-white/55">{label}</dt>
      <dd className={cn('mt-0.5 truncate text-white/90', mono && 'font-mono text-[12.5px] tabular')}>{value}</dd>
    </div>
  );
}

function ActionButton({ label, icon: Icon, onClick, pressed, busy, disabled, tone, iconClassName }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={cn(
        'flex flex-col items-center gap-1 rounded-xl bg-white/6 py-2.5 text-[11px] font-medium transition-[background-color,transform] duration-150 hover:bg-white/12 active:scale-95 disabled:cursor-default disabled:hover:bg-white/6',
        tone === 'danger' ? 'text-[#ff9c8a]' : 'text-white/85',
      )}
    >
      {busy ? <Spinner className="size-4" /> : Icon && <Icon aria-hidden className={cn('size-4', iconClassName)} />}
      {busy ? 'Upscaling…' : label}
    </button>
  );
}
