import type { Metadata } from 'next';
import { ComplaintForm } from '@/components/complaints/ComplaintForm';

export const metadata: Metadata = {
  title: 'File a Complaint',
  description:
    'Submit a complaint about any department at District Hospital Araria. You can describe your complaint in writing and attach a photo from your camera.',
};

export default function ComplaintPage() {
  return (
    <>
      <div>
        <section className="bg-warning-600 py-16 text-white sm:py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
              <svg
                className="h-7 w-7 text-warning-600 bg-white p-1 rounded-full"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h1 className="mb-4 text-4xl font-bold sm:text-5xl">File a Complaint</h1>
            <p className="mx-auto max-w-3xl text-xl text-warning-100">
              Tell us about your experience. Select the department, describe your complaint, and
              optionally attach a photo. Your complaint will be tracked by the hospital
              administration until it is resolved.
            </p>
          </div>
        </section>

        <ComplaintForm />
      </div>
    </>
  );
}
