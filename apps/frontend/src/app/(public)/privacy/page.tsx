import type { Metadata } from 'next';
import { PageBanner } from '@/components/layout/PageBanner';

export const metadata: Metadata = {
  title: 'Privacy Policy | District Hospital Araria',
  description: 'Privacy policy for the District Hospital Araria website and patient data.',
};

export default function PrivacyPage() {
  return (
    <>
      <div>
        <PageBanner
          eyebrow="Portal Policies"
          align="left"
          accent="primary"
          title="Privacy Policy"
          description="Learn how District Hospital Araria collects, uses, and safeguards your information."
        />

        <div className="bg-white py-6 sm:py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto prose prose-lg text-gray-700">
              <h2 className="text-xl font-bold text-gray-900 mt-8">1. Information We Collect</h2>
              <p className="mt-2">
                We collect personal information such as name, email, phone number, and health
                information when you register, book appointments, or submit feedback through our
                website.
              </p>

              <h2 className="text-xl font-bold text-gray-900 mt-8">2. How We Use Your Information</h2>
              <p className="mt-2">
                We use your information to provide healthcare services, manage appointments, send
                notifications, and improve our services. Your health data is handled with strict
                confidentiality.
              </p>

              <h2 className="text-xl font-bold text-gray-900 mt-8">3. Data Sharing</h2>
              <p className="mt-2">
                We do not sell or share your personal information with third parties except as
                required by law or for healthcare delivery purposes.
              </p>

              <h2 className="text-xl font-bold text-gray-900 mt-8">4. Data Security</h2>
              <p className="mt-2">
                We implement appropriate security measures to protect your data from unauthorized
                access, disclosure, or destruction.
              </p>

              <h2 className="text-xl font-bold text-gray-900 mt-8">5. Your Rights</h2>
              <p className="mt-2">
                You have the right to access, correct, or delete your personal information. Contact
                us to exercise these rights.
              </p>

              <h2 className="text-xl font-bold text-gray-900 mt-8">6. Contact</h2>
              <p className="mt-2 mb-8">
                For privacy-related queries, contact us at dh.araria@bihar.gov.in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
