import type { Metadata } from 'next';
import { QualityEventsHub } from '@/components/quality-events/QualityEventsHub';

export const metadata: Metadata = {
  title: 'Quality Events & Readiness | Admin Panel',
  description:
    'Launch hospital-wide NQAS, KAYAKALP, and MUSQAN readiness drives and track department-wise completion.',
  robots: { index: false, follow: false },
};

export default function AdminQualityEventsPage() {
  return <QualityEventsHub />;
}
