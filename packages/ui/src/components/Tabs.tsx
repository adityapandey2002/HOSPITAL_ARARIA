'use client';

import * as React from 'react';
import { cn } from '@dh-araria/shared/utils';

export interface TabItem<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** Optional count pill, e.g. open complaints. */
  count?: number;
}

export interface TabsProps<T extends string = string> {
  items: Array<TabItem<T>>;
  value: T;
  onValueChange: (value: T) => void;
  variant?: 'underline' | 'pill';
  /** Accessible name for the tab list. */
  label: string;
  className?: string;
  /** Panel id prefix; the consumer renders `id={`${idPrefix}-panel-${value}`}`. */
  idPrefix?: string;
}

/**
 * Tab list only: the consumer owns the panels so server-rendered content is not
 * thrown away. Arrow keys, Home and End move focus per the WAI-ARIA pattern.
 */
export function Tabs<T extends string = string>({
  items,
  value,
  onValueChange,
  variant = 'underline',
  label,
  className,
  idPrefix = 'tabs',
}: TabsProps<T>) {
  const listRef = React.useRef<HTMLDivElement>(null);

  const focusTab = (index: number) => {
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[index]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>, index: number) => {
    const last = items.length - 1;
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') nextIndex = index === last ? 0 : index + 1;
    if (event.key === 'ArrowLeft') nextIndex = index === 0 ? last : index - 1;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = last;

    if (nextIndex !== null) {
      event.preventDefault();
      const next = items[nextIndex];
      if (next) {
        onValueChange(next.value);
        focusTab(nextIndex);
      }
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      className={cn(
        'flex w-full items-stretch gap-1 overflow-x-auto',
        variant === 'underline'
          ? 'border-b border-outline-variant'
          : 'rounded-lg bg-surface-low p-1',
        // Horizontal scroll must not introduce a page-level scrollbar.
        '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
    >
      {items.map((item, index) => {
        const active = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${item.value}`}
            aria-controls={`${idPrefix}-panel-${item.value}`}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap px-3 text-label transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
              variant === 'underline' &&
                cn(
                  '-mb-px border-b-2 px-3',
                  active
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-on-surface-variant hover:border-outline-variant hover:text-on-surface'
                ),
              variant === 'pill' && cn('rounded-md', active ? 'bg-card text-primary-700 shadow-sm' : 'text-on-surface-variant hover:text-on-surface')
            )}
          >
            {item.icon && (
              <span className="[&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
                {item.icon}
              </span>
            )}
            {item.label}
            {typeof item.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-label-sm',
                  active ? 'bg-primary-100 text-primary-800' : 'bg-surface-container text-on-surface-variant'
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
