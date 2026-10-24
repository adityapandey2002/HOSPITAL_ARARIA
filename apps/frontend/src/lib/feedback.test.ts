import { FeedbackServiceArea, FeedbackStatus } from '@dh-araria/shared/types';

import { feedbackTimestamp, getErrorMessage, toFeedbackQuery } from './feedback';

describe('toFeedbackQuery', () => {
  it('always sends pagination', () => {
    expect(toFeedbackQuery({ page: 2, limit: 25 })).toEqual({ page: 2, limit: 25 });
  });

  it('drops empty filters instead of sending blank query parameters', () => {
    const query = toFeedbackQuery({
      page: 1,
      limit: 10,
      departmentId: '',
      status: undefined,
      serviceArea: undefined,
      from: '',
      to: '',
    });

    expect(query).toEqual({ page: 1, limit: 10 });
    expect(Object.keys(query)).not.toContain('status');
  });

  it('keeps every filter that has a value', () => {
    const query = toFeedbackQuery({
      page: 3,
      limit: 50,
      departmentId: '8a1b3c4d-0000-4000-8000-000000000001',
      status: FeedbackStatus.ACKNOWLEDGED,
      serviceArea: FeedbackServiceArea.LABORATORY,
      from: '2026-10-01',
      to: '2026-10-24',
    });

    expect(query).toEqual({
      page: 3,
      limit: 50,
      departmentId: '8a1b3c4d-0000-4000-8000-000000000001',
      status: 'ACKNOWLEDGED',
      serviceArea: 'LABORATORY',
      from: '2026-10-01',
      to: '2026-10-24',
    });
  });
});

describe('getErrorMessage', () => {
  it('prefers the message of a plain API error object', () => {
    expect(getErrorMessage({ message: 'Department not found' }, 'fallback')).toBe(
      'Department not found'
    );
  });

  it('falls back to an Error instance message', () => {
    expect(getErrorMessage(new Error('Network down'), 'fallback')).toBe('Network down');
  });

  it('ignores blank messages', () => {
    expect(getErrorMessage({ message: '   ' }, 'fallback')).toBe('fallback');
    expect(getErrorMessage({ message: 42 }, 'fallback')).toBe('fallback');
  });

  it('uses the fallback for values with no message at all', () => {
    expect(getErrorMessage(undefined, 'fallback')).toBe('fallback');
    expect(getErrorMessage(null, 'fallback')).toBe('fallback');
    expect(getErrorMessage('a string, not an error', 'fallback')).toBe('fallback');
  });
});

describe('feedbackTimestamp', () => {
  it('returns a display label and an ISO value for a timestamp', () => {
    const { label, iso } = feedbackTimestamp('2026-10-24T10:30:00.000Z');

    expect(label.length).toBeGreaterThan(0);
    expect(iso).toBe('2026-10-24T10:30:00.000Z');
  });

  it('accepts a Date', () => {
    const date = new Date('2026-01-02T03:04:05.000Z');

    expect(feedbackTimestamp(date).iso).toBe(date.toISOString());
  });

  it('degrades to a readable placeholder for an unparseable value', () => {
    expect(feedbackTimestamp('not-a-date')).toEqual({ label: 'Unknown date', iso: '' });
  });
});
