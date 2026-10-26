'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Collapsible section. Height animates via grid-template-rows (no measuring),
 * and collapsed content is `inert` so it can't be tabbed into.
 */
export function Disclosure({ title, summary, defaultOpen = false, children, className, buttonClassName }) {
  const [open, setOpen] = useState(defaultOpen);
  // Content mounts on first open (less to hydrate) and stays for the close animation.
  const [mounted, setMounted] = useState(defaultOpen);
  if (open && !mounted) setMounted(true);
  const id = useId();

  return (
    <div className={className}>
      <button
        type="button"
        id={`${id}-button`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'group relative flex h-10 w-full items-center justify-center gap-2 rounded-full bg-surface px-4 text-[13px] font-medium text-ink shadow-card',
          'transition-[background-color,transform,box-shadow] duration-150 hover:bg-surface-2 active:scale-[0.98]',
          buttonClassName,
        )}
      >
        <span>{title}</span>
        {summary && <span className="max-w-[45%] truncate font-normal text-ink-2">· {summary}</span>}
        <ChevronDown
          aria-hidden
          className="absolute right-3.5 size-4 text-ink-2 transition-transform duration-300 ease-out group-aria-expanded:rotate-180"
        />
      </button>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-button`}
        className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}
      >
        <div className="min-h-0 overflow-hidden" inert={!open}>
          {mounted && children}
        </div>
      </div>
    </div>
  );
}
