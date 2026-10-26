'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { cn } from '@/lib/utils/cn';

const VARIANTS = {
  center:
    'm-auto w-[min(100%-2rem,var(--dialog-width,40rem))] max-h-[min(100%-2rem,52rem)] rounded-3xl translate-y-2 open:translate-y-0 starting:open:translate-y-2',
  sheet:
    'mb-0 mt-auto w-full max-w-none max-h-[88dvh] rounded-t-3xl translate-y-full open:translate-y-0 starting:open:translate-y-full sm:m-auto sm:w-[min(100%-2rem,var(--dialog-width,40rem))] sm:rounded-3xl sm:translate-y-2 sm:open:translate-y-0 sm:starting:open:translate-y-2',
  fullscreen: 'm-0 h-dvh w-dvw max-h-none max-w-none rounded-none',
  drawer:
    'ml-auto mr-0 h-dvh max-h-none w-[min(100%,var(--dialog-width,28rem))] rounded-none translate-x-8 open:translate-x-0 starting:open:translate-x-8',
};

/**
 * Modal built on the native <dialog>: real focus trapping, inert background,
 * Escape handling and focus restoration come from the platform. Enter/exit
 * animations are pure CSS (@starting-style + allow-discrete transitions).
 */
export function Dialog({ open, onClose, label, labelledBy, variant = 'center', className, children, ...props }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Hidden routes (React Activity) clean up effects: never leave a modal open.
  useEffect(() => {
    const dialog = ref.current;
    return () => dialog?.open && dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => event.target === ref.current && onClose()}
      className={cn(
        'overflow-hidden bg-surface p-0 text-ink shadow-pop outline-none',
        'opacity-0 open:opacity-100 starting:open:opacity-0',
        'transition-[opacity,translate,display,overlay] transition-discrete duration-250 ease-out',
        'backdrop:bg-scrim backdrop:opacity-0 open:backdrop:opacity-100 starting:open:backdrop:opacity-0',
        'backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete backdrop:duration-250',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </dialog>
  );
}
