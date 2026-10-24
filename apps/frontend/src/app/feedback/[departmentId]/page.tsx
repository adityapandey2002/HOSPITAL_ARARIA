import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';

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
      <Header />
      <main id="main-content" className="min-h-screen bg-gray-50 pt-32">
        <section className="bg-primary-700 py-12 text-white sm:py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
              <MessageSquare className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold sm:text-4xl">How was your visit?</h1>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-primary-100">
              Share anonymous feedback about the department you visited. It only takes a minute and
              helps us improve hospital services.
            </p>
          </div>
        </section>

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
      </main>
      <Footer />
    </>
  );
}
