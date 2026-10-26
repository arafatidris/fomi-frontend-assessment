'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { placeFloating } from '@/lib/utils/position';
import { Kbd } from './Kbd';

/**
 * Hover/keyboard-focus tooltip rendered in a portal so scrollers never clip
 * it. It is a visual affordance only: triggers keep their own accessible name,
 * so the tooltip is hidden from assistive tech to avoid double announcements.
 * Touch input never opens it.
 */
export function Tooltip({ content, shortcut, side = 'top', delay = 450, children }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const tooltipRef = useRef(null);
  const timer = useRef(null);

  const show = (immediate) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), immediate ? 0 : delay);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  useLayoutEffect(() => {
    const trigger = wrapperRef.current?.firstElementChild;
    if (!open || !trigger || !tooltipRef.current) return;
    placeFloating(trigger, tooltipRef.current, { placement: `${side}-center`, offset: 8 });
    tooltipRef.current.dataset.ready = 'true';
  }, [open, side]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event) => event.key === 'Escape' && hide();
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', hide, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', hide, true);
    };
  }, [open]);

  if (!content) return children;

  return (
    <>
      <span
        ref={wrapperRef}
        className="contents"
        onPointerEnter={(event) => event.pointerType === 'mouse' && show(false)}
        onPointerLeave={hide}
        onPointerDown={hide}
        onFocus={(event) => event.target.matches(':focus-visible') && show(true)}
        onBlur={hide}
      >
        {children}
      </span>
      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            aria-hidden="true"
            className="pointer-events-none fixed z-1000 flex max-w-64 items-center gap-2 rounded-lg bg-[#1c1917] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-pop transition-opacity duration-150 data-[ready=true]:opacity-100"
          >
            <span>{content}</span>
            {shortcut && (
              <span className="flex gap-0.5">
                {shortcut.split(' ').map((key) => (
                  <Kbd key={key} className="border-white/20 bg-white/10 text-white/80 shadow-none">
                    {key}
                  </Kbd>
                ))}
              </span>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
