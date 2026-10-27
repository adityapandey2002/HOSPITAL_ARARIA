'use client';

import * as React from 'react';
import { forwardRef } from 'react';
import { cn } from '@dh-araria/shared/utils';

export type CardVariant = 'default' | 'outlined' | 'elevated' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  /** Adds hover elevation and a pointer cursor; pair with a link or button. */
  interactive?: boolean;
}

const CARD_VARIANTS: Record<CardVariant, string> = {
  default: 'bg-card border border-outline-variant',
  outlined: 'bg-card border-2 border-outline-variant',
  elevated: 'bg-card shadow-md',
  flat: 'bg-surface-low',
};

const CARD_PADDINGS: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', interactive, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl transition-[box-shadow,border-color,transform] duration-200',
        CARD_VARIANTS[variant],
        CARD_PADDINGS[padding],
        interactive &&
          'cursor-pointer hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md motion-reduce:hover:translate-y-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4 flex items-start justify-between gap-3', className)} {...props}>
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-h3 font-heading text-on-surface', className)} {...props}>
      {children}
    </h3>
  )
);

CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={cn('mt-1 text-body-sm text-on-surface-variant', className)} {...props}>
      {children}
    </p>
  )
);

CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('min-w-0', className)} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-4 flex flex-wrap items-center gap-2 border-t border-outline-variant pt-4', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
