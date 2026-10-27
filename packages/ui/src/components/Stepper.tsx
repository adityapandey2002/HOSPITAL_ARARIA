import * as React from 'react';
import { cn } from '@dh-araria/shared/utils';
import { Check } from 'lucide-react';

export interface Step {
  label: string;
  description?: string;
}

export interface StepperProps extends React.HTMLAttributes<HTMLOListElement> {
  steps: Step[];
  /** 1-based index of the active step. */
  current: number;
  /** Compact mode collapses labels to "Step 2 of 4" below `sm`. */
  compact?: boolean;
}

const Stepper = React.forwardRef<HTMLOListElement, StepperProps>(
  ({ className, steps, current, compact = false, ...props }, ref) => {
    const safeCurrent = Math.min(Math.max(current, 1), steps.length);
    const currentStep = steps[safeCurrent - 1];

    return (
      <div className={className}>
        <p className="text-label-sm text-on-surface-variant sm:hidden">
          Step {safeCurrent} of {steps.length}
          {compact && currentStep ? ` · ${currentStep.label}` : ''}
        </p>

        <ol ref={ref} className="mt-2 flex items-start gap-2 sm:mt-0" {...props}>
          {steps.map((step, index) => {
            const number = index + 1;
            const state = number < safeCurrent ? 'complete' : number === safeCurrent ? 'current' : 'upcoming';

            return (
              <li key={step.label} className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-label-sm',
                      state === 'complete' && 'bg-primary-600 text-white',
                      state === 'current' && 'border-2 border-primary-600 bg-card text-primary-700',
                      state === 'upcoming' && 'border border-outline-variant bg-card text-on-surface-variant'
                    )}
                    aria-hidden="true"
                  >
                    {state === 'complete' ? <Check className="h-4 w-4" /> : number}
                  </span>
                  <span
                    className={cn(
                      'hidden truncate text-label sm:block',
                      state === 'upcoming' ? 'text-on-surface-variant' : 'text-on-surface'
                    )}
                    aria-current={state === 'current' ? 'step' : undefined}
                  >
                    {step.label}
                  </span>
                  <span className="sr-only">
                    Step {number} of {steps.length}: {step.label}
                    {state === 'complete' ? ' (complete)' : state === 'current' ? ' (current)' : ''}
                  </span>
                </div>
                <span
                  className={cn(
                    'h-1 rounded-full',
                    state === 'upcoming' ? 'bg-surface-high' : 'bg-primary-600'
                  )}
                  aria-hidden="true"
                />
              </li>
            );
          })}
        </ol>
      </div>
    );
  }
);

Stepper.displayName = 'Stepper';

export { Stepper };
