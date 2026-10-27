'use client';

import * as React from 'react';
import { cn } from '@dh-araria/shared/utils';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the group. */
  label: string;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Two-to-four mutually exclusive view switches (e.g. Cards / Table). Rendered as
 * pressed buttons inside a labelled group, so the state is announced.
 */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  label,
  className,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex w-full rounded-lg border border-outline-variant bg-surface-low p-1 sm:w-auto',
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md px-3 font-semibold transition-colors sm:flex-none',
              size === 'sm' ? 'text-label-sm' : 'text-label',
              active
                ? 'bg-card text-primary-700 shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2'
            )}
          >
            {option.icon && (
              <span className="[&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
                {option.icon}
              </span>
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
