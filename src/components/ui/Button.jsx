'use client';

import { cn } from '@/lib/utils/cn';
import { Spinner } from './Spinner';

const VARIANTS = {
  primary:
    'bg-accent-solid text-on-accent shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(0_0_0/0.12)] hover:bg-accent-solid-hover',
  secondary: 'bg-surface text-ink border border-line hover:border-line-strong hover:bg-surface-2 shadow-card',
  ghost: 'text-ink-2 hover:text-ink hover:bg-panel-2/60',
  subtle: 'bg-panel-2/70 text-ink hover:bg-panel-2',
  danger: 'bg-danger-soft text-danger hover:brightness-95',
};

const SIZES = {
  xs: 'h-7 gap-1.5 rounded-full px-2.5 text-xs',
  sm: 'h-8 gap-1.5 rounded-full px-3 text-[13px]',
  md: 'h-9 gap-2 rounded-full px-4 text-sm',
  lg: 'h-11 gap-2 rounded-full px-5 text-[15px]',
};

/**
 * The one button. Variants cover every surface; press feedback (a subtle
 * scale) and a loading state that keeps the label width stable are built in.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center font-medium whitespace-nowrap',
        'transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-150 ease-out',
        'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Spinner className="size-4" />
      ) : (
        Icon && <Icon aria-hidden className={size === 'xs' ? 'size-3.5' : 'size-4'} strokeWidth={2} />
      )}
      {children}
      {IconRight && <IconRight aria-hidden className="size-4 opacity-70" strokeWidth={2} />}
    </button>
  );
}
