'use client';

import { useId } from 'react';
import { Star } from 'lucide-react';
import { FEEDBACK_RATING_LABELS } from '@dh-araria/shared/constants';
import { cn } from '@dh-araria/shared/utils';

const RATINGS = [1, 2, 3, 4, 5] as const;

type RatingSize = 'sm' | 'md';

const STAR_SIZE: Record<RatingSize, string> = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
};

export interface StarRatingInputProps {
  name: string;
  legend: string;
  value: number | null;
  onChange: (value: number | null) => void;
  /** Renders a "Skip" radio and treats `null` as an explicit choice. */
  allowSkip?: boolean;
  required?: boolean;
  hint?: string;
  error?: string;
  size?: RatingSize;
}

/**
 * A native radio group styled as stars. Keeping real radio inputs means arrow
 * keys, screen-reader grouping and form semantics all work without extra JS.
 */
export function StarRatingInput({
  name,
  legend,
  value,
  onChange,
  allowSkip = false,
  required = false,
  hint,
  error,
  size = 'md',
}: StarRatingInputProps) {
  const baseId = useId();
  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  const selectionLabel =
    value !== null
      ? `${FEEDBACK_RATING_LABELS[value] ?? 'Rated'} (${value} of 5)`
      : allowSkip
        ? 'Skipped'
        : 'No rating selected';

  return (
    <fieldset
      aria-describedby={describedBy}
      className={cn(
        'rounded-xl border p-4 transition-colors',
        error ? 'border-danger-300 bg-danger-50/50' : 'border-gray-200 bg-gray-50'
      )}
    >
      <legend className="px-2 text-sm font-medium text-gray-700">
        {legend}
        {required && (
          <span className="text-danger-600" aria-hidden="true">
            {' '}
            *
          </span>
        )}
        {allowSkip && (
          <span className="ml-2 text-xs font-normal text-gray-500">
            Optional — skip if you prefer
          </span>
        )}
      </legend>

      <div className="flex flex-wrap items-center gap-1">
        {RATINGS.map((rating) => {
          const selected = value === rating;
          const filled = value !== null && rating <= value;

          return (
            <label key={rating} className="group cursor-pointer">
              <input
                type="radio"
                name={name}
                value={rating}
                checked={selected}
                onChange={() => onChange(rating)}
                required={required}
                aria-label={`${rating} of 5 stars, ${FEEDBACK_RATING_LABELS[rating]}`}
                className="peer sr-only"
              />
              <Star
                aria-hidden="true"
                className={cn(
                  STAR_SIZE[size],
                  'rounded transition-colors',
                  filled
                    ? 'fill-warning-500 text-warning-500'
                    : 'fill-transparent text-gray-300 group-hover:text-warning-500',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-1'
                )}
              />
            </label>
          );
        })}

        {allowSkip && (
          <label
            className={cn(
              'ml-2 cursor-pointer rounded-full border border-gray-300 bg-white px-3 py-1.5',
              'text-xs font-medium text-gray-600 transition-colors',
              'hover:border-gray-400 hover:text-gray-800',
              'has-[:checked]:border-primary-600 has-[:checked]:bg-primary-50 has-[:checked]:text-primary-700',
              'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-500 has-[:focus-visible]:ring-offset-1'
            )}
          >
            <input
              type="radio"
              name={name}
              value="skip"
              checked={value === null}
              onChange={() => onChange(null)}
              aria-label={`Skip ${legend.toLowerCase()} rating`}
              className="sr-only"
            />
            Skip
          </label>
        )}
      </div>

      <p className="mt-1.5 min-h-5 text-sm text-gray-600" aria-live="polite">
        {selectionLabel}
      </p>

      {hint && (
        <p id={hintId} className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-danger-600" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export interface RatingDisplayProps {
  value: number;
  className?: string;
}

/** Compact read-only stars for inbox rows. */
export function RatingDisplay({ value, className }: RatingDisplayProps) {
  const clamped = Math.min(5, Math.max(1, Math.round(value)));

  return (
    <span
      role="img"
      aria-label={`Rated ${value} out of 5, ${FEEDBACK_RATING_LABELS[clamped]}`}
      className={cn('inline-flex items-center gap-0.5', className)}
    >
      {RATINGS.map((rating) => (
        <Star
          key={rating}
          aria-hidden="true"
          className={cn(
            'h-4 w-4',
            rating <= clamped
              ? 'fill-warning-500 text-warning-500'
              : 'fill-transparent text-gray-300'
          )}
        />
      ))}
      <span className="ml-1 text-xs font-medium text-gray-600">{value}/5</span>
    </span>
  );
}
