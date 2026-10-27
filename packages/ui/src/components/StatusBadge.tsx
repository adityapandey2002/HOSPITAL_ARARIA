import * as React from 'react';
import { cn } from '@dh-araria/shared/utils';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'critical';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
  label: React.ReactNode;
  /** Optional leading icon. When provided it replaces the tone dot. */
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
}

/**
 * Status is never conveyed by colour alone: every badge carries a label and a
 * dot/icon, and the label is part of the accessible name (DESIGN_SYSTEM §3).
 */
const TONES: Record<StatusTone, { wrap: string; dot: string }> = {
  neutral: { wrap: 'bg-surface-container text-on-surface-variant', dot: 'bg-outline' },
  info: { wrap: 'bg-primary-50 text-primary-800', dot: 'bg-primary-600' },
  success: { wrap: 'bg-success-50 text-success-700', dot: 'bg-success-600' },
  warning: { wrap: 'bg-warning-50 text-warning-800', dot: 'bg-warning-500' },
  critical: { wrap: 'bg-danger-50 text-danger-700', dot: 'bg-danger-600' },
};

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, tone = 'neutral', label, icon, size = 'sm', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full font-semibold',
        size === 'sm' ? 'px-2.5 py-1 text-label-sm' : 'px-3 py-1.5 text-label',
        TONES[tone].wrap,
        className
      )}
      {...props}
    >
      {icon ? (
        <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5" aria-hidden="true">
          {icon}
        </span>
      ) : (
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TONES[tone].dot)} aria-hidden="true" />
      )}
      <span className="truncate">{label}</span>
    </span>
  )
);

StatusBadge.displayName = 'StatusBadge';

export { StatusBadge };
