'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, BellRing, ChevronRight, ArrowRight } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  Section,
  Skeleton,
  SkeletonRegion,
} from '@dh-araria/ui/components';
import { cn, formatDate } from '@dh-araria/shared/utils';
import { api } from '@/lib/api';

interface NoticeSummary {
  id: string;
  title: string;
  category: string;
  priority: string;
  publishedAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'General',
  RECRUITMENT: 'Recruitment',
  TENDER: 'Tender',
  PUBLIC_HEALTH: 'Public health',
  SCHEDULE_CHANGE: 'Schedule change',
  EMERGENCY: 'Emergency',
};

const CATEGORY_STYLES: Record<string, string> = {
  GENERAL: 'bg-surface-container text-on-surface-variant',
  RECRUITMENT: 'bg-primary-100 text-primary-800',
  TENDER: 'bg-secondary-100 text-secondary-800',
  PUBLIC_HEALTH: 'bg-warning-100 text-warning-900',
  SCHEDULE_CHANGE: 'bg-warning-100 text-warning-900',
  EMERGENCY: 'bg-danger-100 text-danger-800',
};

const HOME_NOTICE_COUNT = 3;

export function NoticeHighlights() {
  const [notices, setNotices] = useState<NoticeSummary[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await api.get<NoticeSummary[]>('/notices/published', { limit: 50 });
      setNotices(response.success ? (response.data ?? []) : []);
      setStatus('ready');
    } catch {
      setNotices([]);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = notices.slice(0, HOME_NOTICE_COUNT);

  return (
    <Section
      tone="surface"
      spacing="md"
      eyebrow="Public information"
      title="Notices and circulars"
      description="Orders, tenders, recruitment and public-health notices published by the hospital."
      action={
        <Link
          href="/notices"
          className="inline-flex min-h-9 items-center gap-1 rounded text-label text-primary-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
        >
          All notices
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      }
    >
      {status === 'loading' && (
        <SkeletonRegion label="Loading notices" className="space-y-3">
          {Array.from({ length: HOME_NOTICE_COUNT }).map((_, index) => (
            <div key={index} className="rounded-xl border border-outline-variant bg-card p-4">
              <Skeleton variant="text" className="w-24" />
              <Skeleton className="mt-3" lines={2} />
            </div>
          ))}
        </SkeletonRegion>
      )}

      {status === 'error' && (
        <ErrorState
          size="compact"
          title="Notices could not be loaded"
          description="The notice feed is temporarily unavailable. Please try again in a moment."
          onRetry={() => void load()}
          fallbackHref="/notices"
          fallbackLabel="Open notices"
        />
      )}

      {status === 'ready' && visible.length === 0 && (
        <EmptyState
          size="compact"
          icon={<Bell className="h-5 w-5" />}
          title="No notices published"
          description="New circulars and public notices will appear here as soon as they are issued."
        />
      )}

      {status === 'ready' && visible.length > 0 && (
        <ul className="divide-y divide-outline-variant overflow-hidden rounded-xl border border-outline-variant bg-card">
          {visible.map((notice) => {
            const urgent = notice.priority === 'HIGH' || notice.priority === 'CRITICAL';
            return (
              <li key={notice.id}>
                <Link
                  href={`/notices/${notice.id}`}
                  className="flex items-start gap-3 p-4 transition-colors hover:bg-surface-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600 sm:items-center sm:gap-4"
                >
                  {urgent ? (
                    <BellRing
                      className="mt-0.5 h-5 w-5 shrink-0 text-danger-600 sm:mt-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <Bell
                      className="mt-0.5 h-5 w-5 shrink-0 text-on-surface-variant sm:mt-0"
                      aria-hidden="true"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'rounded px-2 py-0.5 text-label-sm',
                          CATEGORY_STYLES[notice.category] ??
                            'bg-surface-container text-on-surface-variant'
                        )}
                      >
                        {CATEGORY_LABELS[notice.category] ?? notice.category}
                      </span>
                      <time
                        dateTime={notice.publishedAt}
                        className="text-label-sm font-normal text-on-surface-variant"
                      >
                        {formatDate(notice.publishedAt)}
                      </time>
                    </div>
                    <p className="mt-1 line-clamp-2 text-label text-on-surface">{notice.title}</p>
                  </div>

                  <ChevronRight
                    className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant sm:mt-0"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
