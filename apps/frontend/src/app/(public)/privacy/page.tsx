import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | District Hospital Araria',
  description: 'Privacy policy for the District Hospital Araria website and patient data.',
};

export default function PrivacyPage() {
  return (
    <>
      <div>
        <section className="bg-primary-600 py-12 text-white sm:py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
            <p className="mt-2 text-primary-100">
              Your privacy is important to us. Learn how we collect, use, and protect your data.
            </p>
          </div>
        </section>

        <div className="bg-white py-12">
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
