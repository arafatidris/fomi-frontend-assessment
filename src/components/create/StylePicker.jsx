'use client';

import Image from 'next/image';
import { Ban, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useCatalog } from './CatalogContext';
import { useComposer } from './CreateProvider';

/** Visual style presets as a radio group of thumbnails. */
export function StylePicker() {
  const { styles } = useCatalog();
  const { composer, updateComposer } = useComposer();

  const onKeyDown = (event) => {
    const ids = [null, ...styles.map((style) => style.id)];
    const index = ids.indexOf(composer.styleId);
    const step = { ArrowRight: 1, ArrowDown: 3, ArrowLeft: -1, ArrowUp: -3 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = Math.min(ids.length - 1, Math.max(0, index + step));
    updateComposer({ styleId: ids[next] });
    event.currentTarget.querySelectorAll('[role="radio"]')[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label="Style" onKeyDown={onKeyDown} className="grid grid-cols-3 gap-2 px-1 pb-1 pt-3">
      <StyleTile label="None" selected={composer.styleId === null} onSelect={() => updateComposer({ styleId: null })}>
        <span className="flex size-full items-center justify-center bg-surface text-ink-3">
          <Ban aria-hidden className="size-5" />
        </span>
      </StyleTile>
      {styles.map((style) => (
        <StyleTile
          key={style.id}
          label={style.label}
          selected={composer.styleId === style.id}
          onSelect={() => updateComposer({ styleId: style.id })}
        >
          <Image
            src={style.thumb.src}
            alt=""
            fill
            sizes="96px"
            quality={60}
            placeholder="blur"
            blurDataURL={style.thumb.blurDataURL}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        </StyleTile>
      ))}
    </div>
  );
}

function StyleTile({ label, selected, onSelect, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      className="group flex flex-col items-center gap-1 rounded-xl text-center outline-offset-2"
    >
      <span
        className={cn(
          'relative aspect-square w-full overflow-hidden rounded-xl ring-1 ring-line transition-[box-shadow,transform] duration-200 group-active:scale-95',
          selected && 'ring-2 ring-accent-solid',
        )}
      >
        {children}
        {selected && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-accent-solid text-on-accent">
            <Check aria-hidden className="size-3" strokeWidth={3} />
          </span>
        )}
      </span>
      <span className={cn('text-[11px] leading-tight', selected ? 'font-semibold text-ink' : 'text-ink-2')}>{label}</span>
    </button>
  );
}
