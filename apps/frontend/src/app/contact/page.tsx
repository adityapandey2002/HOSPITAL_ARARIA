import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ContactPage } from '@/components/ContactPage';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Contact District Hospital Araria. Find our address, phone numbers, email, and get directions. Emergency services available 24/7.',
};

export default function ContactPageWrapper() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen pt-32">
        <section className="bg-primary-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              We're here to help. Reach out to us for appointments, inquiries, or emergency assistance.
            </p>
          </div>
        </section>

        <ContactPage />
      </main>
      <Footer />
    </>
  );
}