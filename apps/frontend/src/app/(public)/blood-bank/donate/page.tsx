import type { Metadata } from 'next';
import { Button } from '@dh-araria/ui/components';
import { PageBanner } from '@/components/layout/PageBanner';

export const metadata: Metadata = {
  title: 'Blood Donation | District Hospital Araria',
  description:
    'Donate blood at District Hospital Araria Blood Bank. Your donation can save lives.',
};

export default function BloodDonatePage() {
  return (
    <>
      <div>
        <PageBanner
          eyebrow="Blood Services"
          accent="danger"
          title="Blood Donation"
          description="Your blood donation can save up to three lives. Visit our blood bank to donate."
        />

        <div className="bg-white py-6 sm:py-8">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Who Can Donate?</h2>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-success-600">✓</span>
                    Age between 18 and 65 years
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-success-600">✓</span>
                    Weight above 45 kg
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-success-600">✓</span>
                    Hemoglobin above 12.5 g/dL
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-success-600">✓</span>
                    Good general health
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Blood Bank Hours</h2>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Monday - Saturday</span>
                    <span>9:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
                <div className="mt-6 p-4 rounded-lg bg-primary-50">
                  <p className="text-sm text-primary-700">
                    Emergency blood requirement? Call <strong>+91-6453-222102</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <a href="/blood-bank">
                <Button className="bg-danger-600 hover:bg-danger-700 text-white px-8 py-3 text-lg">
                  Check Blood Availability
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
