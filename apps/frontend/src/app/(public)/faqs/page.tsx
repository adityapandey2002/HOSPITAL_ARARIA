import type { Metadata } from 'next';
import { FAQsContent } from './FAQsContent';

export const metadata: Metadata = {
  title: 'FAQs | District Hospital Araria',
  description: 'Frequently asked questions about District Hospital Araria services.',
};

export default function FAQsPage() {
  return (
    <>
      <div>
        <FAQsContent />
      </div>
    </>
  );
}
