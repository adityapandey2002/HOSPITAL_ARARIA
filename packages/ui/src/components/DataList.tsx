'use client';

import * as React from 'react';
import { cn } from '@dh-araria/shared/utils';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';
import { Skeleton } from './Skeleton';

export interface DataListColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  /** Hidden below `lg` in the table; keep the essential fields visible. */
  secondary?: boolean;
}

export interface DataListProps<T> {
  items: T[];
  columns: Array<DataListColumn<T>>;
  keyExtractor: (row: T) => string;
  /** Required: below `lg` the table is replaced by this card renderer. */
  renderCard: (row: T) => React.ReactNode;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  className?: string;
  /** Optional pagination; hidden when there is a single page. */
  pagination?: { page: number; pageCount: number; onPageChange: (page: number) => void };
  /** Adds a visible hint above the table that it scrolls horizontally. */
  scrollHint?: string;
  caption?: string;
}

export function DataList<T>({
  items,
  columns,
  keyExtractor,
  renderCard,
  loading = false,
  emptyTitle = 'Nothing to show yet',
  emptyDescription,
  emptyAction,
  className,
  pagination,
  scrollHint = 'Scroll horizontally to see every column',
  caption,
}: DataListProps<T>) {
  if (loading) {
    return (
      <div className={cn('space-y-3', className)} role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading</span>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-outline-variant bg-card p-4">
            <Skeleton variant="title" widthClassName="w-1/3" />
            <Skeleton lines={2} className="mt-3" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        className={className}
        title={emptyTitle}
        {...(emptyDescription ? { description: emptyDescription } : {})}
        {...(emptyAction ? { action: emptyAction } : {})}
      />
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Phones and tablets: cards. */}
      <ul className="space-y-3 lg:hidden">
        {items.map((row) => (
          <li key={keyExtractor(row)}>{renderCard(row)}</li>
        ))}
      </ul>

      {/* Desktop: table with an internal scroll container. */}
      <div className="hidden lg:block">
        <p className="mb-2 text-label-sm text-on-surface-variant">{scrollHint}</p>
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-card">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead className="bg-surface-high">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      'whitespace-nowrap px-4 py-3 text-label-sm uppercase tracking-wide text-on-surface-variant',
                      column.secondary && 'hidden xl:table-cell',
                      column.className
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {items.map((row) => (
                <tr key={keyExtractor(row)} className="transition-colors hover:bg-surface-low">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 py-3 align-top text-body-sm text-on-surface',
                        column.secondary && 'hidden xl:table-cell',
                        column.className
                      )}
                    >
                      {column.render
                        ? column.render(row)
                        : String((row as Record<string, unknown>)[column.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && pagination.pageCount > 1 && (
        <Pagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
