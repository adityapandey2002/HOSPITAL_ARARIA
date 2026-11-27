import type { Metadata } from 'next';
import Link from 'next/link';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { PageBanner } from '@/components/layout/PageBanner';

export const metadata: Metadata = {
  title: 'Department feedback',
  description:
    'Share anonymous feedback about your visit to a District Hospital Araria department. This link opens the feedback form with your department preselected.',
};

interface DepartmentFeedbackPageProps {
  params: Promise<{ departmentId: string }>;
}

export default async function DepartmentFeedbackPage({ params }: DepartmentFeedbackPageProps) {
  const { departmentId } = await params;

  return (
    <>
      <div>
        <PageBanner
          eyebrow="Patient Feedback"
          accent="primary"
          title="How was your visit?"
          description="Share anonymous feedback about the department you visited. It only takes a minute and helps us improve hospital services."
        />

        <FeedbackForm initialDepartmentId={departmentId} />

        <div className="bg-white pb-12">
          <div className="container mx-auto px-4">
            <p className="mx-auto max-w-3xl text-center text-sm text-gray-500">
              Need feedback for another department?{' '}
              <Link
                href="/feedback"
                className="rounded font-medium text-primary-700 underline-offset-2 hover:text-primary-800 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Open the general feedback form
              </Link>
            </p>
            <p className="mx-auto mt-2 max-w-3xl text-center text-sm text-gray-500">
              Hospital staff?{' '}
              <Link
                href="/feedback/inbox"
                className="rounded font-medium text-primary-700 underline-offset-2 hover:text-primary-800 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Open the staff feedback inbox
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
