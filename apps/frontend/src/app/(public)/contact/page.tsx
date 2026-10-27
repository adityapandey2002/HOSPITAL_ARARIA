import { Metadata } from 'next';
import { ContactPage } from '@/components/ContactPage';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Contact District Hospital Araria. Find our address, phone numbers, email, and get directions. Emergency services available 24/7.',
};

export default function ContactPageWrapper() {
  return (
    <>
      <div>
        <section className="bg-primary-600 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Contact Us</h1>
            <p className="mx-auto max-w-3xl text-xl text-primary-100">
              We&rsquo;re here to help. Reach out to us for appointments, inquiries, or emergency
              assistance.
            </p>
          </div>
        </section>

        <ContactPage />
      </div>
    </>
  );
}
