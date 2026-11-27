import type { Metadata } from 'next';
import { PageBanner } from '@/components/layout/PageBanner';

export const metadata: Metadata = {
  title: 'Terms of Service | District Hospital Araria',
  description: 'Terms of service for using the District Hospital Araria website and portal.',
};

export default function TermsPage() {
  return (
    <>
      <div>
        <PageBanner
          eyebrow="Portal Policies"
          align="left"
          accent="primary"
          title="Terms of Service"
          description="Terms governing use of the District Hospital Araria website and digital services."
        />

        <div className="bg-white py-6 sm:py-8">
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
      </div>
    </>
  );
}
