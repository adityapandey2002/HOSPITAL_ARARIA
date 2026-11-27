import { Metadata } from 'next';
import { NoticesList } from '@/components/NoticesList';
import { PageBanner } from '@/components/layout/PageBanner';

export const metadata: Metadata = {
  title: 'Notices & Announcements',
  description:
    'Latest notices, circulars, recruitment updates, tenders, and public health advisories from District Hospital Araria.',
};

export default function NoticesPage() {
  return (
    <div>
      <PageBanner
        eyebrow="Public Information"
        accent="primary"
        title="Notices & Announcements"
        description="Official circulars, recruitment notices, tenders, and public health advisories from District Hospital Araria."
      />

      <NoticesList />
    </div>
  );
}
