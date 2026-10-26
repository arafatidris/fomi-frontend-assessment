import { twMerge } from 'tailwind-merge';

/**
 * Joins class names and resolves Tailwind conflicts, so a caller's
 * `className="hidden md:flex"` reliably overrides a primitive's defaults.
 */
export function cn(...classes) {
  return twMerge(classes.filter(Boolean).join(' '));
}
