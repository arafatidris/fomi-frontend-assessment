const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Compact relative time: "Just now", "12m ago", "3h ago", "Yesterday", "2w ago".
 * Pure arithmetic (no locale), so server and client always agree.
 */
export function formatElapsed(elapsed) {
  if (elapsed < MINUTE) return 'Just now';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
  if (elapsed < 2 * DAY) return 'Yesterday';
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}d ago`;
  return `${Math.floor(elapsed / (7 * DAY))}w ago`;
}

export function formatRelativeTime(timestamp, now) {
  return formatElapsed(Math.max(0, now - timestamp));
}

/** The same label from a minutes offset. */
export function formatAge(minutes) {
  return formatElapsed(minutes * MINUTE);
}

/** Groups items by calendar day relative to now: Today, Yesterday, Earlier. */
export function dayBucket(timestamp, now) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  if (timestamp >= startOfToday.getTime()) return 'Today';
  if (timestamp >= startOfToday.getTime() - DAY) return 'Yesterday';
  return 'Earlier';
}

export function formatDuration(seconds) {
  const whole = Math.round(seconds);
  return `0:${String(whole).padStart(2, '0')}`;
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Shortens long prompts for alt text and compact labels. */
export function truncate(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ') > max * 0.6 ? cut.lastIndexOf(' ') : max).trimEnd()}…`;
}
