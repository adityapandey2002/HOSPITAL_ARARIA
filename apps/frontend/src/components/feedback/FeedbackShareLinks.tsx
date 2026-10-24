'use client';

import { useState } from 'react';
import { Check, Copy, Link2 } from 'lucide-react';

import { cn } from '@dh-araria/shared/utils';

interface FeedbackShareLinksProps {
  departments: Array<{ id: string; name: string }>;
}

/**
 * Shareable per-department feedback links.
 *
 * The public form is reachable at `/feedback/<departmentId>`; staff need a way
 * to copy that link (for a QR code, a printed notice, or a WhatsApp message)
 * without knowing the department's UUID.
 */
export function FeedbackShareLinks({ departments }: FeedbackShareLinksProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (departments.length === 0) return null;

  const copy = async (departmentId: string) => {
    setError(null);
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL ?? '');

    const url = `${origin}/feedback/${departmentId}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(departmentId);
      window.setTimeout(
        () => setCopiedId((current) => (current === departmentId ? null : current)),
        2500
      );
    } catch {
      // Clipboard access can be denied (insecure context, permissions). Show the
      // URL instead of failing silently.
      setError(url);
    }
  };

  return (
    <section
      aria-labelledby="feedback-share-heading"
      className="rounded-xl border border-gray-200 bg-white p-5"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary-50 p-2">
          <Link2 className="h-5 w-5 text-primary-700" aria-hidden="true" />
        </div>
        <div>
          <h2 id="feedback-share-heading" className="text-base font-semibold text-gray-900">
            Public feedback links
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Print or share these links. Anyone can submit feedback; no login is needed.
          </p>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-gray-100">
        {departments.map((department) => (
          <li
            key={department.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <span className="text-sm font-medium text-gray-800">{department.name}</span>
            <button
              type="button"
              onClick={() => void copy(department.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                copiedId === department.id
                  ? 'border-success-300 bg-success-50 text-success-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              )}
            >
              {copiedId === department.id ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copy link
                </>
              )}
            </button>
          </li>
        ))}
      </ul>

      <p aria-live="polite" className="sr-only">
        {copiedId ? 'Feedback link copied to clipboard.' : ''}
      </p>

      {error && (
        <p className="mt-3 break-all rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
          Copy this link manually: <span className="font-mono">{error}</span>
        </p>
      )}
    </section>
  );
}
