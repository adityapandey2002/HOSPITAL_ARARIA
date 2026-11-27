import * as React from 'react';
import { cn } from '@dh-araria/shared/utils';
import { AlertTriangle, RotateCw } from 'lucide-react';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  fallbackHref?: string;
  fallbackLabel?: string;
  size?: 'compact' | 'default';
}

/**
 * The visible half of the "never swallow errors" rule: pages show this instead
 * of silently rendering an empty list when a request fails.
 */
const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  (
    {
      className,
      title = 'Something went wrong',
      description = 'We could not load this information. Please try again.',
      onRetry,
      retryLabel = 'Try again',
      fallbackHref,
      fallbackLabel = 'Go back to safety',
      size = 'default',
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-outline-variant bg-surface-low text-center',
        size === 'compact' ? 'gap-2 px-4 py-6' : 'gap-2.5 px-6 py-8 sm:py-10',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-primary-50 text-primary-700',
          size === 'compact' ? 'h-10 w-10' : 'h-12 w-12'
        )}
        aria-hidden="true"
      >
        <AlertTriangle className={size === 'compact' ? 'h-5 w-5' : 'h-5 w-5'} />
      </div>
      <h3 className="text-balance font-heading text-h3 text-on-surface">{title}</h3>
      {description && (
        <p className="max-w-md text-body-sm text-on-surface-variant sm:text-body">{description}</p>
      )}
      {(onRetry || fallbackHref) && (
        <div className="mt-2 flex flex-wrap justify-center gap-2.5">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-label text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            >
              <RotateCw className="h-4 w-4" aria-hidden="true" />
              {retryLabel}
            </button>
          )}
          {fallbackHref && (
            <a
              href={fallbackHref}
              className="inline-flex min-h-10 items-center rounded-lg border border-outline-variant bg-card px-4 py-2 text-label text-on-surface transition-colors hover:bg-surface-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            >
              {fallbackLabel}
            </a>
          )}
        </div>
      )}
    </div>
  )
);

ErrorState.displayName = 'ErrorState';

export { ErrorState };
