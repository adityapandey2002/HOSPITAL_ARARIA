'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@dh-araria/shared/utils';
import { X } from 'lucide-react';

export type DialogVariant = 'dialog' | 'sheet';
export type DialogSize = 'sm' | 'md' | 'lg';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: DialogVariant;
  size?: DialogSize;
  /** Set when the dialog is purely informational and has no actions. */
  hideClose?: boolean;
  className?: string;
}

const SIZES: Record<DialogSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-3xl',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal built on the WAI-ARIA dialog pattern: portal, scroll lock, Escape,
 * focus trap, initial focus and focus restore. `sheet` renders a bottom sheet
 * on phones and a right-hand drawer from `sm` up.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  variant = 'dialog',
  size = 'md',
  hideClose = false,
  className,
}: DialogProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Keep the latest callback without re-running the open effect on every render.
  const onOpenChangeRef = React.useRef(onOpenChange);
  React.useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  React.useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow, paddingRight } = document.body.style;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    const focusFirst = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const target = panel.querySelector<HTMLElement>(FOCUSABLE);
      (target ?? panel).focus();
    };
    const frame = window.requestAnimationFrame(focusFirst);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChangeRef.current(false);
        return;
      }

      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement
      );

      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!mounted || !open) return null;

  const shell =
    variant === 'sheet'
      ? 'items-end justify-center sm:items-stretch sm:justify-end'
      : 'items-end justify-center sm:items-center';

  const panel =
    variant === 'sheet'
      ? 'max-h-[90dvh] w-full rounded-t-xl sm:h-full sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none'
      : cn('max-h-[90dvh] w-full rounded-t-xl sm:rounded-xl', SIZES[size]);

  return createPortal(
    <div className={cn('fixed inset-0 z-50 flex', shell)}>
      <div
        className="absolute inset-0 bg-on-surface/50 motion-safe:animate-[fadeIn_150ms_ease-out]"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex flex-col overflow-hidden border border-outline-variant bg-card shadow-xl outline-none',
          panel,
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-heading text-h3 text-on-surface">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-body-sm text-on-surface-variant">
                {description}
              </p>
            )}
          </div>
          {!hideClose && (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="-mr-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-body text-on-surface">{children}</div>

        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-outline-variant bg-surface-low px-5 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/** Bottom-sheet alias; same accessibility contract, mobile-first placement. */
export function Sheet(props: DialogProps) {
  return <Dialog {...props} variant="sheet" />;
}
