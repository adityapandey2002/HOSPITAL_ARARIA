import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'FAQs | District Hospital Araria',
  description: 'Frequently asked questions about District Hospital Araria services.',
};

export default function FAQsPage() {
  const faqs = [
    {
      q: 'What are the OPD timings?',
      a: 'OPD is open Monday to Saturday, 9:00 AM to 4:00 PM. Emergency services are available 24/7.',
    },
    {
      q: 'How can I book an appointment?',
      a: 'You can book an appointment online through our website, by calling +91-6453-222123, or by visiting the hospital reception.',
    },
    {
      q: 'Is blood available 24/7?',
      a: 'Our blood bank operates Monday to Saturday, 9:00 AM to 5:00 PM. Emergency blood requirements can be addressed by calling +91-6453-222102.',
    },
    {
      q: 'How do I file a complaint?',
      a: 'You can file a complaint through our website complaint form, or visit the hospital administration office. Complaints are tracked and resolved by the HM panel.',
    },
    {
      q: "Can I view my medical records online?",
      a: 'Yes, registered patients can access their medical records through the ABDM-linked patient portal.',
    },
    {
      q: 'What emergency numbers should I call?',
      a: 'For emergencies, call 108 (ambulance) or 102 (patient transport). For blood bank emergencies, call +91-6453-222102.',
    },
  ];

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-gray-50 pt-32">
        <section className="bg-primary-600 py-12 text-white sm:py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold sm:text-4xl">Frequently Asked Questions</h1>
            <p className="mt-2 text-primary-100">
              Find answers to common questions about our hospital services.
            </p>
          </div>
        </section>

        <div className="bg-white py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-6 py-4 text-left bg-gray-50 hover:bg-primary-50 transition-colors"
                  aria-expanded={false}
                  aria-controls={`faq-${index}`}
                  onClick={(e) => {
                    const content = document.getElementById(`faq-${index}`);
                    if (content) {
                      content.hidden = !content.hidden;
                    }
                  }}
                >
                  <h3 className="font-semibold text-gray-900">{faq.q}</h3>
                  <svg
                    className="w-5 h-5 text-gray-400 transition-transform"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                  <div id={`faq-${index}`} hidden className="px-6 pb-4">
                    <p className="text-sm text-gray-600">{faq.a}</p>
                  </div>
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
