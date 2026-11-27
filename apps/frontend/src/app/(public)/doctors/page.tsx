import { Metadata } from 'next';
import { DoctorsList } from '@/components/DoctorsList';
import { PageBanner } from '@/components/layout/PageBanner';

export const metadata: Metadata = {
  title: 'Our Doctors',
  description:
    'Meet our specialist doctors across hospital departments at District Hospital Araria. View profiles, qualifications, and book appointments.',
};

export default function DoctorsPage() {
  return (
    <div>
      <PageBanner
        eyebrow="Specialist OPD"
        accent="primary"
        title="Our Specialist Doctors"
        description="Qualified and experienced medical professionals serving Araria district across outpatient and emergency departments."
      />

      <DoctorsList />
    </div>
  );
}
