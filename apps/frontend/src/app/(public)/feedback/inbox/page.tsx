import type { Metadata } from 'next';
import { FeedbackInbox } from '@/components/feedback/FeedbackInbox';

export const metadata: Metadata = {
  title: 'Feedback inbox',
  description: 'Review citizen feedback for District Hospital Araria.',
  robots: { index: false, follow: false },
};

export default function FeedbackInboxPage() {
  return (
    <>
      <div>
        <section className="bg-primary-700 py-10 text-white sm:py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold sm:text-4xl">Feedback inbox</h1>
            <p className="mt-2 max-w-3xl text-primary-100">
              Review responses from citizens, update their status, and manage which departments each
              staff member can see.
            </p>
          </div>
        </section>

        <FeedbackInbox />
      </div>
    </>
  );
}
