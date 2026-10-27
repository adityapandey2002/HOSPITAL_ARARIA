import type { Metadata } from 'next';
import { EmergencyStrip } from '@/components/home/EmergencyStrip';
import { HomeHero } from '@/components/home/HomeHero';
import { QuickServices } from '@/components/home/QuickServices';
import { DepartmentHighlights } from '@/components/home/DepartmentHighlights';
import { DoctorHighlights } from '@/components/home/DoctorHighlights';
import { BloodHighlights } from '@/components/home/BloodHighlights';
import { NoticeHighlights } from '@/components/home/NoticeHighlights';
import { VisitBand } from '@/components/home/VisitBand';

export const metadata: Metadata = {
  title: { absolute: 'District Hospital Araria | Government of Bihar' },
  description:
    'Book an OPD appointment, find a doctor, check blood availability and read public notices from District Hospital Araria, Bihar.',
};

export default function HomePage() {
  return (
    <>
      <EmergencyStrip />
      <HomeHero />
      <QuickServices />
      <DepartmentHighlights />
      <DoctorHighlights />
      <BloodHighlights />
      <NoticeHighlights />
      <VisitBand />
    </>
  );
}
