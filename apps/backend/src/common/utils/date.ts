/**
 * Calendar-date helpers for hospital scheduling.
 *
 * "A date" in the appointments domain means a calendar day, not an instant.
 * Storing the instant a client happened to send makes equality checks fail —
 * `2026-10-23T00:00:00Z` and `2026-10-23T09:15:00Z` are the same OPD day but
 * different `timestamptz` values — so every write is normalised to UTC midnight
 * and every range filter uses a half-open `[start, nextDay)` window.
 *
 * Clients should send `YYYY-MM-DD`. The UTC anchor is deliberate: it gives the
 * same stored value regardless of the server's local timezone.
 */

/** Midnight UTC on the calendar day that `input` falls in. */
export function startOfUtcDay(input: Date | string): Date {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Invalid date: ${String(input)}`);
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** `date` shifted by whole days, keeping the UTC-midnight anchor. */
export function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
