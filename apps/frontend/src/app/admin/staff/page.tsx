import type { Metadata } from 'next';

import { StaffAccessPanel } from '@/components/admin/StaffAccessPanel';

export const metadata: Metadata = {
  title: 'Staff & Access | Admin Panel',
  description:
    'Create staff accounts and choose the departments whose complaints they can manage.',
  robots: { index: false, follow: false },
};

export default function AdminStaffPage() {
  return <StaffAccessPanel />;
}
