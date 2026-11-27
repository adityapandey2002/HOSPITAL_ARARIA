import { Metadata } from 'next';
import { DepartmentsList } from '@/components/DepartmentsList';
import { EmergencyServices } from '@/components/EmergencyServices';
import { PageBanner } from '@/components/layout/PageBanner';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Explore all medical services and departments at District Hospital Araria. From emergency care to specialized treatments.',
};

export default function ServicesPage() {
  return (
    <div>
      <PageBanner
        eyebrow="Clinical Care"
        accent="primary"
        title="Our Medical Services"
        description="Comprehensive healthcare services across specialized departments, 24×7 emergency care, and hospital diagnostic facilities."
      />

      <DepartmentsList />
      <EmergencyServices />
    </div>
  );
}
