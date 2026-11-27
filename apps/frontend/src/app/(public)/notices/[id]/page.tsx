import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api, handleApiResponse } from '@/lib/api';
import { isDisplayableImageUrl } from '@/lib/complaint-image';
import { cn } from '@dh-araria/shared/utils';
import { PageBanner } from '@/components/layout/PageBanner';

interface NoticeDetail {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  publishedAt: Date;
  expiresAt?: Date | null;
  isPublished: boolean;
  attachmentUrl?: string | null;
  /** Scanned pages attached by the desk, as data URLs. */
  imageUrls?: string[] | null;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NoticePageProps {
  params: Promise<{ id: string }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'General',
  RECRUITMENT: 'Recruitment',
  TENDER: 'Tender',
  PUBLIC_HEALTH: 'Public Health Advisory',
  SCHEDULE_CHANGE: 'Schedule Change',
  EMERGENCY: 'Emergency Alert',
};

// Badge fills from the measured pairs in docs/DESIGN_SYSTEM.md §4. LOW is
// deliberately neutral; severity is also printed as text, never colour alone.
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-surface-container text-on-surface',
  MEDIUM: 'bg-primary-50 text-primary-700',
  HIGH: 'bg-warning-50 text-warning-800',
  CRITICAL: 'bg-danger-100 text-danger-800',
};

const FALLBACK_TITLE = 'Notice | District Hospital Araria';

export async function generateMetadata({ params }: NoticePageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const response = await api.get<NoticeDetail>(`/notices/${id}`);
    const record = handleApiResponse(response);

    if (record) {
      return {
        title: record.title,
        description: record.content.slice(0, 160),
      };
    }
  } catch {
    // Fall back to the static title when the record cannot be fetched.
  }

  return { title: FALLBACK_TITLE };
}

export default async function NoticePage({ params }: NoticePageProps) {
  const { id } = await params;

  let notice: NoticeDetail | null = null;

  try {
    const response = await api.get<NoticeDetail>(`/notices/${id}`);
    notice = handleApiResponse(response) ?? null;
  } catch {
    // Fall through to notFound
  }

  if (!notice || !notice.isPublished) {
    notFound();
  }

  // Legacy or hand-edited rows may hold values no browser can render.
  const scannedPages = (notice.imageUrls ?? []).filter(isDisplayableImageUrl);

  return (
    <>
      <div>
        <PageBanner
          align="left"
          accent={notice.priority === 'CRITICAL' ? 'danger' : notice.priority === 'HIGH' ? 'warning' : 'primary'}
          meta={
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-medium uppercase',
                  PRIORITY_COLORS[notice.priority] ?? 'bg-surface-container text-on-surface'
                )}
              >
                {notice.priority}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-0.5 text-xs font-medium uppercase text-white">
                {CATEGORY_LABELS[notice.category] ?? notice.category}
              </span>
            </div>
          }
          title={notice.title}
          description={`Published on ${new Date(notice.publishedAt).toLocaleDateString('en-IN')}`}
        />

        <div className="bg-surface py-6 sm:py-8">
          <div className="container mx-auto px-4">
            <article className="prose prose-lg mx-auto max-w-3xl text-on-surface-variant">
              <div className="whitespace-pre-line">{notice.content}</div>
            </article>

            {scannedPages.length > 0 && (
              <section className="mx-auto mt-8 max-w-3xl" aria-label="Scanned notice pages">
                <h2 className="text-lg font-semibold text-on-surface">Scanned notice</h2>
                <ul className="mt-3 space-y-4">
                  {scannedPages.map((url, index) => (
                    <li key={`scan-${index}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Scanned page ${index + 1} of ${notice.title}`}
                        className="w-full rounded-xl border border-outline-variant bg-card"
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {notice.attachmentUrl && (
              <div className="mt-8 rounded-xl border border-outline-variant bg-surface-low p-4">
                <a
                  href={notice.attachmentUrl}
                  className="flex items-center gap-2 font-medium text-primary-600 hover:text-primary-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📎 Download Attachment
                </a>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <Link
                href="/notices"
                className="font-medium text-primary-700 hover:text-primary-800 hover:underline"
              >
                ← Back to Notices
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
