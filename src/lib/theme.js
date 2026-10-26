import { flushSync } from 'react-dom';

const EVENT = 'fomi:theme';

export const getTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

/** Subscription for useSyncExternalStore: every theme consumer stays in sync. */
export function subscribeTheme(onChange) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

function persist(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem('fomi-theme', theme);
  } catch {
    // The choice still applies for this session.
  }
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Switches theme. With an origin point (and View Transitions support) the
 * new theme is revealed as a circle growing from that point.
 */
export function switchTheme(next, origin, onApplied) {
  const apply = () => {
    persist(next);
    onApplied?.(next);
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!origin || !document.startViewTransition || reduceMotion) return apply();

  const { x, y } = origin;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const root = document.documentElement;
  root.classList.add('theme-transition');
  const transition = document.startViewTransition(() => flushSync(apply));
  transition.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 560, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
    );
  });
  transition.finished.finally(() => root.classList.remove('theme-transition'));
}
