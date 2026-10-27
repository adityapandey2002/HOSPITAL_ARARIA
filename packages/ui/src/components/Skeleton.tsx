import * as React from 'react';
import { cn } from '@dh-araria/shared/utils';

export type SkeletonVariant = 'text' | 'title' | 'rect' | 'circle';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  /** Number of text lines. Ignored for `rect` and `circle`. */
  lines?: number;
  /** Width override, e.g. `w-2/3`. */
  widthClassName?: string;
}

const VARIANTS: Record<SkeletonVariant, string> = {
  text: 'h-4 rounded',
  title: 'h-7 rounded',
  rect: 'h-32 rounded-lg',
  circle: 'h-12 w-12 rounded-full',
};

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', lines = 1, widthClassName, ...props }, ref) => {
    if (variant === 'text' && lines > 1) {
      return (
        <div ref={ref} className={cn('space-y-2', className)} aria-hidden="true" {...props}>
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(
                'animate-pulse bg-surface-container motion-reduce:animate-none',
                VARIANTS.text,
                index === lines - 1 ? 'w-2/3' : 'w-full'
              )}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse bg-surface-container motion-reduce:animate-none',
          VARIANTS[variant],
          widthClassName,
          className
        )}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * Announces a loading region to assistive tech while the skeletons stay
 * decorative. Wrap any group of `Skeleton`s in this.
 */
export function SkeletonRegion({
  label = 'Loading',
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className} role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export { Skeleton };
