'use client';

import { memo, useRef, useState } from 'react';
import Image from 'next/image';
import { Download, Heart, Play } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/utils/cn';
import { formatDuration, truncate } from '@/lib/utils/format';

/**
 * One output in the feed. The whole tile is a button that opens the viewer;
 * quick actions float above it. Videos show their poster and only fetch and
 * play the clip while hovered (or focused), so the feed stays light.
 */
export const MediaTile = memo(function MediaTile({
  generation,
  output,
  index,
  aspect,
  sizes,
  eager = false,
  priority = false,
  fresh = false,
  favorite = false,
  onOpen,
  onToggleFavorite,
}) {
  const isVideo = generation.type === 'video';
  const [previewing, setPreviewing] = useState(false);
  const videoRef = useRef(null);
  const total = generation.outputs.length;
  const description = truncate(generation.prompt, 110);

  return (
    <div
      className={cn('group/tile relative isolate overflow-hidden rounded-xl bg-panel-2', fresh && 'animate-develop')}
      style={{ aspectRatio: aspect, animationDelay: fresh ? `${index * 140}ms` : undefined }}
      onPointerEnter={(event) => isVideo && event.pointerType === 'mouse' && setPreviewing(true)}
      onPointerLeave={() => setPreviewing(false)}
    >
      <button
        type="button"
        onClick={() => onOpen(generation, index)}
        onFocus={(event) => isVideo && event.target.matches(':focus-visible') && setPreviewing(true)}
        onBlur={() => setPreviewing(false)}
        aria-label={`${isVideo ? 'Play video' : `Open image ${index + 1} of ${total}`}: ${description}`}
        className="absolute inset-0 rounded-xl focus-visible:-outline-offset-2"
      >
        <Image
          src={output.poster ?? output.src}
          alt={description}
          fill
          sizes={sizes}
          placeholder="blur"
          blurDataURL={output.blurDataURL}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          className="object-cover transition-transform duration-700 ease-out group-hover/tile:scale-[1.035]"
        />
        {isVideo && previewing && (
          <video
            ref={videoRef}
            src={output.src}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            aria-hidden
            onLoadedData={() => videoRef.current?.classList.remove('opacity-0')}
            className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-300"
          />
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/45 via-black/0 to-black/25 opacity-0 transition-opacity duration-300 group-focus-within/tile:opacity-100 group-hover/tile:opacity-100"
        />
      </button>

      {isVideo && (
        <span className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
          <Play aria-hidden className="size-3 fill-current" />
          {formatDuration(output.duration ?? 5)}
        </span>
      )}

      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity duration-200 group-focus-within/tile:opacity-100 group-hover/tile:opacity-100">
        <IconButton
          label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          icon={Heart}
          variant="overlay"
          size="xs"
          aria-pressed={favorite}
          iconClassName={cn('transition-transform duration-300 ease-spring', favorite && 'scale-110 fill-[#ff8a75] text-[#ff8a75]')}
          onClick={() => onToggleFavorite(output.id)}
        />
        <a
          href={output.src}
          download
          aria-label="Download"
          className="inline-flex size-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-[background-color,transform] duration-150 hover:bg-black/65 active:scale-90"
        >
          <Download aria-hidden className="size-3.5" />
        </a>
      </div>
    </div>
  );
});
