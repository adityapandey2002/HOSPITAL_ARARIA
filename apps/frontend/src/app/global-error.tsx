'use client';

import { useEffect } from 'react';

import { reportClientError } from '@/lib/telemetry';

/**
 * Last-resort boundary: this replaces the root layout, so it must render its own
 * <html> and <body> and cannot rely on the app's Tailwind stylesheet.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f9fafb',
          color: '#111827',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          padding: '1.5rem',
        }}
      >
        <main id="main-content" style={{ maxWidth: 480, textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>The portal is unavailable</h1>
          <p style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: 1.6 }}>
            We could not load the page. Please retry in a moment. If this persists, call the
            hospital help desk on +91-6453-222123.
          </p>
          {error.digest ? (
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.75rem' }}>
              Reference: <code>{error.digest}</code>
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              background: '#1d4ed8',
              color: '#ffffff',
              border: 0,
              borderRadius: '0.5rem',
              padding: '0.6rem 1.25rem',
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
