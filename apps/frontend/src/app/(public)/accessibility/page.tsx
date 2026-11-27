import type { Metadata } from 'next';
import { PageBanner } from '@/components/layout/PageBanner';

export const metadata: Metadata = {
  title: 'Accessibility Statement | District Hospital Araria',
  description: 'Accessibility statement for District Hospital Araria website.',
};

export default function AccessibilityPage() {
  return (
    <>
      <div>
        <PageBanner
          eyebrow="Portal Policies"
          align="left"
          accent="primary"
          title="Accessibility Statement"
          description="District Hospital Araria is committed to providing an accessible website for all citizens."
        />

        <div className="bg-white py-6 sm:py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto prose prose-lg text-gray-700">
              <h2 className="text-xl font-bold text-gray-900 mt-8">Our Commitment</h2>
              <p className="mt-2">
                We strive to ensure that our website is accessible to people with disabilities and
                complies with the Guidelines for Indian Government Websites (GIGW) 3.0 and WCAG 2.1
                standards.
              </p>

              <h2 className="text-xl font-bold text-gray-900 mt-8">Accessibility Features</h2>
              <ul className="list-disc list-inside space-y-3 text-gray-600 mt-4">
                <li>Keyboard navigable interface</li>
                <li>Screen reader compatible content</li>
                <li>High contrast color scheme</li>
                <li>Resizable text and responsive layout</li>
                <li>Alternative text for images</li>
                <li>Skip to main content link</li>
              </ul>

              <h2 className="text-xl font-bold text-gray-900 mt-8">Contact</h2>
              <p className="mt-2 mb-8">
                If you encounter accessibility barriers on our website, please contact us at
                dh.araria@bihar.gov.in or call +91-6453-222123.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
