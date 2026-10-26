'use client';

import { useRef, useState } from 'react';
import { ChevronsLeftRight } from 'lucide-react';

/**
 * Before/after comparison. The divider is a real slider: drag it, or focus it
 * and use the arrow keys.
 */
export function CompareSlider({ before, after, label = 'Compare original and edit' }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const fromPointer = (event) => {
    const rect = containerRef.current.getBoundingClientRect();
    setPosition(Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100)));
  };

  return (
    <div
      ref={containerRef}
      className="relative size-full touch-none select-none overflow-hidden"
      onPointerDown={(event) => {
        dragging.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        fromPointer(event);
      }}
      onPointerMove={(event) => dragging.current && fromPointer(event)}
      onPointerUp={() => (dragging.current = false)}
    >
      <div className="absolute inset-0">{before}</div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
        {after}
      </div>

      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
        Original
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
        Edit
      </span>

      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_12px_rgb(0_0_0/0.4)]" style={{ left: `${position}%` }}>
        <button
          type="button"
          role="slider"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          aria-valuetext={`${Math.round(position)}% original`}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 10 : 4;
            if (event.key === 'ArrowLeft') setPosition((value) => Math.max(0, value - step));
            else if (event.key === 'ArrowRight') setPosition((value) => Math.min(100, value + step));
            else return;
            event.preventDefault();
          }}
          className="pointer-events-auto absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white text-[#1c1917] shadow-pop transition-transform duration-150 hover:scale-105 active:scale-95"
        >
          <ChevronsLeftRight aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}
