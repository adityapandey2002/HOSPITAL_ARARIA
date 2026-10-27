import * as React from 'react';
import { cn } from '@dh-araria/shared/utils';
import { Container, type ContainerSize } from './Container';

export type SectionTone = 'plain' | 'surface' | 'low' | 'brand' | 'emergency';
export type SectionSpacing = 'sm' | 'md' | 'lg';

export interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** Section heading. Rendered at `h2`; pass `headingLevel={3}` when nested. */
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  eyebrow?: React.ReactNode;
  tone?: SectionTone;
  spacing?: SectionSpacing;
  headingLevel?: 2 | 3;
  containerSize?: ContainerSize;
  /** Removes the inner container, for full-bleed sliders and bands. */
  bleed?: boolean;
  id?: string;
}

const TONES: Record<SectionTone, string> = {
  plain: 'bg-surface',
  surface: 'bg-card',
  low: 'bg-surface-low',
  brand: 'bg-primary-700 text-white',
  emergency: 'bg-danger-700 text-white',
};

const SPACING: Record<SectionSpacing, string> = {
  sm: 'py-6 sm:py-8',
  md: 'py-8 sm:py-10 lg:py-12',
  lg: 'py-12 sm:py-16 lg:py-20',
};

const Section = React.forwardRef<HTMLElement, SectionProps>(
  (
    {
      className,
      title,
      description,
      action,
      eyebrow,
      tone = 'plain',
      spacing = 'md',
      headingLevel = 2,
      containerSize = 'wide',
      bleed = false,
      children,
      id,
      ...props
    },
    ref
  ) => {
    const Heading = headingLevel === 2 ? 'h2' : 'h3';
    const hasHeader = Boolean(title || description || eyebrow || action);

    return (
      <section
        ref={ref}
        id={id}
        className={cn(TONES[tone], SPACING[spacing], className)}
        {...props}
      >
        {bleed ? (
          <>
            {hasHeader && <SectionHeader {...{ title, description, action, eyebrow, Heading, tone }} />}
            {children}
          </>
        ) : (
          <Container size={containerSize}>
            {hasHeader && <SectionHeader {...{ title, description, action, eyebrow, Heading, tone }} />}
            {children}
          </Container>
        )}
      </section>
    );
  }
);

Section.displayName = 'Section';

interface SectionHeaderProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  eyebrow?: React.ReactNode;
  Heading: 'h2' | 'h3';
  tone: SectionTone;
}

function SectionHeader({ title, description, action, eyebrow, Heading, tone }: SectionHeaderProps) {
  const onBrand = tone === 'brand' || tone === 'emergency';

  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 max-w-2xl">
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
        {title && (
          <Heading
            className={cn(
              'text-balance font-heading text-h2',
              onBrand ? 'text-white' : 'text-on-surface'
            )}
          >
            {title}
          </Heading>
        )}
        {description && (
          <p
            className={cn(
              'mt-2 text-body-lg',
              onBrand ? 'text-white/85' : 'text-on-surface-variant'
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex flex-none items-center gap-3">{action}</div>}
    </div>
  );
}

export { Section };
