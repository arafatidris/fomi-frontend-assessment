'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Popover } from './Popover';
import { Kbd } from './Kbd';

/**
 * Action menu (WAI-ARIA menu pattern) opened from any trigger.
 * `trigger` is a render function receiving the props the button needs.
 *
 * items: [{ label, icon?, onSelect?, href?, shortcut?, tone?: 'danger', separator? }]
 */
export function Menu({ label, items, trigger, placement = 'bottom-end', header, className }) {
  const id = useId();
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const actionable = items.filter((item) => !item.separator);

  const handleOpenChange = useCallback((next) => {
    setOpen(next);
    if (next) {
      setActive(0);
      requestAnimationFrame(() => listRef.current?.focus({ preventScroll: true }));
    } else if (listRef.current?.contains(document.activeElement)) {
      triggerRef.current?.focus();
    }
  }, []);

  const run = (item) => {
    setOpen(false);
    triggerRef.current?.focus();
    if (item.href) window.open(item.href, item.external ? '_blank' : '_self', 'noopener');
    item.onSelect?.();
  };

  const onKeyDown = (event) => {
    const count = actionable.length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (index + 1) % count);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (index - 1 + count) % count);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActive(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActive(count - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      run(actionable[active]);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  const menuId = `${id}-menu`;
  // Keyboard position of each item, skipping separators.
  const positions = items.reduce(
    (list, item) => [...list, item.separator ? -1 : list.filter((position) => position >= 0).length],
    [],
  );

  return (
    <>
      {trigger({
        ref: triggerRef,
        popoverTarget: menuId,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': menuId,
        onKeyDown: (event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            handleOpenChange(true);
          }
        },
      })}
      <Popover
        id={menuId}
        anchorRef={triggerRef}
        open={open}
        onOpenChange={handleOpenChange}
        placement={placement}
        className={cn('min-w-56', className)}
      >
        {header}
        <div
          ref={listRef}
          role="menu"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${id}-item-${active}`}
          onKeyDown={onKeyDown}
          className="outline-none"
        >
          {open && items.map((item, index) => {
            if (item.separator) return <div key={`sep-${index}`} role="separator" className="mx-2 my-1 h-px bg-line" />;
            const position = positions[index];
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                id={`${id}-item-${position}`}
                role="menuitem"
                onPointerMove={() => active !== position && setActive(position)}
                onClick={() => run(item)}
                className={cn(
                  'flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px]',
                  item.tone === 'danger' ? 'text-danger' : 'text-ink',
                  position === active && 'bg-panel-2/70',
                )}
              >
                {Icon && <Icon aria-hidden className={cn('size-4 shrink-0', item.tone === 'danger' ? '' : 'text-ink-2')} />}
                <span className="flex-1 truncate">{item.label}</span>
                {item.shortcut && <Kbd>{item.shortcut}</Kbd>}
              </div>
            );
          })}
        </div>
      </Popover>
    </>
  );
}
