import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api, handleApiResponse } from '@/lib/api';
import { cn } from '@dh-araria/shared/utils';

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

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
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

  return (
    <>
      <div>
        <section className="bg-primary-600 py-12 text-white sm:py-16">
          <div className="container mx-auto px-4">
            <div className="mb-4 flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium uppercase',
                  PRIORITY_COLORS[notice.priority] ?? 'bg-gray-100 text-gray-800'
                )}
              >
                {notice.priority}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium uppercase bg-primary-50 text-primary-700'
                )}
              >
                {CATEGORY_LABELS[notice.category] ?? notice.category}
              </span>
            </div>
            <h1 className="mb-4 text-3xl font-bold sm:text-4xl">{notice.title}</h1>
            <p className="text-primary-100">
              Published on {new Date(notice.publishedAt).toLocaleDateString('en-IN')}
            </p>
          </div>
        </section>

        <div className="bg-white py-12">
          <div className="container mx-auto px-4">
            <article className="max-w-3xl mx-auto prose prose-lg text-gray-700">
              <div
                className="whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: notice.content }}
              />
            </article>

            {notice.attachmentUrl && (
              <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <a
                  href={notice.attachmentUrl}
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📎 Download Attachment
                </a>
              </div>
            )}

            <div className="mt-8 flex justify-between items-center">
              <Link
                href="/notices"
                className="text-primary-700 font-medium hover:text-primary-800 hover:underline"
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
