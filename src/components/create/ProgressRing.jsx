import { cn } from '@/lib/utils/cn';

/** Determinate circular progress (0–1) with an optional percentage label. */
export function ProgressRing({ value = 0, size = 32, stroke = 3, showLabel = false, className }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);

  return (
    <span
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label="Render progress"
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--c-accent-solid)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      {showLabel && <span className="absolute text-[10px] font-semibold tabular text-ink-2">{percent}%</span>}
    </span>
  );
}
