'use client';

import * as React from 'react';
import { forwardRef } from 'react';
import { cn } from '@dh-araria/shared/utils';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'outline';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Renders a leading status dot tinted to match the variant. */
  dot?: boolean;
}

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800',
  primary: 'bg-primary-100 text-primary-800',
  secondary: 'bg-secondary-100 text-secondary-800',
  success: 'bg-success-100 text-success-800',
  warning: 'bg-warning-100 text-warning-800',
  danger: 'bg-danger-100 text-danger-800',
  outline: 'border border-gray-300 text-gray-700 bg-transparent',
};

const BADGE_DOT_COLORS: Record<BadgeVariant, string> = {
  default: 'bg-gray-500',
  primary: 'bg-primary-600',
  secondary: 'bg-secondary-600',
  success: 'bg-success-600',
  warning: 'bg-warning-600',
  danger: 'bg-danger-600',
  outline: 'bg-gray-500',
};

const BADGE_SIZES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        BADGE_VARIANTS[variant],
        BADGE_SIZES[size],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', BADGE_DOT_COLORS[variant])} />}
      {children}
    </span>
  ),
);

Badge.displayName = 'Badge';

export { Badge };