import { getAspectRatio } from '@/lib/media/aspect-ratios';

/** A tiny outline of the frame shape, so ratios are recognisable at a glance. */
export function RatioIcon({ ratio, className }) {
  const value = getAspectRatio(ratio).value;
  const width = value >= 1 ? 14 : 14 * value;
  const height = value >= 1 ? 14 / value : 14;
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={className ?? 'size-4'}>
      <rect
        x={(16 - width) / 2}
        y={(16 - height) / 2}
        width={width}
        height={height}
        rx="1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
