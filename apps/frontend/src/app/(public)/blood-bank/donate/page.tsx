import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@dh-araria/ui/components';

export const metadata: Metadata = {
  title: 'Blood Donation | District Hospital Araria',
  description:
    'Donate blood at District Hospital Araria Blood Bank. Your donation can save lives. Integrated with e-RaktKosh.',
};

export default function BloodDonatePage() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-gray-50 pt-32">
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
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Blood Donation</h1>
            <p className="mx-auto max-w-3xl text-xl text-danger-100">
              Your blood donation can save up to three lives. Visit our blood bank to donate.
            </p>
          </div>
        </section>

        <div className="bg-white py-12">
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
      </main>
      <Footer />
    </>
  );
}
