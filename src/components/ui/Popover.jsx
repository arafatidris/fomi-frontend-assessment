'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { placeFloating } from '@/lib/utils/position';
import { cn } from '@/lib/utils/cn';

/**
 * Floating layer built on the native Popover API: it renders in the browser's
 * top layer (no z-index or overflow clipping issues) and gets light-dismiss
 * and Escape handling for free. Pair the trigger with `popoverTarget={id}` so
 * the browser also handles toggling; `onOpenChange` mirrors the real state.
 */
export function Popover({
  id,
  anchorRef,
  open,
  onOpenChange,
  placement = 'bottom-start',
  offset = 8,
  matchWidth = false,
  className,
  children,
  ...props
}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    const onToggle = (event) => onOpenChange?.(event.newState === 'open');
    element.addEventListener('toggle', onToggle);
    return () => element.removeEventListener('toggle', onToggle);
  }, [onOpenChange]);

  // Controlled open state (for keyboard shortcuts and programmatic opening).
  useLayoutEffect(() => {
    const element = ref.current;
    const isOpen = element.matches(':popover-open');
    if (open && !isOpen) element.showPopover();
    if (!open && isOpen) element.hidePopover();
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) return;
    const update = () => placeFloating(anchorRef.current, ref.current, { placement, offset, matchWidth });
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, anchorRef, placement, offset, matchWidth]);

  // When a hidden route (React Activity) unmounts effects, close transient UI.
  useLayoutEffect(() => {
    const element = ref.current;
    return () => {
      if (element?.matches(':popover-open')) element.hidePopover();
    };
  }, []);

  return (
    <div
      ref={ref}
      id={id}
      popover="auto"
      className={cn(
        'fixed m-0 overflow-auto rounded-2xl border border-line bg-surface p-1.5 text-ink shadow-pop outline-none',
        'origin-top scale-[0.97] opacity-0 transition-[opacity,scale,overlay,display] transition-discrete duration-150 ease-out',
        'data-[side=top]:origin-bottom open:scale-100 open:opacity-100 starting:open:scale-[0.97] starting:open:opacity-0',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
