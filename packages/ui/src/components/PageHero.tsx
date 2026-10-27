import * as React from 'react';
import { cn } from '@dh-araria/shared/utils';
import { Container, type ContainerSize } from './Container';

export type PageHeroTone = 'plain' | 'low' | 'brand';

export interface PageHeroProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Breadcrumb trail, rendered above the eyebrow. */
  breadcrumbs?: React.ReactNode;
  tone?: PageHeroTone;
  containerSize?: ContainerSize;
  /** Use `h2` when the hero sits inside a page that already has an `h1`. */
  headingLevel?: 1 | 2;
}

const TONES: Record<PageHeroTone, string> = {
  plain: 'bg-card text-on-surface',
  low: 'bg-surface-low text-on-surface',
  brand: 'bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 text-white',
};

const PageHero = React.forwardRef<HTMLElement, PageHeroProps>(
  (
    {
      className,
      eyebrow,
      title,
      description,
      actions,
      breadcrumbs,
      tone = 'plain',
      containerSize = 'wide',
      headingLevel = 1,
      children,
      ...props
    },
    ref
  ) => {
    const Heading = headingLevel === 1 ? 'h1' : 'h2';
    const onBrand = tone === 'brand';

    return (
      <header
        ref={ref}
        className={cn('border-b', onBrand ? 'border-primary-800' : 'border-outline-variant', TONES[tone], className)}
        {...props}
      >
        <Container size={containerSize} className="py-8 sm:py-10 lg:py-14">
          {breadcrumbs && <div className="mb-4">{breadcrumbs}</div>}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 max-w-3xl">
              {eyebrow && (
                <p
                  className={cn(
                    'mb-2 text-label-sm uppercase tracking-wider',
                    onBrand ? 'text-white/80' : 'text-primary-700'
                  )}
                >
                  {eyebrow}
                </p>
              )}
              <Heading
                className={cn(
                  'font-heading text-balance',
                  'text-[clamp(1.75rem,6vw,2.25rem)] leading-[1.18] tracking-tight sm:text-h1',
                  onBrand ? 'text-white' : 'text-on-surface'
                )}
              >
                {title}
              </Heading>
              {description && (
                <p
                  className={cn(
                    'mt-3 max-w-2xl text-body-lg',
                    onBrand ? 'text-white/85' : 'text-on-surface-variant'
                  )}
                >
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex flex-wrap items-center gap-3 lg:flex-none lg:justify-end">{actions}</div>
            )}
          </div>
          {children}
        </Container>
      </header>
    );
  }
);

PageHero.displayName = 'PageHero';

export { PageHero };
