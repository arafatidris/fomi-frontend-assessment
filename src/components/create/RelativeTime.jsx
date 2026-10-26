'use client';

import { useNow } from '@/hooks/useNow';
import { formatAge, formatRelativeTime } from '@/lib/utils/format';

/**
 * Library items carry an age in minutes (stable on the server); items created
 * in this session carry a timestamp and tick live once mounted.
 */
export function RelativeTime({ generation }) {
  const now = useNow();
  if (generation.createdAt == null) return <span>{formatAge(generation.ageMinutes ?? 0)}</span>;
  return (
    <time dateTime={new Date(generation.createdAt).toISOString()} suppressHydrationWarning>
      {formatRelativeTime(generation.createdAt, now ?? generation.createdAt)}
    </time>
  );
}
