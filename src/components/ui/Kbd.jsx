import { cn } from '@/lib/utils/cn';

/** Keyboard key hint. Pass several children for chords: <Kbd>⌘</Kbd><Kbd>K</Kbd>. */
export function Kbd({ children, className }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-line-strong bg-surface-2 px-1',
        'font-sans text-[11px] font-medium leading-none text-ink-2 shadow-[0_1px_0_var(--c-line-strong)]',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
