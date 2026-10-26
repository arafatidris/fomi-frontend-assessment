'use client';

import { useEffect, useId, useState } from 'react';
import { Compass, Lock } from 'lucide-react';
import { Popover } from '@/components/ui/Popover';
import { Button } from '@/components/ui/Button';
import { useStudioActions } from './StudioProvider';

/**
 * Plans a sweep along one axis: Fomi suggests four values, you can rewrite
 * any of them, and the render keeps every other field and the seed fixed.
 */
export function ExplorePopover({ shotId, field, anchorRef, placement, onClose }) {
  const id = useId();
  const actions = useStudioActions();
  const [variants, setVariants] = useState(null);

  useEffect(() => {
    let cancelled = false;
    actions
      .suggest(shotId, field.key)
      .then((values) => !cancelled && setVariants(values))
      .catch(() => !cancelled && setVariants(['', '', '', '']));
    return () => {
      cancelled = true;
    };
  }, [actions, shotId, field.key]);

  const filled = (variants ?? []).map((value) => value.trim()).filter(Boolean);

  const render = (event) => {
    event.preventDefault();
    if (filled.length < 2) return;
    actions.explore(shotId, field.key, filled);
    onClose();
  };

  return (
    <Popover
      open
      onOpenChange={(open) => !open && onClose()}
      anchorRef={anchorRef}
      placement={placement}
      offset={12}
      className="w-[min(22rem,calc(100vw-2rem))] p-4"
      role="dialog"
      aria-labelledby={`${id}-title`}
    >
      <form onSubmit={render}>
        <h3 id={`${id}-title`} className="flex items-center gap-2 text-sm font-semibold">
          <Compass aria-hidden className="size-4 text-accent-ink" />
          Explore {field.label.toLowerCase()}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-2">
          <Lock aria-hidden className="size-3" />
          Everything else stays fixed, including the seed.
        </p>

        <ol className="mt-3 space-y-1.5">
          {(variants ?? Array.from({ length: 4 }, () => null)).map((value, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="w-5 shrink-0 font-mono text-xs text-ink-3">{index + 1}</span>
              {value === null ? (
                <span className="h-9 flex-1 animate-pulse rounded-lg bg-surface-2" />
              ) : (
                <input
                  aria-label={`Value ${index + 1}`}
                  value={value}
                  autoFocus={index === 0}
                  onChange={(event) =>
                    setVariants((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))
                  }
                  className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-surface-2 px-2.5 text-[13px] text-ink outline-none transition-colors focus:border-field"
                />
              )}
            </li>
          ))}
        </ol>

        <Button type="submit" variant="primary" className="mt-4 w-full rounded-lg" disabled={filled.length < 2}>
          Render {filled.length || 4}-take sweep
        </Button>
      </form>
    </Popover>
  );
}
