import * as React from 'react';
import { cn } from '@dh-araria/shared/utils';

/**
 * Width tracks from docs/plans/ui-redesign-design-contract.md §4.
 *
 * - `prose`   long-form legal/help copy, capped at 72 characters
 * - `content` single-column forms and narrow reading layouts
 * - `wide`    the default public page track (1280 → 1440 at 2xl)
 * - `admin`   dashboards, capped at 1600 so tables do not stretch
 * - `full`    full-bleed bands; add your own gutters
 */
export type ContainerSize = 'prose' | 'content' | 'wide' | 'admin' | 'full';

export type ContainerElement = 'div' | 'section' | 'article' | 'main' | 'header' | 'footer' | 'nav';

export interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  size?: ContainerSize;
  as?: ContainerElement;
}

const CONTAINER_SIZES: Record<ContainerSize, string> = {
  prose: 'max-w-[72ch]',
  content: 'max-w-3xl',
  wide: 'max-w-7xl 2xl:max-w-[90rem]',
  admin: 'max-w-[100rem]',
  full: 'max-w-none',
};

const Container = React.forwardRef<HTMLElement, ContainerProps>(
  ({ className, size = 'wide', as: Tag = 'div', children, ...props }, ref) => (
    <Tag
      // The generic ref is narrowed by the caller; the DOM node is correct at runtime.
      ref={ref as React.Ref<never>}
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        CONTAINER_SIZES[size],
        size !== 'full' && 'min-w-0',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  )
);

Container.displayName = 'Container';

export { Container };
