import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

/** Fomi's heavy "F" mark, drawn as one path so it stays crisp at any size. */
export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 24 28" aria-hidden className={cn('h-7 w-6', className)} fill="currentColor">
      <path d="M4.6 2h15.9C21.3 2 22 2.7 22 3.5v4C22 8.3 21.3 9 20.5 9H10.4v3.6h7.1c.8 0 1.5.7 1.5 1.5v3.1c0 .8-.7 1.5-1.5 1.5h-7.1v5.8c0 .8-.7 1.5-1.5 1.5H4.6c-.9 0-1.6-.7-1.6-1.5V3.5C3 2.7 3.7 2 4.6 2Z" />
    </svg>
  );
}

export function Logo({ href = '/', className }) {
  return (
    <Link
      href={href}
      aria-label="Fomi home"
      className={cn('inline-flex items-center rounded-lg text-ink transition-transform duration-200 hover:scale-105 active:scale-95', className)}
    >
      <LogoMark />
    </Link>
  );
}
