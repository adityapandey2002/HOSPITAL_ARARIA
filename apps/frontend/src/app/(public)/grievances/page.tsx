import { Metadata } from 'next';
import { GrievanceForm } from '@/components/GrievanceForm';
import { PageBanner } from '@/components/layout/PageBanner';

export const metadata: Metadata = {
  title: 'Grievance Redressal',
  description:
    'File complaints and track grievance status at District Hospital Araria. Transparent resolution by the hospital administration.',
};

export default function GrievancesPage() {
  return (
    <div>
      <PageBanner
        eyebrow="Citizen Redressal"
        accent="warning"
        title="Grievance Redressal"
        description="File complaints, track status, and get timely resolution through the hospital's transparent 30-day redressal timeline."
      />

      <GrievanceForm />
    </div>
  );
}
