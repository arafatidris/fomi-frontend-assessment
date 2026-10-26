'use client';

import { cn } from '@/lib/utils/cn';
import { Tooltip } from './Tooltip';

const VARIANTS = {
  ghost: 'text-ink-2 hover:text-ink hover:bg-panel-2/70',
  surface: 'bg-surface text-ink border border-line shadow-card hover:border-line-strong',
  overlay: 'bg-black/45 text-white backdrop-blur-md hover:bg-black/65',
  accent: 'bg-accent-solid text-on-accent hover:bg-accent-solid-hover',
};

const SIZES = { xs: 'size-7', sm: 'size-8', md: 'size-9', lg: 'size-11' };

/**
 * Icon-only button. `label` is required: it becomes the accessible name and
 * the tooltip, so no icon button can ship unlabeled.
 */
export function IconButton({
  label,
  icon: Icon,
  shortcut,
  tooltip = true,
  tooltipSide = 'top',
  variant = 'ghost',
  size = 'sm',
  active = false,
  className,
  iconClassName,
  type = 'button',
  ...props
}) {
  const button = (
    <button
      type={type}
      aria-label={label}
      aria-pressed={props['aria-pressed']}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform,border-color] duration-150 active:scale-[0.92]',
        'disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        active && 'bg-accent-soft text-accent-ink hover:bg-accent-soft',
        className,
      )}
      {...props}
    >
      <Icon aria-hidden className={cn(size === 'xs' ? 'size-3.5' : 'size-4', iconClassName)} strokeWidth={2} />
    </button>
  );

  return tooltip ? (
    <Tooltip content={label} shortcut={shortcut} side={tooltipSide}>
      {button}
    </Tooltip>
  ) : (
    button
  );
}
