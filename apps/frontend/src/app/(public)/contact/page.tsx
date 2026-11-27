import { Metadata } from 'next';
import { ContactPage } from '@/components/ContactPage';
import { PageBanner } from '@/components/layout/PageBanner';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Contact District Hospital Araria. Find our address, phone numbers, email, and get directions. Emergency services available 24/7.',
};

export default function ContactPageWrapper() {
  return (
    <div>
      <PageBanner
        eyebrow="Helpdesk & Location"
        accent="primary"
        title="Contact Us"
        description="Reach out to District Hospital Araria for appointments, hospital inquiries, directions, or emergency assistance."
      />

      <ContactPage />
    </div>
  );
}
