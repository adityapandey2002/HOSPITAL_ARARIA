import * as React from 'react';
import { cn } from '@dh-araria/shared/utils';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  /** Visually hides all but the last crumb on small screens. */
  collapseOnMobile?: boolean;
}

const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ className, items, collapseOnMobile = false, ...props }, ref) => {
    if (items.length === 0) return null;

    return (
      <nav ref={ref} aria-label="Breadcrumb" className={cn('text-body-sm', className)} {...props}>
        <ol className="flex flex-wrap items-center gap-1.5 text-on-surface-variant">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const hide = collapseOnMobile && !isLast && index !== items.length - 2;

            return (
              <li
                key={`${item.label}-${index}`}
                className={cn('flex min-w-0 items-center gap-1.5', hide && 'hidden sm:flex')}
              >
                {index > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-outline" aria-hidden="true" />
                )}
                {item.href && !isLast ? (
                  <a
                    href={item.href}
                    className="truncate rounded transition-colors hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span
                    className={cn('truncate', isLast && 'font-semibold text-on-surface')}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
);

Breadcrumbs.displayName = 'Breadcrumbs';

export { Breadcrumbs };
