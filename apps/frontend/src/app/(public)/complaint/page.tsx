import type { Metadata } from 'next';
import { ComplaintForm } from '@/components/complaints/ComplaintForm';
import { PageBanner } from '@/components/layout/PageBanner';

export const metadata: Metadata = {
  title: 'File a Complaint',
  description:
    'Submit a complaint about any department at District Hospital Araria. You can describe your complaint in writing and attach a photo from your camera.',
};

export default function ComplaintPage() {
  return (
    <div>
      <PageBanner
        eyebrow="Citizen Redressal"
        accent="warning"
        title="File a Complaint"
        description={
          <>
            Tell us about your experience. Select the department, describe your complaint, and
            optionally attach a photo.{' '}
            <strong className="font-semibold text-white">No login or account is needed.</strong>{' '}
            You will receive a reference ID to track its resolution.
          </>
        }
      />

      <ComplaintForm />
    </div>
  );
}
