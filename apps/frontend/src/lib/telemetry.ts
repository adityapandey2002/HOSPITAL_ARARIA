/**
 * Client-side error reporting.
 *
 * Errors go to the backend's `/client-errors` endpoint, which writes a
 * structured, PII-free log line that Vercel (or any log drain) can alert on.
 * Reporting is best-effort: a failed report must never mask the original error.
 */

export interface ClientErrorContext {
  /** Next.js error digest, when the error came from a server component. */
  digest?: string;
  /** Route where the error surfaced, e.g. `/feedback/inbox`. */
  path?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

/** Keep payloads small enough for `keepalive` requests. */
const MAX_MESSAGE_LENGTH = 500;
const MAX_STACK_LENGTH = 4000;

export function reportClientError(error: unknown, context: ClientErrorContext = {}): void {
  if (typeof window === 'undefined') return;

  const normalized = toError(error);

  const payload = {
    message: normalized.message.slice(0, MAX_MESSAGE_LENGTH),
    stack: normalized.stack?.slice(0, MAX_STACK_LENGTH),
    digest: context.digest,
    path: context.path ?? window.location.pathname,
    userAgent: navigator.userAgent,
    occurredAt: new Date().toISOString(),
  };

  try {
    void fetch(`${API_BASE_URL}/client-errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      // The report is anonymous; never attach credentials.
      credentials: 'omit',
    }).catch(() => undefined);
  } catch {
    // fetch can throw synchronously in exotic environments; ignore.
  }
}

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  return new Error('Unknown client error');
}
