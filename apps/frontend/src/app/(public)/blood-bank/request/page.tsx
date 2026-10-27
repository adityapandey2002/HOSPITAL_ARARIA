import type { Metadata } from 'next';
import { Button } from '@dh-araria/ui/components';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blood Request | District Hospital Araria',
  description:
    'Request blood from District Hospital Araria Blood Bank. Contact the blood bank team by phone for assistance.',
};

export default function BloodRequestPage() {
  return (
    <>
      <div>
        <section className="bg-danger-600 py-16 text-white sm:py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <svg
                className="h-8 w-8 text-danger-600 bg-white p-1 rounded-full"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
            <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Request Blood</h1>
            <p className="mx-auto max-w-3xl text-xl text-danger-100">
              Need blood for a patient? Contact the blood bank team directly for availability and
              collection instructions.
            </p>
          </div>
        </section>

        <div className="bg-white py-12">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl">
              <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <h2 className="mb-6 text-xl font-bold text-gray-900">How to request blood</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    Blood requests are handled directly by the hospital blood bank team. Please call
                    the blood bank for availability, compatibility, and collection instructions.
                  </p>
                  <div className="rounded-xl border border-danger-200 bg-danger-50 p-4">
                    <p className="mb-1 text-sm font-medium text-danger-700">For emergencies</p>
                    <p className="text-lg font-bold text-danger-800">
                      Call 102 or 108 and the hospital emergency number immediately. Do not wait for
                      a web form.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <a
                      href="tel:+916453222102"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-danger-600 px-4 py-3 text-lg font-medium text-white transition-colors hover:bg-danger-700"
                    >
                      Call Blood Bank: +91-6453-222102
                    </a>
                    <Link
                      href="/blood-bank"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-lg font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Check blood availability
                    </Link>
                  </div>
                  <p className="text-sm text-gray-500">
                    Blood bank hours: Monday to Saturday, 9:00 AM to 4:00 PM. Emergency services are
                    available 24/7.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
