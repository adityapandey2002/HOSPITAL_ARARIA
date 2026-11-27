import type { Metadata } from 'next';
import Link from 'next/link';
import { SimpleFeedbackForm } from '@/components/feedback/SimpleFeedbackForm';
import { PageBanner } from '@/components/layout/PageBanner';

export const metadata: Metadata = {
  title: 'Share your feedback',
  description:
    'Share feedback about your visit to District Hospital Araria. Tell us what you liked and what we can improve.',
};

export default function FeedbackPage() {
  return (
    <div>
      <PageBanner
        eyebrow="Patient Feedback"
        accent="primary"
        title="Share your feedback"
        description="Tell us about your visit to District Hospital Araria. Your feedback helps us improve care for every patient."
      />

      <SimpleFeedbackForm />

        <div className="bg-white pb-12">
          <div className="container mx-auto px-4">
            <p className="mx-auto max-w-3xl text-center text-sm text-gray-500">
              Have a complaint?{' '}
              <Link
                href="/complaint"
                className="rounded font-medium text-primary-700 underline-offset-2 hover:text-primary-800 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                File a complaint
              </Link>{' '}
              | Hospital staff?{' '}
              <Link
                href="/admin/complaints"
                className="rounded font-medium text-primary-700 underline-offset-2 hover:text-primary-800 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Open the complaints admin panel
              </Link>
            </p>
          </div>
        </div>
      </div>
  );
}
