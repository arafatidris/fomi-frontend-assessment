'use client';

import { memo, useState } from 'react';
import { CircleAlert, Copy, Ellipsis, ImageIcon, RotateCcw, Trash2, Video, Download } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { Menu } from '@/components/ui/Menu';
import { Button } from '@/components/ui/Button';
import { getModel } from '@/data/create/models';
import { getAspectRatio } from '@/lib/media/aspect-ratios';
import { cn } from '@/lib/utils/cn';
import { MediaTile } from './MediaTile';
import { ProgressRing } from './ProgressRing';
import { RelativeTime } from './RelativeTime';

const SIZES = {
  tall: '(min-width: 1536px) 15vw, (min-width: 1280px) 16vw, (min-width: 768px) 23vw, 48vw',
  wide: '(min-width: 1536px) 30vw, (min-width: 1280px) 33vw, (min-width: 640px) 46vw, 94vw',
};

/**
 * One generation: the prompt card from the design on the left (above, on
 * narrower screens) and its outputs on the right. Memoized: the feed passes
 * only stable callbacks, so progress polling re-renders just the item that
 * is actually rendering.
 */
export const GenerationItem = memo(function GenerationItem({
  generation,
  eager,
  favorites,
  onOpen,
  onRetry,
  onRemove,
  onReuse,
  onCopy,
  onToggleFavorite,
}) {
  const aspect = getAspectRatio(generation.aspectRatio).value;
  const wide = aspect > 1.2;
  const status = generation.status ?? 'succeeded';
  const count = status === 'succeeded' ? generation.outputs.length : generation.count ?? 4;
  const fresh = status === 'succeeded' && Boolean(generation.fresh);

  return (
    <li
      id={`generation-${generation.id}`}
      className="grid scroll-mt-56 gap-3 [contain-intrinsic-size:auto_22rem] [content-visibility:auto] xl:grid-cols-[14.5rem_minmax(0,1fr)] 2xl:grid-cols-[16rem_minmax(0,1fr)]"
    >
      <PromptCard
        generation={generation}
        status={status}
        count={count}
        onRetry={onRetry}
        onRemove={onRemove}
        onReuse={onReuse}
        onCopy={onCopy}
      />

      {status === 'failed' ? (
        <FailedPanel generation={generation} onRetry={onRetry} onRemove={onRemove} />
      ) : (
        <ul
          aria-label={status === 'pending' ? 'Rendering' : `${count} ${generation.type === 'video' ? 'video' : 'images'}`}
          aria-busy={status === 'pending' || undefined}
          className={cn('grid content-start gap-2.5 sm:gap-3', wide ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 md:grid-cols-4')}
        >
          {status === 'pending'
            ? Array.from({ length: count }, (_, index) => (
                <li key={index}>
                  <PendingTile aspect={aspect} progress={generation.progress} index={index} />
                </li>
              ))
            : generation.outputs.map((output, index) => (
                <li key={output.id}>
                  <MediaTile
                    generation={generation}
                    output={output}
                    index={index}
                    aspect={aspect}
                    sizes={wide ? SIZES.wide : SIZES.tall}
                    eager={eager}
                    priority={eager && index === 0}
                    fresh={fresh}
                    favorite={favorites.has(output.id)}
                    onOpen={onOpen}
                    onToggleFavorite={onToggleFavorite}
                  />
                </li>
              ))}
        </ul>
      )}
    </li>
  );
});

function PromptCard({ generation, status, count, onRetry, onRemove, onReuse, onCopy }) {
  const [expanded, setExpanded] = useState(false);
  const model = getModel(generation.modelId);
  const long = generation.prompt.length > 220;
  const TypeIcon = generation.type === 'video' ? Video : ImageIcon;

  const menuItems = [
    { label: 'Reuse prompt & settings', icon: RotateCcw, onSelect: () => onReuse(generation) },
    { label: 'Copy prompt', icon: Copy, onSelect: () => onCopy(generation.prompt) },
    ...(status === 'succeeded' && generation.outputs[0]
      ? [{ label: 'Download first output', icon: Download, href: generation.outputs[0].src }]
      : []),
    ...(status === 'failed' ? [{ label: 'Try again', icon: RotateCcw, onSelect: () => onRetry(generation.id) }] : []),
    { separator: true },
    { label: 'Delete', icon: Trash2, tone: 'danger', onSelect: () => onRemove(generation) },
  ];

  return (
    <article className="group/card flex min-w-0 flex-col rounded-2xl bg-panel p-3.5 xl:self-start">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] text-ink-2">
        <TypeIcon aria-hidden className="size-3.5" />
        <span>
          {generation.type === 'video' ? 'Video' : `${count} ${count === 1 ? 'image' : 'images'}`} · {generation.aspectRatio}
        </span>
        <span aria-hidden>·</span>
        {status === 'pending' ? (
          <span className="font-medium text-accent-ink">{generation.jobId ? 'Rendering' : 'Queued'}</span>
        ) : (
          <RelativeTime generation={generation} />
        )}
      </div>

      <p
        className={cn(
          'text-[12.5px] leading-relaxed text-ink [overflow-wrap:anywhere]',
          !expanded && 'line-clamp-3 xl:line-clamp-[9]',
        )}
      >
        {generation.prompt}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-1 self-start rounded text-[11px] font-semibold text-accent-ink hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}

      <div className="mt-3 flex items-center gap-0.5">
        <IconButton label="Reuse prompt & settings" icon={RotateCcw} size="xs" onClick={() => onReuse(generation)} />
        <IconButton label="Copy prompt" icon={Copy} size="xs" onClick={() => onCopy(generation.prompt)} />
        <Menu
          label="Generation actions"
          placement="bottom-start"
          items={menuItems}
          trigger={(props) => (
            <IconButton {...props} label="More actions" icon={Ellipsis} size="xs" tooltip={false} />
          )}
        />
        <span className="ml-auto max-w-[60%] truncate rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-ink shadow-card">
          {model?.name ?? 'Model'}
        </span>
      </div>
    </article>
  );
}

function PendingTile({ aspect, progress, index }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl bg-panel-2"
      style={{ aspectRatio: aspect }}
    >
      <div
        aria-hidden
        className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent_30%,color-mix(in_oklab,var(--c-surface)_70%,transparent)_50%,transparent_70%)] bg-size-[220%_100%]"
        style={{ animationDelay: `${index * 120}ms` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_30%_25%,color-mix(in_oklab,var(--c-accent)_35%,transparent),transparent_55%),radial-gradient(circle_at_75%_80%,color-mix(in_oklab,var(--c-accent-solid)_25%,transparent),transparent_50%)] blur-xl"
        style={{ transform: `scale(${1 + progress * 0.4})`, transition: 'transform 600ms ease-out' }}
      />
      {index === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-ink-2">
          <ProgressRing value={progress} size={36} showLabel />
          <span className="text-[11px] font-medium">{progress < 0.02 ? 'In queue…' : 'Rendering…'}</span>
        </div>
      )}
    </div>
  );
}

function FailedPanel({ generation, onRetry, onRemove }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-danger/40 bg-danger-soft/50 p-5 sm:flex-row sm:items-center"
    >
      <CircleAlert aria-hidden className="size-5 shrink-0 text-danger" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">This render didn’t finish</p>
        <p className="mt-0.5 text-[13px] text-ink-2">{generation.error ?? 'Something went wrong.'} No credits were used.</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => onRemove(generation)}>
          Dismiss
        </Button>
        <Button size="sm" variant="primary" icon={RotateCcw} onClick={() => onRetry(generation.id)}>
          Try again
        </Button>
      </div>
    </div>
  );
}
