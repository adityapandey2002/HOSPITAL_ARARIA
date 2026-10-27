import * as React from 'react';
import { cn } from '@dh-araria/shared/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';

export type StatTone = 'neutral' | 'primary' | 'success' | 'warning' | 'critical';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: StatTone;
  /**
   * Directional change. Only pass this when the number is real and comparable;
   * never invent a trend to fill the tile.
   */
  trend?: { direction: 'up' | 'down'; label: string; positive?: boolean };
}

const TONES: Record<StatTone, { icon: string; value: string }> = {
  neutral: { icon: 'bg-surface-container text-on-surface-variant', value: 'text-on-surface' },
  primary: { icon: 'bg-primary-50 text-primary-700', value: 'text-primary-800' },
  success: { icon: 'bg-success-50 text-success-700', value: 'text-success-700' },
  warning: { icon: 'bg-warning-50 text-warning-700', value: 'text-warning-800' },
  critical: { icon: 'bg-danger-50 text-danger-700', value: 'text-danger-700' },
};

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, label, value, hint, icon, tone = 'neutral', trend, ...props }, ref) => {
    const TrendIcon = trend?.direction === 'up' ? TrendingUp : TrendingDown;
    const trendPositive = trend?.positive ?? trend?.direction === 'up';

    return (
      <div
        ref={ref}
        className={cn(
          'flex min-w-0 items-start gap-3 rounded-xl border border-outline-variant bg-card p-4 shadow-sm sm:p-5',
          className
        )}
        {...props}
      >
        {icon && (
          <div
            className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', TONES[tone].icon)}
            aria-hidden="true"
          >
            <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-label-sm uppercase tracking-wide text-on-surface-variant">{label}</p>
          <p className={cn('mt-1 font-heading text-2xl font-bold leading-tight sm:text-3xl', TONES[tone].value)}>
            {value}
          </p>
          {hint && <p className="mt-1 text-body-sm text-on-surface-variant">{hint}</p>}
          {trend && (
            <p
              className={cn(
                'mt-1.5 inline-flex items-center gap-1 text-label-sm',
                trendPositive ? 'text-success-700' : 'text-danger-700'
              )}
            >
              <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {trend.label}
            </p>
          )}
        </div>
      </div>
    );
  }
);

StatCard.displayName = 'StatCard';

export { StatCard };
