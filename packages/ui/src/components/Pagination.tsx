'use client';

import * as React from 'react';
import { cn } from '@dh-araria/shared/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Number of numbered buttons shown around the current page. */
  siblings?: number;
  /** Hides the whole control when there is only one page. */
  hideWhenSingle?: boolean;
}

/** Returns the page numbers to render, using `'ellipsis'` for gaps. */
export function getPaginationRange(
  page: number,
  pageCount: number,
  siblings = 1
): Array<number | 'ellipsis'> {
  const totalSlots = siblings * 2 + 5;
  if (pageCount <= totalSlots) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, pageCount);
  const showLeftEllipsis = left > 2;
  const showRightEllipsis = right < pageCount - 1;

  const range: Array<number | 'ellipsis'> = [1];
  if (showLeftEllipsis) range.push('ellipsis');

  for (let candidate = Math.max(left, 2); candidate <= Math.min(right, pageCount - 1); candidate++) {
    range.push(candidate);
  }

  if (showRightEllipsis) range.push('ellipsis');
  range.push(pageCount);

  return range;
}

const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  ({ className, page, pageCount, onPageChange, siblings = 1, hideWhenSingle = true, ...props }, ref) => {
    if (pageCount <= 1 && hideWhenSingle) return null;

    const safePage = Math.min(Math.max(page, 1), Math.max(pageCount, 1));
    const range = getPaginationRange(safePage, Math.max(pageCount, 1), siblings);
    const itemClass =
      'inline-flex h-11 min-w-11 items-center justify-center rounded-lg px-3 text-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40';

    return (
      <nav
        ref={ref}
        aria-label="Pagination"
        className={cn('flex flex-wrap items-center justify-center gap-1.5', className)}
        {...props}
      >
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className={cn(itemClass, 'gap-1 border border-outline-variant text-on-surface hover:bg-surface-container')}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {range.map((entry, index) =>
          entry === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-11 w-8 items-center justify-center text-on-surface-variant"
              aria-hidden="true"
            >
              &hellip;
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-label={`Page ${entry}`}
              aria-current={entry === safePage ? 'page' : undefined}
              className={cn(
                itemClass,
                entry === safePage
                  ? 'bg-primary-600 text-white'
                  : 'border border-transparent text-on-surface hover:bg-surface-container'
              )}
            >
              {entry}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= pageCount}
          className={cn(itemClass, 'gap-1 border border-outline-variant text-on-surface hover:bg-surface-container')}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </nav>
    );
  }
);

Pagination.displayName = 'Pagination';

export { Pagination };
