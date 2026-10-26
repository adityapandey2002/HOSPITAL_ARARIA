import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service | District Hospital Araria',
  description: 'Terms of service for using the District Hospital Araria website and portal.',
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-gray-50 pt-32">
        <section className="bg-primary-600 py-12 text-white sm:py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold sm:text-4xl">Terms of Service</h1>
            <p className="mt-2 text-primary-100">
              Please read these terms carefully before using our website and services.
            </p>
          </div>
        </section>

        <div className="bg-white py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto prose prose-lg text-gray-700">
              <h2 className="text-xl font-bold text-gray-900 mt-8">1. Acceptance of Terms</h2>
              <p className="mt-2">
                By accessing and using the District Hospital Araria website, you agree to be bound
                by these terms of service and all applicable laws and regulations.
              </p>

              <h2 className="text-xl font-bold text-gray-900 mt-8">2. Use of Website</h2>
              <p className="mt-2">
                This website provides information about hospital services, doctor appointments,
                blood bank availability, and other healthcare services. You may not use this website
                for any illegal or unauthorized purpose.
              </p>

              <h2 className="text-xl font-bold text-gray-900 mt-8">3. Appointments</h2>
              <p className="mt-2">
                Appointment bookings made through this website are subject to availability and
                confirmation by the hospital. We reserve the right to reschedule or cancel
                appointments as needed.
              </p>

              <h2 className="text-xl font-bold text-gray-900 mt-8">4. Data Privacy</h2>
              <p className="mt-2">
                Your personal information is handled in accordance with our Privacy Policy and
                applicable data protection laws.
              </p>

              <h2 className="text-xl font-bold text-gray-900 mt-8">5. Limitation of Liability</h2>
              <p className="mt-2">
                District Hospital Araria is not liable for any indirect, incidental, or
                consequential damages arising from the use of this website.
              </p>

              <h2 className="text-xl font-bold text-gray-900 mt-8">6. Governing Law</h2>
              <p className="mt-2">
                These terms are governed by the laws of India. Any disputes shall be subject to the
                jurisdiction of courts in Araria, Bihar.
              </p>

              <h2 className="text-xl font-bold text-gray-900 mt-8">7. Contact</h2>
              <p className="mt-2 mb-8">
                For questions about these terms, contact us at dh.araria@bihar.gov.in.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
