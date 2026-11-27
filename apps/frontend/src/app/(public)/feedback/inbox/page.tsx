import type { Metadata } from 'next';
import { FeedbackInbox } from '@/components/feedback/FeedbackInbox';
import { PageBanner } from '@/components/layout/PageBanner';

export const metadata: Metadata = {
  title: 'Feedback inbox',
  description: 'Review citizen feedback for District Hospital Araria.',
  robots: { index: false, follow: false },
};

export default function FeedbackInboxPage() {
  return (
    <div>
      <PageBanner
        eyebrow="Staff Feedback"
        align="left"
        accent="primary"
        title="Feedback inbox"
        description="Review responses from citizens, update their status, and manage which departments each staff member can see."
      />

      <FeedbackInbox />
    </div>
  );
}
