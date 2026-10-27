import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FAQsContent } from './FAQsContent';

export const metadata: Metadata = {
  title: 'FAQs | District Hospital Araria',
  description: 'Frequently asked questions about District Hospital Araria services.',
};

export default function FAQsPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-gray-50 pt-32">
        <FAQsContent />
      </main>
      <Footer />
    </>
  );
}
