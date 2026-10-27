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
        'flex flex-col items-center justify-center rounded-xl border border-danger-200 bg-danger-50 text-center',
        size === 'compact' ? 'gap-2 px-4 py-8' : 'gap-3 px-6 py-12 sm:py-16',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-danger-100 text-danger-700',
          size === 'compact' ? 'h-10 w-10' : 'h-14 w-14'
        )}
        aria-hidden="true"
      >
        <AlertTriangle className={size === 'compact' ? 'h-5 w-5' : 'h-6 w-6'} />
      </div>
      <h3 className="text-balance font-heading text-h3 text-danger-900">{title}</h3>
      {description && <p className="max-w-md text-body-sm text-danger-800 sm:text-body">{description}</p>}
      {(onRetry || fallbackHref) && (
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-danger-600 px-4 py-2 text-label text-white transition-colors hover:bg-danger-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-600 focus-visible:ring-offset-2"
            >
              <RotateCw className="h-4 w-4" aria-hidden="true" />
              {retryLabel}
            </button>
          )}
          {fallbackHref && (
            <a
              href={fallbackHref}
              className="inline-flex min-h-11 items-center rounded-lg border border-danger-300 px-4 py-2 text-label text-danger-800 transition-colors hover:bg-danger-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-600 focus-visible:ring-offset-2"
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
