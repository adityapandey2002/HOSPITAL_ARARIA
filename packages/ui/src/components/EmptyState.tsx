import * as React from 'react';
import { cn } from '@dh-araria/shared/utils';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** `compact` for inline panels, `default` for a full section. */
  size?: 'compact' | 'default';
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, size = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-card text-center',
        size === 'compact' ? 'gap-2 px-4 py-8' : 'gap-3 px-6 py-12 sm:py-16',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant',
          size === 'compact' ? 'h-10 w-10' : 'h-14 w-14'
        )}
        aria-hidden="true"
      >
        {icon ?? <Inbox className={size === 'compact' ? 'h-5 w-5' : 'h-6 w-6'} />}
      </div>
      <h3 className="text-balance font-heading text-h3 text-on-surface">{title}</h3>
      {description && (
        <p className="max-w-md text-body-sm text-on-surface-variant sm:text-body">{description}</p>
      )}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  )
);

EmptyState.displayName = 'EmptyState';

export { EmptyState };
