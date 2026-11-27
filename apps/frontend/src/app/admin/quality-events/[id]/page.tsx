import type { Metadata } from 'next';
import { Suspense } from 'react';
import { QualityEventChecklistView } from '@/components/quality-events/QualityEventChecklistView';

export const metadata: Metadata = {
  title: 'Event Checklist | Quality Events',
  description: 'Department-wise readiness checklist for active hospital quality events.',
  robots: { index: false, follow: false },
};

export default function QualityEventTasksPage() {
  return (
    <Suspense fallback={<p className="py-6 text-sm text-gray-500">Loading checklist…</p>}>
      <QualityEventChecklistView />
    </Suspense>
  );
}
