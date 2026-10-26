'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Radio group rendered as segments with a sliding thumb.
 * Arrow keys move the selection (roving tabindex), matching native radios.
 *
 * options: [{ value, label, icon?: Component }]
 */
export function SegmentedControl({ label, options, value, onChange, size = 'sm', className, thumbClassName }) {
  const groupRef = useRef(null);
  const index = Math.max(0, options.findIndex((option) => option.value === value));

  const select = (nextIndex) => {
    const next = (nextIndex + options.length) % options.length;
    onChange(options[next].value);
    groupRef.current?.querySelectorAll('[role="radio"]')[next]?.focus();
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      select(index + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      select(index - 1);
    }
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn('relative grid rounded-full bg-panel-2 p-1', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-1 left-1 rounded-full bg-surface shadow-card transition-transform duration-300 ease-spring motion-reduce:transition-none',
          thumbClassName,
        )}
        style={{ width: `calc((100% - 0.5rem) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((option, optionIndex) => {
        const selected = optionIndex === index;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors duration-200',
              size === 'sm' ? 'h-7 px-3 text-xs' : 'h-8 px-4 text-[13px]',
              selected ? 'text-ink' : 'text-ink-2 hover:text-ink',
            )}
          >
            {Icon && <Icon aria-hidden className="size-3.5" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
