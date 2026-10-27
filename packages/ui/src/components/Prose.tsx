import * as React from 'react';
import { cn } from '@dh-araria/shared/utils';

export interface ProseProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds the standard 72-character measure. Disable when composing in a grid. */
  measure?: boolean;
}

/**
 * Long-form typography without pulling in the Typography plugin: headings,
 * lists, tables and links are styled for descendants, and colour comes from
 * the semantic tokens so legal pages stay readable in every theme context.
 */
const Prose = React.forwardRef<HTMLDivElement, ProseProps>(
  ({ className, measure = true, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        measure && 'max-w-[72ch]',
        'text-body text-on-surface',
        '[&_h2]:mt-10 [&_h2]:scroll-mt-28 [&_h2]:font-heading [&_h2]:text-h2 [&_h2]:text-on-surface',
        '[&_h3]:mt-8 [&_h3]:scroll-mt-28 [&_h3]:font-heading [&_h3]:text-h3 [&_h3]:text-on-surface',
        '[&_h4]:mt-6 [&_h4]:text-label [&_h4]:text-on-surface',
        '[&_p]:mt-4 [&_p]:leading-7',
        '[&_a]:font-semibold [&_a]:text-primary-700 [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-primary-800',
        '[&_a]:rounded-sm [&_a:focus-visible]:outline-none [&_a:focus-visible]:ring-2 [&_a:focus-visible]:ring-primary-600 [&_a:focus-visible]:ring-offset-2',
        '[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5',
        '[&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5',
        '[&_li]:leading-7 [&_li]:marker:text-outline',
        '[&_strong]:font-semibold [&_strong]:text-on-surface',
        '[&_blockquote]:mt-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary-300 [&_blockquote]:bg-surface-low [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:text-on-surface-variant',
        '[&_hr]:my-8 [&_hr]:border-outline-variant',
        '[&_table]:mt-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-body-sm',
        '[&_th]:border [&_th]:border-outline-variant [&_th]:bg-surface-high [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold',
        '[&_td]:border [&_td]:border-outline-variant [&_td]:px-3 [&_td]:py-2 [&_td]:align-top',
        '[&_img]:mt-6 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg',
        '[&_code]:rounded [&_code]:bg-surface-container [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

Prose.displayName = 'Prose';

export { Prose };
