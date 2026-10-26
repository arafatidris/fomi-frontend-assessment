'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';

const isTyping = (target) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/** "mod+enter", "shift+arrowleft", "p", "?" — printable keys already carry shift. */
function comboFor(event) {
  const key = event.key.toLowerCase();
  const parts = [];
  if (event.metaKey || event.ctrlKey) parts.push('mod');
  if (event.shiftKey && key.length > 1) parts.push('shift');
  parts.push(key === ' ' ? 'space' : key);
  return parts.join('+');
}

/**
 * Global keyboard shortcuts, e.g. { 'mod+k': open, p: pick, '?': help }.
 * "mod" is ⌘ on macOS and Ctrl elsewhere. Plain keys are ignored while typing
 * or while a modal/popover owns the keyboard; mod chords always fire.
 */
export function useHotkeys(bindings, { enabled = true } = {}) {
  const latest = useRef(bindings);
  useEffect(() => {
    latest.current = bindings;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event) => {
      if (event.defaultPrevented || event.isComposing) return;
      const combo = comboFor(event);
      const handler = latest.current[combo];
      if (!handler) return;
      if (!combo.startsWith('mod+')) {
        if (isTyping(event.target)) return;
        if (document.querySelector('dialog[open], :popover-open')) return;
      }
      event.preventDefault();
      handler(event);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}

const noopSubscribe = () => () => {};

/** "⌘" on Apple platforms, "Ctrl" elsewhere. Hydration-safe. */
export function useModKey() {
  return useSyncExternalStore(
    noopSubscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'),
    () => '⌘',
  );
}
