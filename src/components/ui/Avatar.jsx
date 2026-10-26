import { cn } from '@/lib/utils/cn';

/** Initials avatar on a warm gradient: no stock face pretending to be the user. */
export function Avatar({ initials, size = 32, className }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full before:content-[attr(data-initials)] bg-[linear-gradient(135deg,#f4a07f,#c0533b_55%,#6b2f2a)] font-semibold text-white ring-2 ring-surface',
        className,
      )}
      data-initials={initials}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    />
  );
}
