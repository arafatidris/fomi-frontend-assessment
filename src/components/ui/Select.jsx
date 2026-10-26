'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Popover } from './Popover';

/**
 * Accessible single-select (WAI-ARIA listbox pattern).
 * Keyboard: ↑/↓ open and move, Home/End, type to jump, Enter/Space to choose,
 * Esc or Tab to close. Focus returns to the trigger when it closes.
 *
 * options: [{ value, label, description?, icon?: Component }]
 */
export function Select({
  label,
  value,
  options,
  onChange,
  renderValue,
  placement = 'bottom-start',
  className,
  menuClassName,
  disabled,
}) {
  const id = useId();
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const typeahead = useRef({ text: '', timer: null });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selected = options[selectedIndex];

  const handleOpenChange = useCallback(
    (next) => {
      setOpen(next);
      if (next) {
        setActive(selectedIndex);
        requestAnimationFrame(() => listRef.current?.focus({ preventScroll: true }));
      } else if (listRef.current?.contains(document.activeElement)) {
        triggerRef.current?.focus();
      }
    },
    [selectedIndex],
  );

  const choose = (index) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const move = (index) => {
    const next = (index + options.length) % options.length;
    setActive(next);
    listRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: 'nearest' });
  };

  const onListKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move(active + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        move(active - 1);
        break;
      case 'Home':
        event.preventDefault();
        move(0);
        break;
      case 'End':
        event.preventDefault();
        move(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        choose(active);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) {
          const state = typeahead.current;
          clearTimeout(state.timer);
          state.text += event.key.toLowerCase();
          state.timer = setTimeout(() => (state.text = ''), 600);
          const match = options.findIndex((option) => String(option.label).toLowerCase().startsWith(state.text));
          if (match >= 0) move(match);
        }
    }
  };

  const onTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      handleOpenChange(true);
    }
  };

  const listboxId = `${id}-listbox`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        popoverTarget={listboxId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={`${label}: ${selected?.label ?? ''}`}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          'group inline-flex h-8 min-w-0 items-center gap-1 rounded-full border border-line bg-surface pl-2.5 pr-1.5 text-xs text-ink shadow-card',
          'transition-[border-color,background-color,transform] duration-150 hover:border-line-strong active:scale-[0.97]',
          'aria-expanded:border-line-strong aria-expanded:bg-surface-2 disabled:opacity-50',
          className,
        )}
      >
        <span className="truncate">{renderValue ? renderValue(selected) : selected?.label}</span>
        <ChevronDown
          aria-hidden
          className="size-3.5 shrink-0 text-ink-3 transition-transform duration-200 group-aria-expanded:rotate-180"
        />
      </button>

      <Popover
        id={listboxId}
        anchorRef={triggerRef}
        open={open}
        onOpenChange={handleOpenChange}
        placement={placement}
        className={cn('min-w-44', menuClassName)}
      >
        <div
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={active >= 0 ? `${id}-option-${active}` : undefined}
          onKeyDown={onListKeyDown}
          className="outline-none"
        >
          {open && options.map((option, index) => {
            const isSelected = option.value === value;
            const Icon = option.icon;
            return (
              <div
                key={option.value}
                id={`${id}-option-${index}`}
                data-index={index}
                role="option"
                aria-selected={isSelected}
                onPointerMove={() => active !== index && setActive(index)}
                onClick={() => choose(index)}
                className={cn(
                  'flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] text-ink',
                  index === active && 'bg-panel-2/70',
                )}
              >
                {Icon && <Icon aria-hidden className="size-4 shrink-0 text-ink-2" />}
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate', isSelected && 'font-semibold')}>{option.label}</span>
                  {option.description && <span className="mt-0.5 block text-xs text-ink-3">{option.description}</span>}
                </span>
                <Check aria-hidden className={cn('size-4 shrink-0 text-accent-ink', !isSelected && 'invisible')} />
              </div>
            );
          })}
        </div>
      </Popover>
    </>
  );
}
