import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Insurance & Schemes | District Hospital Araria',
  description: 'Health insurance schemes and coverage accepted at District Hospital Araria.',
};

export default function InsurancePage() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-gray-50 pt-32">
        <section className="bg-primary-600 py-12 text-white sm:py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold sm:text-4xl">Insurance &amp; Schemes</h1>
            <p className="mt-2 text-primary-100">
              We accept various government and private health insurance schemes.
            </p>
          </div>
        </section>

        <div className="bg-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: 'Ayushman Bharat PM-JAY',
                  desc: 'Pradhan Mantri Jan Arogya Yojana - Health coverage for economically vulnerable families.',
                },
                {
                  name: 'Central Government Health Scheme',
                  desc: 'CGHS benefits for central government employees and pensioners.',
                },
                {
                  name: 'Bihar State Health Insurance',
                  desc: 'State-sponsored health insurance for residents of Bihar.',
                },
                {
                  name: 'ESIC',
                  desc: "Employees' State Insurance Corporation coverage for insured workers.",
                },
                {
                  name: 'Private Insurance',
                  desc: 'Major private health insurance providers accepted.',
                },
                {
                  name: 'Cashless Claims',
                  desc: 'Cashless hospitalization for empanelled insurance companies.',
                },
              ].map((scheme) => (
                <div
                  key={scheme.name}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-lg font-bold text-gray-900">{scheme.name}</h3>
                  <p className="mt-2 text-sm text-gray-600">{scheme.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
