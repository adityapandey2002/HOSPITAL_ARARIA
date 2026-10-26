import type { Metadata } from 'next';
import { AdminComplaintsPanel } from '@/components/complaints/AdminComplaintsPanel';

export const metadata: Metadata = {
  title: 'Complaints | Admin Panel',
  description:
    'Track and resolve citizen complaints at District Hospital Araria.',
  robots: { index: false, follow: false },
};

export default function AdminComplaintsPage() {
  return <AdminComplaintsPanel />;
}
