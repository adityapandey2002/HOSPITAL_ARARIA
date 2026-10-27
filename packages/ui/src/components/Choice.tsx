'use client';

import * as React from 'react';
import { cn } from '@dh-araria/shared/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? `checkbox-${generatedId}`;
    const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-start gap-3">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={descriptionId}
            className={cn(
              'mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-outline accent-primary-600',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            {...props}
          />
          <label htmlFor={inputId} className="cursor-pointer text-body text-on-surface">
            {label}
          </label>
        </div>
        {error && (
          <p id={`${inputId}-error`} role="alert" className="mt-1.5 pl-8 text-label-sm text-danger-700">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 pl-8 text-label-sm text-on-surface-variant">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export interface RadioCardProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

/**
 * A native radio input styled as a selectable card, so keyboard behaviour and
 * form semantics come from the platform. Wrap the group in a `<fieldset>` with
 * a `<legend>` (or `role="radiogroup"` + `aria-label`).
 */
const RadioCard = React.forwardRef<HTMLInputElement, RadioCardProps>(
  ({ className, label, description, icon, badge, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? `radio-${generatedId}`;

    return (
      <label
        htmlFor={inputId}
        className={cn(
          'group relative flex cursor-pointer items-start gap-3 rounded-xl border border-outline-variant bg-card p-4 transition-colors',
          'hover:border-primary-300 hover:bg-primary-50/40',
          'has-[:checked]:border-primary-600 has-[:checked]:bg-primary-50',
          'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-600 has-[:focus-visible]:ring-offset-2',
          'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60',
          className
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type="radio"
          className="mt-1 h-4 w-4 shrink-0 accent-primary-600"
          {...props}
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            {icon && (
              <span className="text-primary-700 [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
                {icon}
              </span>
            )}
            <span className="text-label text-on-surface">{label}</span>
            {badge}
          </span>
          {description && (
            <span className="mt-1 block text-body-sm text-on-surface-variant">{description}</span>
          )}
        </span>
      </label>
    );
  }
);

RadioCard.displayName = 'RadioCard';

export { Checkbox, RadioCard };
