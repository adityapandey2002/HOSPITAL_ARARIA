import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@dh-araria/ui/components';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blood Request | District Hospital Araria',
  description:
    'Request blood from District Hospital Araria Blood Bank. Integrated with e-RaktKosh for real-time availability.',
};

export default function BloodRequestPage() {
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
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
            <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Request Blood</h1>
            <p className="mx-auto max-w-3xl text-xl text-danger-100">
              Need blood for a patient? Submit a request and our blood bank team will assist you.
            </p>
          </div>
        </section>

        <div className="bg-white py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Blood Request Form</h2>
                <form className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Patient Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter patient name"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger-500"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Blood Group
                      </label>
                      <select
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger-500"
                      >
                        <option>A+</option>
                        <option>A-</option>
                        <option>B+</option>
                        <option>B-</option>
                        <option>AB+</option>
                        <option>AB-</option>
                        <option>O+</option>
                        <option>O-</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Units Required
                      </label>
                      <input
                        type="number"
                        placeholder="1"
                        min="1"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Hospital / Ward
                      </label>
                      <input
                        type="text"
                        placeholder="Enter hospital or ward name"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Urgency
                      </label>
                      <select
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-danger-500"
                      >
                        <option>Routine</option>
                        <option>Urgent</option>
                        <option>Emergency</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button type="submit" className="w-full bg-danger-600 hover:bg-danger-700 text-white py-3 text-lg">
                      Submit Request
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
