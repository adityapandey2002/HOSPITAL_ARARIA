import type { FeedbackServiceArea, FeedbackStatus } from '@dh-araria/shared/types';

export interface FeedbackListQuery {
  page: number;
  limit: number;
  departmentId?: string;
  status?: FeedbackStatus;
  serviceArea?: FeedbackServiceArea;
  from?: string;
  to?: string;
}

/**
 * Builds the query object for `GET /feedback`, dropping empty filters so the
 * API never receives `status=` or `departmentId=`.
 */
export function toFeedbackQuery(query: FeedbackListQuery): Record<string, unknown> {
  const params: Record<string, unknown> = { page: query.page, limit: query.limit };

  if (query.departmentId) params.departmentId = query.departmentId;
  if (query.status) params.status = query.status;
  if (query.serviceArea) params.serviceArea = query.serviceArea;
  if (query.from) params.from = query.from;
  if (query.to) params.to = query.to;

  return params;
}

/**
 * The API client rejects with the server's plain `ApiError` object rather than
 * an `Error` instance, so check both shapes before falling back.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

/** Formats an API timestamp for display and for the `<time dateTime>` value. */
export function feedbackTimestamp(value: Date | string): { label: string; iso: string } {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { label: 'Unknown date', iso: '' };
  }

  return {
    label: date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    iso: date.toISOString(),
  };
}
