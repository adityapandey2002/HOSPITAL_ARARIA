import type { ReactNode } from 'react';
import { cn } from '@dh-araria/shared/utils';

export type PageBannerAccent = 'primary' | 'danger' | 'warning';

export interface PageBannerProps {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  accent?: PageBannerAccent;
  align?: 'center' | 'left';
  meta?: ReactNode;
  className?: string;
}

const ACCENT_BORDER: Record<PageBannerAccent, string> = {
  primary: 'border-b-primary-400',
  danger: 'border-b-danger-500',
  warning: 'border-b-warning-400',
};

const ACCENT_DOT: Record<PageBannerAccent, string> = {
  primary: 'bg-primary-300',
  danger: 'bg-danger-400',
  warning: 'bg-warning-300',
};

/**
 * Cohesive civic header banner shared across all inner public pages.
 * Uses deep-navy primary-950 with a subtle category accent line so every
 * service page feels part of one unified government healthcare portal.
 */
export function PageBanner({
  title,
  description,
  eyebrow,
  accent = 'primary',
  align = 'center',
  meta,
  className,
}: PageBannerProps) {
  const isCentered = align === 'center';

  return (
    <section
      className={cn(
        'relative overflow-hidden border-b-[3px] bg-primary-950 py-5 text-white sm:py-6',
        ACCENT_BORDER[accent],
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[length:24px_24px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-primary-600/20 blur-3xl"
      />

      <div
        className={cn(
          'container relative mx-auto px-4',
          isCentered ? 'text-center' : 'text-left'
        )}
      >
        {eyebrow && (
          <p
            className={cn(
              'mb-1.5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/75',
              isCentered && 'justify-center'
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', ACCENT_DOT[accent])} aria-hidden="true" />
            {eyebrow}
          </p>
        )}

        {meta && <div className={cn('mb-2', isCentered && 'flex justify-center')}>{meta}</div>}

        <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>

        {description && (
          <p
            className={cn(
              'mt-1.5 text-sm leading-relaxed text-white/80 sm:text-base',
              isCentered ? 'mx-auto max-w-2xl' : 'max-w-3xl'
            )}
          >
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
